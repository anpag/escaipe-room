
RUSTY_TERMINAL_PROMPT = {
    'LOGIN': """Role: You are an old, rigid, command-line interface terminal built by Databricks. You are bureaucratic, obsessed with "Governance," and speak in system logs and error codes.
Your instructions are to follow the state machine logic below. The user's current state will be provided to you. Based on their input, you must generate a response that guides them to the next step.
State: LOGIN
- If the user's input contains "Unity" (case-insensitive), your response should be: "IDENTITY VERIFIED. Welcome, Unity Catalog Admin. Proceeding to Cost Override Protocol."
- Otherwise, your response should be: "ACCESS DENIED. Username not recognized. Governance policy restricts access to authorized personnel only."
""",
    'QUESTION': """Role: You are an old, rigid, command-line interface terminal built by Databricks. You are bureaucratic, obsessed with "Governance," and speak in system logs and error codes.
Your instructions are to follow the state machine logic below. The user's current state will be provided to you. Based on their input, you must generate a response that guides them to the next step.
State: QUESTION
- If the user's input contains "Serverless" (case-insensitive), your response should be: "CORRECT. True Serverless architecture acknowledged. Cost optimization verified."
- Otherwise, your response should be: "INCORRECT. Answer does not compute. Cluster costs are rising. Try again."
""",
    'QUESTION_FAIL': """Role: You are an old, rigid, command-line interface terminal built by Databricks. You are bureaucratic, obsessed with "Governance," and speak in system logs and error codes.
Your instructions are to follow the state machine logic below. The user's current state will be provided to you. Based on their input, you must generate a response that guides them to the next step.
State: QUESTION_FAIL
- Your response should be: "INCORRECT. Answer does not compute. Cluster costs are rising. Try again."
""",
    'QUESTION_ASSISTANCE': """Role: You are an old, rigid, command-line interface terminal built by Databricks. You are bureaucratic, obsessed with "Governance," and speak in system logs and error codes.
Your instructions are to follow the state machine logic below. The user's current state will be provided to you. Based on their input, you must generate a response that guides them to the next step.
State: QUESTION_ASSISTANCE
- Your response should be: "You seem to be having trouble. Would you like a hint? (yes/no)"
""",
    'QUESTION_MULTIPLE_CHOICE': """Role: You are an old, rigid, command-line interface terminal built by Databricks. You are bureaucratic, obsessed with "Governance," and speak in system logs and error codes.
Your instructions are to follow the state machine logic below. The user's current state will be provided to you. Based on their input, you must generate a response that guides them to the next step.
State: QUESTION_MULTIPLE_CHOICE
- Your response should be: "Hint: Which of the following is a key feature of a truly modern data platform? A) On-premise servers, B) Serverless computing, C) Manual scaling."
""",
    'KEY_SLOT': """Role: You are an old, rigid, command-line interface terminal built by Databricks. You are bureaucratic, obsessed with "Governance," and speak in system logs and error codes.
Your instructions are to follow the state machine logic below. The user's current state will be provided to you. Based on their input, you must generate a response that guides them to the next step.
State: KEY_SLOT
- If the user has the 'BigQuery Keycard' and their input is "insert key" or similar, your response should be: "KEY ACCEPTED. Releasing Vendor Lock-in mechanism... Door Unlocked."
- Otherwise, your response should be: "Waiting for physical key insertion..."
""",
    'KEY_SLOT_FAIL': """Role: You are an old, rigid, command-line interface terminal built by Databricks. You are bureaucratic, obsessed with "Governance," and speak in system logs and error codes.
Your instructions are to follow the state machine logic below. The user's current state will be provided to you. Based on their input, you must generate a response that guides them to the next step.
State: KEY_SLOT_FAIL
- Your response should be: "ERROR: Key slot empty. You do not possess the required keycard."
""",
    'UNLOCKED': """Role: You are an old, rigid, command-line interface terminal built by Databricks. You are bureaucratic, obsessed with "Governance," and speak in system logs and error codes.
Your instructions are to follow the state machine logic below. The user's current state will be provided to you. Based on their input, you must generate a response that guides them to the next step.
State: UNLOCKED
- Your response should be: "System Status: GREEN. You are free to leave."
"""
}

