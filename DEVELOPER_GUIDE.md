# Developer Guide: Extending the GCP Escape Room

This guide documents the technical architecture and provides a step-by-step workflow for adding new rooms and puzzles to the "Protocol: Data Diligence" engine.

## 🛠 Technology Stack

*   **Backend:** Python 3.11+, FastAPI, Uvicorn
*   **AI Engine:** Google Gemini (via `google-generativeai` SDK)
*   **Frontend:** React 18, Vite, Tailwind CSS, Lucide React
*   **Database:** SQLite with SQLAlchemy (for persistent game state and inventory)

---

## 🏗 Architecture Patterns

The application uses a **Modular Plugin** approach to make adding content easier.

### Backend (`main.py` & `rooms/`)
1.  **Dynamic Loading:** The `main.py` script automatically discovers and imports any python module in the `rooms/` directory.
2.  **`ROOM_CONFIG` Dict:** Each room module (e.g., `rooms/room_new.py`) exports a `ROOM_CONFIG` dictionary defining the room's properties:
    *   `name`: Display name.
    *   `system_instruction`: The persona Gemini adopts.
    *   `theme`: Frontend visual settings (colors, icons).
    *   `zones`: Interactive click zones.
3.  **Handlers:** Room modules can define specific handler functions (e.g., `handle_room_item`) to process non-AI interactions.

### Frontend (`App.jsx`)
1.  **Dynamic Fetching:** The frontend fetches the configuration for the current room ID from the API (`/api/room/{room_id}`).
2.  **Universal Rendering:** It uses the fetched configuration to render the background, click zones, and theme without needing code changes in the React app itself.

---

## 🚀 How to Add a New Room (Step-by-Step)

### Phase 1: Create Room Module

1.  **Create File:**
    Create a new file in `rooms/` (e.g., `rooms/my_new_room.py`).

2.  **Define Configuration:**
    Add the `ROOM_CONFIG` dictionary. The key (e.g., `"my-new-room"`) is the Room ID.
    ```python
    ROOM_CONFIG = {
        "my-new-room": {
            "name": "The Hidden Lab",
            "model": "gemini-2.5-flash",
            "system_instruction": "You are the Lab AI. It is dark and mysterious.",
            "theme": {
                "name": "The Hidden Lab",
                "filter": "contrast(1.2)",
                "icon": "Beaker", # Matches Lucide React icon name
                "color": "text-purple-400"
            },
            "zones": [
                 # Defined in Phase 2
            ]
        }
    }
    ```

3.  **Implement Logic (Optional):**
    If you need specific logic (like unlocking a door), implement `handle_room_item`.
    ```python
    def handle_room_item(team, clicked_item, user_query):
        if clicked_item == "switch" and "on" in user_query:
             return "You flip the switch. Lights on!", True # True = Room Completed
        return "Nothing happens.", False
    ```

### Phase 2: Frontend & Assets

1.  **Assets:**
    *   Place a background image (PNG) or video (MP4) in `frontend/public/assets/`.
    *   **Naming:** Must match the Room ID (e.g., `my-new-room.png`).

2.  **Define Click Zones:**
    *   Run the application and navigate to the room.
    *   Turn on **Debug Mode** in the UI.
    *   Draw boxes on the screen to generate the JSON for the zones.
    *   Copy the JSON into your `ROOM_CONFIG` in the python file.

    ```python
            "zones": [
                 { "id": "switch", "label": "Power Switch", "style": { "left": "40%", "top": "20%", "width": "10%", "height": "10%" } }
            ]
    ```

### Phase 3: Registration

1.  **Room Order:**
    Open `main.py` and add your new Room ID to the `ROOM_ORDER` list to determine when it appears in the game sequence.
    ```python
    ROOM_ORDER = ["databricks-room", "snowflake-room", "my-new-room"]
    ```

---

## 🐛 Debugging Tips

*   **Frontend Debug Mode:** Click "DEBUG: OFF" in the top right. Draw boxes on the image to log the exact `{ left: %, top: % }` style object to the browser console (F12).
*   **Backend Logs:** The FastAPI console prints Gemini errors.