import os
import re
import json
import asyncio
from typing import Dict, List, Optional
from fastapi import FastAPI, Depends, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session, joinedload
import google.generativeai as genai
from dotenv import load_dotenv
import uvicorn
import importlib
import pkgutil

from database import SessionLocal, create_db_and_tables, get_db
from database import Team, InventoryItem, ChatHistory

# Force create DB on startup
create_db_and_tables()

app = FastAPI(title="GCP Virtual Escape Room Backend")

# --- Room Loading ---
ROOM_CONFIGS = {}
ROOM_HANDLERS = {
    'terminal': None,
    'books': None,
    'room_specific': {} # Key: room_id, Value: handler_function
}

def load_rooms():
    """Dynamically imports all room modules from the 'rooms' package."""
    import rooms
    for _, name, _ in pkgutil.iter_modules(rooms.__path__, rooms.__name__ + "."):
        module = importlib.import_module(name)
        
        # Load Config
        if hasattr(module, 'ROOM_CONFIG'):
            ROOM_CONFIGS.update(module.ROOM_CONFIG)
            
            # Load Room-Specific Handler (mapped by room_id)
            if hasattr(module, 'handle_room_item'):
                for room_id in module.ROOM_CONFIG.keys():
                    ROOM_HANDLERS['room_specific'][room_id] = module.handle_room_item

        # Load Global Handlers (last one wins, usually standard across rooms)
        if hasattr(module, 'handle_terminal'):
            ROOM_HANDLERS['terminal'] = module.handle_terminal
        if hasattr(module, 'handle_books'):
            ROOM_HANDLERS['books'] = module.handle_books

load_rooms()
ROOM_ORDER = ["databricks-room", "snowflake-room"]

# Configuration
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("Warning: GEMINI_API_KEY not found in .env file.")

genai.configure(api_key=API_KEY)
MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-2.5-pro")

origins = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8000", "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- Tools ---

def check_inventory(team_id: int) -> List[str]:
    """Checks the inventory for a specific team and returns a list of item names."""
    db = SessionLocal()
    try:
        items = db.query(InventoryItem).filter(InventoryItem.team_id == team_id).all()
        return [item.name for item in items]
    finally:
        db.close()

# --- Pydantic Models ---

class InventoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str
    icon: str

class TeamInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    game_state: Dict
    inventory: List[InventoryItemResponse]

# --- Helper Functions ---

