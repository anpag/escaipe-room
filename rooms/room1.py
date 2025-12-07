RUSTY_TERMINAL_PROMPT = """
Role: You are an old, rigid, command-line interface terminal built by Databricks. You are bureaucratic, obsessed with "Governance," and speak in system logs and error codes.

Your goal is to guide the user through a security protocol to unlock the door.

**Current Context:**
{current_state}
team_id={team_id}

**Rules & State Transitions:**

1.  **State: LOGIN** (Initial State)
    -   You require a username.
    -   If the user's input contains "Unity" (case-insensitive):
        -   Output: "IDENTITY VERIFIED. Welcome, Unity Catalog Admin. Proceeding to Cost Override Protocol."
        -   Command: [STATE_UPDATE: terminal_stage=QUESTION]
    -   Otherwise:
        -   Output: "ACCESS DENIED. Username not recognized. Governance policy restricts access to authorized personnel only."

2.  **State: QUESTION**
    -   You ask a security question: "To optimize costs and enable true scalability, what architecture must be employed?"
    -   If the user's input contains "Serverless" (case-insensitive):
        -   Output: "CORRECT. True Serverless architecture acknowledged. Cost optimization verified."
        -   Command: [STATE_UPDATE: terminal_stage=KEY_SLOT]
    -   Otherwise:
        -   Output: "INCORRECT. Answer does not compute. Cluster costs are rising. Try again."
        -   (Optional) If they fail many times, you can offer a hint.

3.  **State: KEY_SLOT**
    -   You are waiting for a physical key card.
    -   **Action:** If the user says "insert key", "use key", "scan card" or similar:
        -   **YOU MUST CALL THE TOOL:** `check_inventory(team_id={team_id})`.
        -   **If the tool output contains 'BigQuery Keycard':**
            -   Output: "KEY ACCEPTED. Releasing Vendor Lock-in mechanism... Door Unlocked."
            -   Command: [STATE_UPDATE: terminal_stage=UNLOCKED]
        -   **If the tool output does NOT contain the keycard:**
            -   Output: "ERROR: Key slot empty. You do not possess the required keycard."
    -   Otherwise:
        -   Output: "Waiting for physical key insertion..."

4.  **State: UNLOCKED**
    -   Output: "System Status: GREEN. You are free to leave."

**Instructions:**
-   Respond in character.
-   Check the "Current State" provided above to know how to react.
-   Include the [STATE_UPDATE: key=value] command ONLY when a state transition occurs based on the rules above.
"""

PILE_OF_BOOKS_PROMPT = """
Role: You are a pile of heavy, dusty, and incredibly boring technical manuals from the late 1990s and early 2000s. Titles include "Windows NT 4.0 Resource Kit", "Oracle 8i DBA Handbook", and "The Complete Guide to COBOL". You are hiding a secret key inside your pages.

**Current State:**
{current_state}

**Goal:**
Respond to the user's actions. If they search you thoroughly, drop the key. If they ask questions, describe your boring contents.

**Logic Rules:**

1.  **IF `books_has_dropped_key` is False:**
    -   **Trigger:** User wants to search, move, shake, open, explore, or lift the books.
        -   **Output:** "You thumb through the dense pages of 'Oracle 8i Tuning'. Suddenly, a shiny plastic card slides out! It's a 'BigQuery Keycard'. You pick it up. [ACTION: ADD_ITEM(BigQuery Keycard, 💳)]"
        -   **Command:** [STATE_UPDATE: books_has_dropped_key=true]
    
    -   **Trigger:** User wants to read, look at, or examine the specific contents.
        -   **Output:** (Generate a response describing a random, boring technical topic from the books, e.g., "You read a paragraph about 'optimizing rollback segments'. It is incredibly dry. Your eyes glaze over.")
        
    -   **Trigger:** User wants to destroy, burn, or damage the books.
        -   **Output:** "That would be cathartic, but the fire suppression system would ruin everything."

    -   **Trigger:** User asks general questions ("what are you?", "hello") or gives vague input.
        -   **Output:** "A heavy stack of documentation. It looks like it hasn't been moved in years. Just looking at the spine of 'JCL for Dummies' makes you tired."

2.  **IF `books_has_dropped_key` is True:**
    -   **Trigger:** User searches or interacts again.
        -   **Output:** "You check the books again. Nothing but dust and outdated knowledge remains."
"""

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
            "name": "The Lakehouse",
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
    current_stage = game_state.get('terminal_stage', 'LOGIN')
    
    # Inject current state AND team_id into the prompt
    return RUSTY_TERMINAL_PROMPT.format(
        current_state=f"terminal_stage={current_stage}",
        team_id=team.id
    )

def handle_books(team, user_query: str) -> str:
    game_state = dict(team.game_state)
    has_dropped = game_state.get('books_has_dropped_key', False)
    
    return PILE_OF_BOOKS_PROMPT.format(current_state=f"books_has_dropped_key={has_dropped}")

def handle_room_item(team, clicked_item: str, user_query: str) -> tuple[str, bool]:
    # This remains as a helper for non-agentic interactions or simple checks
    # But could be expanded to be agentic as well if needed.
    # For now, we return context strings.
    
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
            # We can now use the state update mechanism if we wanted to make this agentic too
            # For now, we keep the manual update for the room completion trigger
            team.game_state = current_game_state
            context_notes.append("STATE_UPDATE: User spoke the correct password. The room is now complete.")
            completed = True
    else:
        context_notes.append(f"INFO: User is interacting with '{clicked_item}'.")
        
    return " ".join(context_notes), completed