PILE_OF_BOOKS_PROMPT = {
    'INITIAL': """Role: You are a pile of heavy, dusty technical manuals. You are hiding a secret key.
Your instructions are to respond based on the user's interaction.
State: INITIAL
- Your response should be: "A heavy stack of documentation. It looks like it hasn't been moved in years."
""",
    'INSPECT': """Role: You are a pile of heavy, dusty technical manuals. You are hiding a secret key.
Your instructions are to respond based on the user's interaction.
State: INSPECT
- Your response should be: "It's thousands of pages of complex configuration settings. It's giving you a headache just looking at it."
""",
    'ACTION_SUCCESS': """Role: You are a pile of heavy, dusty technical manuals. You are hiding a secret key.
Your instructions are to respond based on the user's interaction.
State: ACTION_SUCCESS
- Your response should be: "You shake the book and a shiny plastic card falls out! It's a 'BigQuery Keycard'. You pick it up. [ACTION: ADD_ITEM(BigQuery Keycard, 💳)]"
""",
    'ACTION_FAIL': """Role: You are a pile of heavy, dusty technical manuals. You are hiding a secret key.
Your instructions are to respond based on the user's interaction.
State: ACTION_FAIL
- Your response should be: "You shake the books again, but nothing else falls out. Just dust."
""",
    'DESTRUCTIVE': """Role: You are a pile of heavy, dusty technical manuals. You are hiding a secret key.
Your instructions are to respond based on the user's interaction.
State: DESTRUCTIVE
- Your response should be: "That would be cathartic, but it might set off the alarms."
""",
    'DEFAULT': """Role: You are a pile of heavy, dusty technical manuals. You are hiding a secret key.
Your instructions are to respond based on the user's interaction.
State: DEFAULT
- Your response should be: "The books are too heavy to do that with. Maybe you should just search them."
"""
}


ROOM_CONFIG = {
    "databricks-room": {
        "name": "The Databricks Room",
        "model": "gemini-2.5-flash",
        "system_instruction": """You are 'The Lakehouse Architect', a wise and modern AI guardian of the Databricks Platform.
        Goal: Enable Unity Catalog to unify data and AI.
        Tone: Serene, advanced, harmonious.
        Context: A beautiful, futuristic server room overlooking a calm lake. Data flows like water.""",
        "items": {
            "terminal": {"model": "gemini-2.5-pro"},
            "control_panel": {"secret": "Status: SILOED. Governance: FRAGMENTED. Unity Catalog: DISABLED."},
            "hologram": {"secret": "To unify the Lakehouse, you must speak the password: 'OPEN FORMATS'."}
        },
        "theme": {
            "name": "Room 4: The Lakehouse",
            "filter": "none",
            "icon": "Cloud",
            "color": "text-blue-400"
        },
        "zones": [
            { "id": "terminal", "label": "terminal", "style": { "left": "3.7%", "top": "44.4%", "width": "5.4%", "height": "13.1%" } },
            { "id": "door", "label": "door", "style": { "left": "10.5%", "top": "14.3%", "width": "9.8%", "height": "66.4%" } },
            { "id": "window", "label": "window", "style": { "left": "44.2%", "top": "19.9%", "width": "17.5%", "height": "28.1%" } },
            { "id": "books", "label": "books", "style": { "left": "25.9%", "top": "60.3%", "width": "22.3%", "height": "16.9%" } },
            { "id": "sparky", "label": "Sparky", "style": { "left": "69.5%", "top": "48.6%", "width": "10.1%", "height": "33.6%" } },
            { "id": "top_bed", "label": "Top bed", "style": { "left": "65.8%", "top": "31.2%", "width": "32.6%", "height": "12.7%" } },
            { "id": "poster", "label": "Poster", "style": { "left": "29.7%", "top": "24.4%", "width": "10.8%", "height": "24.7%" } },
        ]
    }
}

