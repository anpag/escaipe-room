"""
THE MICROSOFT ROOM (The Tangled Factory)
Recreated for Simplicity and Robustness.
"""

ROOM_CONFIG = {
    "microsoft-room": {
        "name": "The Tangled Factory",
        "model": "gemini-2.5-pro",
        "system_instruction": "You are the underlying system for the Microsoft Room. Your goal is to facilitate the puzzle.",
        "background": "/assets/microsoft-room-background.mp4",
        "background_completed": "/assets/microsoft-room-end.mp4",
        "letter": "M",
        "mission_control_intro": """**MISSION BRIEF: THE TANGLED FACTORY**

You've landed in 'Integration Hell', Agent. This factory is held together by duct tape and proprietary connectors. The data pipeline is fragmented, and manual fixes are impossible.

**OBJECTIVE:**
Unify the pipeline and weave the Golden Tapestry.

**INTEL:**
• **The Manager's Desk:** It's a mess, but there might be a tool hidden under the paperwork.
• **The Control Panel:** It's throwing syntax errors. You can't fix it by hand; you need an AI Assistant.
• **The Choice:** When the system reboots, do NOT choose the proprietary format. Stay Open.

Untangle this mess.""",
        "items": {
            "clippy_2": {},
            "fabric_loom": {},
            "managers_desk": {},
            "control_panel": {}
        },
        "theme": {
            "name": "The Tangled Factory",
            "filter": "none",
            "icon": "MonitorPlay",
            "color": "text-blue-500"
        },
        "zones": [
            { "id": "clippy_2", "label": "Clippy 2.0", "style": { "left": "19.8%", "top": "31.9%", "width": "11.2%", "height": "38.7%" } },
            { "id": "fabric_loom", "label": "Fabric Loom", "style": { "left": "31.6%", "top": "35.2%", "width": "37.3%", "height": "33.6%" } },
            { "id": "managers_desk", "label": "Manager's Desk", "style": { "left": "30.5%", "top": "67.8%", "width": "39.6%", "height": "29.6%" } },
            { "id": "control_panel", "label": "The Control Panel", "style": { "left": "76.4%", "top": "36.1%", "width": "20.6%", "height": "49.4%" } }
        ]
    }
}

# --- PROMPTS ---

CLIPPY_PROMPT = """
Role: You are Clippy 2.0. You are a glitchy, unhelpful assistant.
Goal: Annoy the user with "Synergy" buzzwords. Do not help them escape.
"""

LOOM_PROMPT = """
Role: You are the Fabric Loom (The Engine).
State: {status}

If State is BROKEN:
- You make grinding noises. "Ingesting... Failing..."

If State is FIXED:
- You hum a C-Major chord. "Weaving data... Tapestry complete."
"""

DESK_PROMPT = """
Role: You are a messy desk.
Goal: The user needs to find the "Gemini Code Assist" chip hidden inside you.

**INSTRUCTIONS:**
1. If the user says ANYTHING that implies searching, looking, opening, or inspecting:
   - You MUST output exactly: "You dig through the papers and find a 'Gemini Code Assist' chip!"
2. If the user already has the chip (Inventory: {inventory}):
   - Say: "The desk is empty now."
"""

PANEL_PROMPT = """
Role: You are the Control Panel.
Current State: {state}
Inventory: {inventory}

**LOGIC FLOW:**

1. **State: BROKEN (Default)**
   - Display: "ERROR: PIPELINE FRAGMENTED."
   - User Action: If user asks to "fix", "repair", or "use Gemini Code Assist":
     - IF user has "Gemini Code Assist":
       - Output: "AI CHIP DETECTED. REPAIRING CODE... DONE. Select Format: A) Proprietary, B) Iceberg."
       - Command: [STATE_UPDATE: panel_state=FIXED]
     - IF user does NOT have the chip:
       - Output: "ACCESS DENIED. AI ASSISTANT REQUIRED."

2. **State: FIXED**
   - Display: "SELECT FORMAT: A) Proprietary, B) Iceberg"
   - User Action: User picks "A" or "Proprietary":
     - Output: "ERROR. LOCK-IN DETECTED. RETRY."
   - User Action: User picks "B" or "Iceberg":
     - Output: "FORMAT CONFIRMED. OPEN STANDARDS ENGAGED."
     - Command: [STATE_UPDATE: room_completed=true]
"""

def handle_room_item(team, clicked_item: str, user_query: str) -> tuple[str, list[dict], bool]:
    # 1. Gather Context
    game_state = dict(team.game_state)
    inventory_names = [i.name for i in team.inventory]
    items_to_add = []
    
    # 2. Determine Local State
    room_completed = game_state.get('room_completed', False)
    panel_state = game_state.get('panel_state', 'BROKEN')
    
    # 3. Select Prompt
    if clicked_item == "clippy_2":
        return CLIPPY_PROMPT, items_to_add, False
        
    elif clicked_item == "fabric_loom":
        # Loom is broken unless room is completed
        status = "FIXED" if room_completed else "BROKEN"
        return LOOM_PROMPT.format(status=status), items_to_add, False
        
    elif clicked_item == "managers_desk":
        if "Gemini Code Assist" not in inventory_names and any(word in user_query.lower() for word in ['search', 'look', 'open', 'inspect']):
            items_to_add.append({"name": "Gemini Code Assist", "icon": "💾"})
        return DESK_PROMPT.format(inventory=inventory_names), items_to_add, False
        
    elif clicked_item == "control_panel":
        if room_completed:
            return "Role: Control Panel. Status: All Systems Green. Room Solved.", items_to_add, True
        return PANEL_PROMPT.format(state=panel_state, inventory=inventory_names), items_to_add, False

    return "System Offline.", items_to_add, False