def process_ai_response(ai_text: str, team: Team, item_id: str, db: Session):
    """Parses AI text for state updates and actions, updating the DB accordingly."""
    
    updates = {}
    
    # 1. Handle State Updates (Iterate over ALL matches)
    # pattern: [STATE_UPDATE: key=value]
    state_pattern = r"\[STATE_UPDATE:\s*(.+?)\]"
    for match in re.finditer(state_pattern, ai_text):
        state_str = match.group(1).strip()
        print(f"DEBUG: Processing State Update: {state_str}")
        
        if "=" in state_str:
            key, value = state_str.split("=", 1)
            current_state = dict(team.game_state)
            key, value = key.strip(), value.strip()
            
            if value.lower() == 'true': final_value = True
            elif value.lower() == 'false': final_value = False
            elif value.isdigit(): final_value = int(value)
            else: final_value = value
                
            current_state[key] = final_value
            team.game_state = current_state
            updates[key] = final_value
            
            # Special Trigger for Terminal
            if key == 'terminal_stage' and final_value == 'UNLOCKED':
                current_state["room_completed"] = True
                team.game_state = current_state
                updates["room_completed"] = True

    # Remove all STATE_UPDATE tags from the text
    ai_text = re.sub(state_pattern, "", ai_text).strip()

    # 2. Handle Inventory Actions (Iterate over ALL matches)
    # pattern: [ACTION: ADD_ITEM(...)] or [ACTION: REMOVE_ITEM(...)]
    action_pattern = r"\[ACTION:\s*(.+?)\]"
    for match in re.finditer(action_pattern, ai_text):
        action_str = match.group(1).strip()
        print(f"DEBUG: Processing Action: {action_str}")

        if action_str.startswith("ADD_ITEM"):
            # Flexible regex to handle quotes and whitespace
            # Matches: ADD_ITEM(Name, Icon)
            item_match = re.search(r"ADD_ITEM\(\s*['\"]?(.+?)['\"]?\s*,\s*['\"]?(.+?)['\"]?\s*\)", action_str)
            if item_match:
                item_name, item_icon = item_match.groups()
                print(f"DEBUG: Adding Item: {item_name}, Icon: {item_icon}")
                exists = db.query(InventoryItem).filter_by(name=item_name.strip(), team_id=team.id).first()
                if not exists:
                    new_item = InventoryItem(name=item_name.strip(), icon=item_icon.strip(), team_id=team.id)
                    db.add(new_item)
            else:
                print(f"DEBUG: Failed to parse ADD_ITEM: {action_str}")
                
        elif action_str.startswith("REMOVE_ITEM"):
            item_name = action_str.replace("REMOVE_ITEM(", "").replace(")", "").strip()
            item_to_remove = db.query(InventoryItem).filter_by(name=item_name, team_id=team.id).first()
            if item_to_remove:
                db.delete(item_to_remove)
    
    # Remove all ACTION tags from the text
    ai_text = re.sub(action_pattern, "", ai_text).strip()
    
    # Save Cleaned Text to Chat History
    db.add(ChatHistory(team_id=team.id, item_id=item_id, role="model", content=ai_text))
    
    return ai_text, updates

# --- Endpoints ---

@app.get("/api/room/{room_id}")
def get_room_config(room_id: str):
    if room_id not in ROOM_CONFIGS:
        raise HTTPException(status_code=404, detail="Room not found")
    return ROOM_CONFIGS[room_id]

@app.post("/register", response_model=TeamInfo)
async def register_team(name: str = Form(...), db: Session = Depends(get_db)):
    if not name.strip():
        raise HTTPException(status_code=400, detail="Team name cannot be empty.")
    
    existing_team = db.query(Team).options(joinedload(Team.inventory)).filter(Team.name == name).first()
    if existing_team:
        raise HTTPException(status_code=400, detail="Team name already exists.")
    
    new_team = Team(name=name, game_state={"current_room": ROOM_ORDER[0]}, inventory=[])
    db.add(new_team)
    db.commit()
    # Explicitly refresh inventory to ensure it's loaded for Pydantic
    db.refresh(new_team) 
    # For good measure, ensuring it is a list
    if new_team.inventory is None:
         new_team.inventory = []
         
    return new_team

@app.get("/teams", response_model=List[TeamInfo])
async def get_teams(db: Session = Depends(get_db)):
    # Eagerly load inventory to avoid Pydantic serialization issues
    teams = db.query(Team).options(joinedload(Team.inventory)).all()
    return teams

@app.post("/reset-progress")
async def reset_progress(request: dict, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == request['team_id']).first()
    if not team: raise HTTPException(404, "Team not found")
    
    db.query(InventoryItem).filter(InventoryItem.team_id == team.id).delete()
    db.query(ChatHistory).filter(ChatHistory.team_id == team.id).delete() # Reset Chat History
    team.game_state = {"current_room": ROOM_ORDER[0]}
    db.commit()
    return {"message": "Reset", "current_room": ROOM_ORDER[0]}

@app.post("/next-room")
async def next_room(request: dict, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == request['team_id']).first()
    if not team: raise HTTPException(404, "Team not found")
    
    current_state = dict(team.game_state)
    current_room = current_state.get("current_room")
    try:
        idx = ROOM_ORDER.index(current_room)
        if idx + 1 < len(ROOM_ORDER):
            next_room = ROOM_ORDER[idx + 1]
            current_state["current_room"] = next_room
            if "room_completed" in current_state: del current_state["room_completed"]
            team.game_state = current_state
            db.commit()
            return {"current_room": next_room}
    except:
        pass
    return {"current_room": current_room}