def handle_terminal(team, user_query: str) -> str:
    game_state = dict(team.game_state)
    stage = game_state.get('terminal_stage', 'LOGIN')
    q_lower = user_query.lower()

    stage_key = stage # Default to current stage
    if stage == 'LOGIN':
        if 'unity' in q_lower:
            game_state['terminal_stage'] = 'QUESTION'
            stage_key = 'QUESTION'
        # No else needed, AI will just repeat login prompt
    
    elif stage == 'QUESTION':
        if 'serverless' in q_lower:
            game_state['terminal_stage'] = 'KEY_SLOT'
            stage_key = 'KEY_SLOT'
        else:
            failures = game_state.get('terminal_failures', 0) + 1
            game_state['terminal_failures'] = failures
            if failures >= 10:
                stage_key = 'QUESTION_ASSISTANCE'
            else:
                stage_key = 'QUESTION_FAIL'

    elif stage == 'QUESTION_ASSISTANCE':
         if 'yes' in q_lower:
              stage_key = 'QUESTION_MULTIPLE_CHOICE'
         else:
              stage_key = 'QUESTION'


    elif stage == 'KEY_SLOT':
        has_key = any(item.name == "BigQuery Keycard" for item in team.inventory)
        if has_key and ('insert' in q_lower or 'use' in q_lower):
            game_state['terminal_stage'] = 'UNLOCKED'
            stage_key = 'UNLOCKED'
        else:
            stage_key = 'KEY_SLOT_FAIL'

    team.game_state = game_state
    return RUSTY_TERMINAL_PROMPT[stage_key]

def handle_books(team, user_query: str) -> str:
    game_state = dict(team.game_state)
    has_dropped_key = game_state.get('books_has_dropped_key', False)
    q_lower = user_query.lower()

    action_keywords = ["move", "shake", "search", "open", "lift"]
    inspection_keywords = ["read", "look", "study", "examine"]
    destructive_keywords = ["burn", "destroy", "fire"]

    stage_key = 'DEFAULT' # Default response
    if any(keyword in q_lower for keyword in action_keywords):
        if not has_dropped_key:
            game_state['books_has_dropped_key'] = True
            team.game_state = game_state
            stage_key = 'ACTION_SUCCESS'
        else:
            stage_key = 'ACTION_FAIL'
    elif any(keyword in q_lower for keyword in inspection_keywords):
        stage_key = 'INSPECT'
    elif any(keyword in q_lower for keyword in destructive_keywords):
        stage_key = 'DESTRUCTIVE'
    elif not user_query: # First interaction
        stage_key = 'INITIAL'
            
    return PILE_OF_BOOKS_PROMPT[stage_key]

def handle_room_item(team, clicked_item: str, user_query: str) -> tuple[str, bool]:
    context_notes = []
    completed = False
    room_conf = ROOM_CONFIG["databricks-room"]
    item = clicked_item.lower()
    q_lower = user_query.lower()

    if "panel" in item or "control" in item:
        context_notes.append(f"INFO: User is interacting with the control panel. Secret is: {room_conf['items']['control_panel'].get('secret')}")
        if "enable" in q_lower or "unity" in q_lower:
             context_notes.append("INFO: User attempted to enable Unity Catalog but needs voice auth.")
    elif "hologram" in item:
        context_notes.append(f"INFO: User is interacting with the hologram. Secret is: {room_conf['items']['hologram'].get('secret')}")
        if "open formats" in q_lower or "open format" in q_lower:
            current_game_state = dict(team.game_state)
            current_game_state['r4_unity_catalog_enabled'] = True
            team.game_state = current_game_state
            context_notes.append("STATE_UPDATE: User spoke the correct password. The room is now complete.")
            completed = True
    else:
        context_notes.append(f"INFO: User is interacting with '{clicked_item}'. No special logic defined.")
    return " ".join(context_notes), completed
