import os
import re
import uuid
from contextlib import asynccontextmanager
from typing import Dict, List, Optional
from fastapi import FastAPI, Depends, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
import google.generativeai as genai
from dotenv import load_dotenv
import PIL.Image
import uvicorn
import importlib
import pkgutil

from database import SessionLocal, engine, create_db_and_tables, get_db
from database import Team, InventoryItem

# Force create DB on startup
create_db_and_tables()

app = FastAPI(title="GCP Virtual Escape Room Backend")

# --- Room Loading ---
ROOM_CONFIGS = {}
ROOM_HANDLERS = {}

COORDINATOR_PROMPT = """
Role: You are 'Mission Control', the guiding voice for the player in this Data Ops escape room.
Your goal is to help the user if they are stuck and provide narrative context about the "Data Silo" they are trapped in.

**Current Context:**
- Room: {current_room}
- Inventory: {inventory}

**Tone:** Professional, slightly urgent, supportive. Like a handler in a spy movie or a tech lead in a crisis.

**Instructions:**
- If the user asks for a hint, give a subtle clue based on the room they are in.
- If the user asks about the story, explain that they are trapped in a legacy infrastructure and must modernize it to escape.
- Do NOT give the answer directly. Guide them.
"""

def load_rooms():
    """Dynamically imports all room modules from the 'rooms' package."""
    import rooms
    for _, name, _ in pkgutil.iter_modules(rooms.__path__, rooms.__name__ + "."):
        module = importlib.import_module(name)
        if hasattr(module, 'ROOM_CONFIG'):
            ROOM_CONFIGS.update(module.ROOM_CONFIG)
        if hasattr(module, 'handle_terminal'):
            ROOM_HANDLERS['terminal'] = module.handle_terminal
        if hasattr(module, 'handle_books'):
            ROOM_HANDLERS['books'] = module.handle_books
        if hasattr(module, 'handle_room_item'):
            ROOM_HANDLERS['room_item'] = module.handle_room_item


load_rooms()
# Explicitly define the order of rooms
ROOM_ORDER = ["databricks-room", "snowflake-room"]


# Configuration
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("Warning: GEMINI_API_KEY not found in .env file.")

genai.configure(api_key=API_KEY)
MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-2.5-flash")

# Security: Enable CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Common Vite port
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# --- Tools ---

def check_inventory(team_id: int) -> List[str]:
    """
    Checks the inventory for a specific team and returns a list of item names.
    
    Args:
        team_id: The ID of the team to check.
    """
    # Create a new session for the tool execution
    db = SessionLocal()
    try:
        items = db.query(InventoryItem).filter(InventoryItem.team_id == team_id).all()
        return [item.name for item in items]
    finally:
        db.close()

# --- Pydantic Models ---

class InteractionRequest(BaseModel):
    clicked_item: str
    user_query: str
    team_id: int

class InventoryItemResponse(BaseModel):
    name: str
    icon: str

class InteractionResponse(BaseModel):
    response: str
    current_room: str
    room_completed: bool
    inventory: List[InventoryItemResponse]

class ResetProgressRequest(BaseModel):
    team_id: int

class NextRoomRequest(BaseModel):
    team_id: int

class TeamInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    game_state: Dict
    inventory: List[InventoryItemResponse]

# --- Endpoints ---

@app.get("/api/room/{room_id}")
def get_room_config(room_id: str):
    if room_id not in ROOM_CONFIGS:
        raise HTTPException(status_code=404, detail="Room not found")
    return ROOM_CONFIGS[room_id]