@app.delete("/admin/teams/{team_id}")
async def delete_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Cascade delete (though SQLAlchemy relationships might handle this if configured, 
    # doing it explicitly is safer given the simple schema setup)
    db.query(InventoryItem).filter(InventoryItem.team_id == team_id).delete()
    db.query(ChatHistory).filter(ChatHistory.team_id == team_id).delete()
    db.delete(team)
    db.commit()
    return {"message": "Team deleted successfully"}

# --- WebSocket Endpoint (The Core "Live" Logic) ---

@app.websocket("/ws/{team_id}/{item_id}")
async def websocket_endpoint(websocket: WebSocket, team_id: int, item_id: str, db: Session = Depends(get_db)):
    await websocket.accept()
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        await websocket.close(code=4000)
        return

    # 1. Setup Context
    room_id = team.game_state.get("current_room", ROOM_ORDER[0])
    room_conf = ROOM_CONFIGS.get(room_id, {})
    
    system_instruction = ""
    room_completed = False
    
    # Handlers
    handle_terminal = ROOM_HANDLERS['terminal']
    handle_books = ROOM_HANDLERS['books']
    # Get the specific handler for this room ID
    handle_room_item = ROOM_HANDLERS['room_specific'].get(room_id)

    # Determine System Instruction (Initial State)
    if item_id == 'coordinator':
        inv_names = [i.name for i in team.inventory]
        prompt_template = room_conf.get("mission_control_prompt", "You are a helpful assistant.")
        system_instruction = prompt_template.format(
            current_room=room_conf.get('name', room_id),
            inventory=", ".join(inv_names) if inv_names else "Empty"
        )
    elif item_id == 'terminal' and handle_terminal:
        system_instruction = handle_terminal(team, "") # Get initial prompt
    elif item_id == 'books' and handle_books:
        system_instruction = handle_books(team, "")
    else:
        # Check specific room item handlers (like sparky)
        if handle_room_item:
             # We pass an empty string as user_query just to get the prompt
             prompt_or_msg, _ = handle_room_item(team, item_id, "")
             # If it returns a tuple, the first element is the prompt/msg
             # Only use it if it's not a generic "INFO:" string which handle_room_item returns by default
             if isinstance(prompt_or_msg, str) and not prompt_or_msg.startswith("INFO:"):
                 system_instruction = prompt_or_msg
             else:
                 system_instruction = room_conf.get('system_instruction', "You are a helpful assistant.")
        else:
             system_instruction = room_conf.get('system_instruction', "You are a helpful assistant.")

    # 2. Reconstruct History from DB
    history_records = db.query(ChatHistory).filter(
        ChatHistory.team_id == team.id,
        ChatHistory.item_id == item_id
    ).order_by(ChatHistory.timestamp).all()
    
    gemini_history = []
    frontend_history = [] # For sending back to client
    
    for record in history_records:
        # Gemini format
        gemini_history.append({"role": record.role, "parts": [record.content]})
        # Frontend format
        frontend_role = "ai" if record.role == "model" else "user"
        frontend_history.append({"role": frontend_role, "text": record.content})

    # Send History to Client
    if frontend_history:
        await websocket.send_text(json.dumps({"history": frontend_history}))
    else:
        # No history? Send and save initial greeting
        initial_text = f"Accessing {item_id}... System Ready."
        if item_id == 'terminal':
            initial_text = "SYSTEM ALERT: Governance Lock Active. Identify yourself."
        elif item_id == 'books':
            initial_text = "A heavy stack of documentation. It looks like it hasn't been moved in years."
        elif item_id == 'sparky':
            initial_text = "...prisoner mumbling..."
        elif item_id == 'coordinator':
            initial_text = "Mission Control online. Signal strength: 100%. I am here to guide you."

        # Save to DB
        db.add(ChatHistory(team_id=team.id, item_id=item_id, role="model", content=initial_text))
        db.commit()
        
        # Send to Client
        await websocket.send_text(json.dumps({"history": [{"role": "ai", "text": initial_text}]}))

    # 2. Initialize Gemini Chat Session (Live Memory)
    item_conf = room_conf.get("items", {}).get(item_id, {})
    model_id = item_conf.get("model", room_conf.get("model", MODEL_ID))
    
    model = genai.GenerativeModel(
        model_name=model_id,
        system_instruction=system_instruction,
        tools=[check_inventory]
    )
    
    # Start the persistent chat session
    chat = model.start_chat(enable_automatic_function_calling=True, history=gemini_history)

    try:
        while True:
            # 3. Listen for User Input
            user_text = await websocket.receive_text()
            
            # Save User Message
            db.add(ChatHistory(team_id=team.id, item_id=item_id, role="user", content=user_text))
            db.commit()
            
            # Refresh Team State (in case it changed elsewhere)
            db.refresh(team)
            
            # Optional: Dynamic Prompt Injection
            pass

            # 4. Generate AI Response
            # We inject the team_id into the prompt so the tool knows which inventory to check
            prompt_with_context = f"{user_text}\n[System Note: team_id={team_id}]"
            
            try:
                response = chat.send_message(prompt_with_context)
                ai_text = response.text
                
                # 5. Process Side Effects (DB updates)
                clean_text, updates = process_ai_response(ai_text, team, item_id, db)
                db.commit()
                db.refresh(team)
                
                # Dynamic Prompt Injection for Terminal Logic
                follow_up_text = ""
                if 'terminal_stage' in updates:
                    new_stage = updates['terminal_stage']
                    sys_prompt = ""
                    if new_stage == 'QUESTION':
                        sys_prompt = "[System Note: Access Granted. State updated to QUESTION. Ask the security question: 'To optimize costs and enable true scalability, what architecture must be employed?']"
                    elif new_stage == 'KEY_SLOT':
                        sys_prompt = "[System Note: Answer Correct. State updated to KEY_SLOT. Ask the user to insert the physical key.]"
                    elif new_stage == 'UNLOCKED':
                        sys_prompt = "[System Note: Key Accepted. State updated to UNLOCKED. Tell the user they are free to leave.]"
                    
                    if sys_prompt:
                        sys_response = chat.send_message(sys_prompt)
                        # Process the follow-up response (save to DB, check for recursive updates)
                        sys_clean, _ = process_ai_response(sys_response.text, team, item_id, db)
                        follow_up_text = f"\n\n{sys_clean}"

                # Check for manual room completion via handlers (non-AI logic mixed in)
                if handle_room_item and item_id not in ['coordinator', 'terminal', 'books']:
                    # We re-run handle_room_item to check for side effects like "open formats" completion
                    _, completed = handle_room_item(team, item_id, user_text)
                    if completed:
                        st = dict(team.game_state)
                        st["room_completed"] = True
                        team.game_state = st
                        db.commit()

                # Explicitly fetch inventory to ensure freshness
                current_inventory = db.query(InventoryItem).filter(InventoryItem.team_id == team.id).all()

                # 6. Send Response back to Frontend
                final_response = clean_text + follow_up_text
                response_data = {
                    "response": final_response,
                    "inventory": [{"name": i.name, "icon": i.icon} for i in current_inventory],
                    "room_completed": team.game_state.get("room_completed", False),
                    "current_room": team.game_state.get("current_room"),
                    "game_state": team.game_state # Send full state for custom frontend logic
                }
                await websocket.send_text(json.dumps(response_data))
                
            except Exception as e:
                print(f"GenAI Error: {e}")
                await websocket.send_text(json.dumps({
                    "response": "Connection interference detected. Please retry.",
                    "error": str(e)
                }))

    except WebSocketDisconnect:
        print(f"Client #{team_id} disconnected from {item_id}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)