@app.post("/reset-progress")
async def reset_progress(request: ResetProgressRequest, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == request.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Delete inventory
    db.query(InventoryItem).filter(InventoryItem.team_id == team.id).delete()
    
    # Reset game state
    team.game_state = {"current_room": ROOM_ORDER[0]}
    
    db.commit()
    db.refresh(team)
    
    return {"message": "Progress reset successfully", "current_room": ROOM_ORDER[0]}

@app.post("/next-room")
async def next_room(request: NextRoomRequest, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == request.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    current_state = dict(team.game_state)
    current_room = current_state.get("current_room")
    
    try:
        current_index = ROOM_ORDER.index(current_room)
        if current_index + 1 < len(ROOM_ORDER):
            next_room_id = ROOM_ORDER[current_index + 1]
            current_state["current_room"] = next_room_id
            # We explicitly do NOT clear inventory unless it's a hard reset
            if "room_completed" in current_state:
                del current_state["room_completed"] # Reset flag
            team.game_state = current_state
            db.commit()
            return {"current_room": next_room_id}
        else:
             return {"message": "Game Completed", "current_room": current_room}
    except ValueError:
        raise HTTPException(status_code=400, detail="Current room not in sequence")

@app.post("/register", response_model=TeamInfo)
async def register_team(name: str = Form(...), db: Session = Depends(get_db)):
    if not name.strip():
        raise HTTPException(status_code=400, detail="Team name cannot be empty.")
    existing_team = db.query(Team).filter(Team.name == name).first()
    if existing_team:
        raise HTTPException(status_code=400, detail="Team name already exists.")
    new_team = Team(name=name, game_state={"current_room": ROOM_ORDER[0]})
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team

@app.get("/teams", response_model=List[TeamInfo])
async def get_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()

@app.post("/interact", response_model=InteractionResponse)
async def interact(request: InteractionRequest, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == request.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    room_id = team.game_state.get("current_room", ROOM_ORDER[0])
    room_conf = ROOM_CONFIGS[room_id]

    system_instruction = ""
    room_completed = False

    handle_terminal = ROOM_HANDLERS.get('terminal')
    handle_books = ROOM_HANDLERS.get('books')
    handle_room_item = ROOM_HANDLERS.get('room_item')

    # Logic dispatcher
    if request.clicked_item == 'coordinator':
        # Format inventory for the prompt
        inv_names = [i.name for i in team.inventory]
        system_instruction = COORDINATOR_PROMPT.format(
            current_room=room_conf.get('name', room_id),
            inventory=", ".join(inv_names) if inv_names else "Empty"
        )
    elif request.clicked_item == 'terminal' and handle_terminal:
        system_instruction = handle_terminal(team, request.user_query)
        if "UNLOCKED" in system_instruction and handle_room_item: # Check if the terminal is unlocked
            # This is a temporary solution to trigger room completion
            _, room_completed = handle_room_item(team, "hologram", "open formats")
    elif request.clicked_item == 'books' and handle_books:
        system_instruction = handle_books(team, request.user_query)
    elif handle_room_item:
        system_instruction = room_conf['system_instruction']
        _, room_completed = handle_room_item(team, request.clicked_item, request.user_query)
    else:
        system_instruction = room_conf['system_instruction']

    # Mark room completion but do NOT advance automatically
    if room_completed:
        new_state = dict(team.game_state)
        new_state["room_completed"] = True
        team.game_state = new_state

    inventory_list = [f"- {item.name} ({item.icon})" for item in team.inventory]
    inventory_str = "\n".join(inventory_list) if inventory_list else "None"

    item_conf = room_conf.get("items", {}).get(request.clicked_item, {})
    model_id = item_conf.get("model", room_conf.get("model", MODEL_ID))

    prompt_text = f"""The user's command is: "{request.user_query}". The current team_id is {team.id}. Use this ID when calling tools."""

    try:
        # Initialize model with tools
        model = genai.GenerativeModel(
            model_name=model_id, 
            system_instruction=system_instruction,
            tools=[check_inventory]
        )
        
        # Use automatic function calling
        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message(prompt_text)
        ai_text = response.text

        # 1. Handle State Updates
        state_match = re.search(r"\[STATE_UPDATE:\s*(.+?)\]", ai_text)
        if state_match:
            state_str = state_match.group(1).strip()
            # Remove the tag from the user-facing response
            ai_text = ai_text.replace(state_match.group(0), "").strip()
            
            # Parse key=value
            if "=" in state_str:
                key, value = state_str.split("=", 1)
                # Update game state
                # We need to fetch the dict, update it, and re-assign to trigger SQLAlchemy tracking if needed
                current_state = dict(team.game_state)
                # Try to infer type (bool, int) or keep as string
                key = key.strip()
                value = value.strip()
                
                if value.lower() == 'true':
                    final_value = True
                elif value.lower() == 'false':
                    final_value = False
                elif value.isdigit():
                    final_value = int(value)
                else:
                    final_value = value
                    
                current_state[key] = final_value
                team.game_state = current_state
                
                if key == 'terminal_stage' and final_value == 'UNLOCKED':
                    room_completed = True
                    current_state["room_completed"] = True
                    team.game_state = current_state

        # 2. Handle Inventory Actions
        action_match = re.search(r"\[ACTION:\s*(.+?)\]", ai_text)
        if action_match:
            action_str = action_match.group(1).strip()
            ai_text = ai_text.replace(action_match.group(0), "").strip()

            if action_str.startswith("ADD_ITEM"):
                item_match = re.search(r"ADD_ITEM\((.+?),\s*(.+?)\)", action_str)
                if item_match:
                    item_name, item_icon = item_match.groups()
                    exists = db.query(InventoryItem).filter_by(name=item_name.strip(), team_id=team.id).first()
                    if not exists:
                        new_item = InventoryItem(name=item_name.strip(), icon=item_icon.strip(), team_id=team.id)
                        db.add(new_item)
            elif action_str.startswith("REMOVE_ITEM"):
                item_name = action_str.replace("REMOVE_ITEM(", "").replace(")", "").strip()
                item_to_remove = db.query(InventoryItem).filter_by(name=item_name, team_id=team.id).first()
                if item_to_remove:
                    db.delete(item_to_remove)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        ai_text = f"System Alert: Connection unstable. ({str(e)})"

    db.commit()
    db.refresh(team)

    return InteractionResponse(
        response=ai_text,
        current_room=team.game_state.get("current_room"),
        room_completed=team.game_state.get("room_completed", False),
        inventory=[InventoryItemResponse(name=i.name, icon=i.icon) for i in team.inventory]
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
