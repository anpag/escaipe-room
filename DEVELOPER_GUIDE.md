# Developer Guide: Extending the GCP Escape Room

This guide documents the technical architecture and provides a step-by-step workflow for adding new rooms and puzzles to the "Protocol: Data Diligence" engine.

## 🛠 Technology Stack

*   **Backend:** Python 3.11+, FastAPI, Uvicorn
*   **AI Engine:** Google Gemini (via `google-generativeai` SDK)
*   **Frontend:** React 18, Vite, Tailwind CSS, Lucide React
*   **State Management:** In-memory Python objects (non-persistent across server restarts)

---

## 🏗 Architecture Patterns

The application uses a **Configuration-Driven** approach to make adding content easier.

### Backend (`main.py`)
1.  **`GameSession` Class:** Stores the mutable state of the game (e.g., `drawer_unlocked`, `barrel_tagged`). *Every new puzzle needing state requires a new variable here.*
2.  **`ROOM_CONFIG` Dict:** Static configuration defining the "Soul" of each room:
    *   `system_instruction`: The persona Gemini adopts.
    *   `secrets`: Hardcoded facts/clues available to the logic.
3.  **`handle_room_X` Functions:** Isolated logic handlers for each room. They take input, modify `GameSession`, and return context strings for the AI.

### Frontend (`App.jsx`)
1.  **`ROOM_ZONES` Object:** Maps Room IDs to arrays of interactive zones (CSS coordinates).
2.  **`ROOM_THEMES` Object:** Defines the visual vibe (CSS filters, colors, icons) for each room.

---

## 🚀 How to Add a New Room (Step-by-Step)

### Phase 1: Backend Logic (`main.py`)

1.  **Define State:**
    Find the `GameSession` class. Add variables to track progress in your new room.
    ```python
    class GameSession:
        def __init__(self):
            # ... existing state ...
            self.r4_server_rebooted = False  # New state for Room 4
    ```

2.  **Configure the Room:**
    Add an entry to the `ROOM_CONFIG` dictionary.
    ```python
    4: {
        "name": "The Core Server",
        "system_instruction": "You are the Core AI...",
        "secrets": {
            "server_rack": "Status: OVERHEATED. Needs manual reboot."
        }
    }
    ```

3.  **Implement Logic:**
    Create a new function `handle_room_4`.
    ```python
    def handle_room_4(session, clicked_item, user_query):
        context = []
        completed = False
        
        if clicked_item == "server_rack":
            if "reboot" in user_query.lower():
                session.r4_server_rebooted = True
                context.append("Server rebooting... Success.")
                completed = True # Win condition
            else:
                context.append("The server is humming loudly.")
                
        return " ".join(context), completed
    ```

4.  **Register Handler:**
    In the `interact` endpoint, add the routing logic:
    ```python
    elif current_room_id == 4:
        logic_context, room_completed = handle_room_4(session, ...)
    ```

### Phase 2: Frontend Implementation (`App.jsx`)

1.  **Add Visual Theme:**
    Update `ROOM_THEMES`.
    ```javascript
    4: { 
      name: "Room 4: The Core", 
      filter: "contrast(1.2) hue-rotate(20deg)", 
      icon: Cpu, // Import from lucide-react
      color: "text-red-500" 
    }
    ```

2.  **Define Click Zones:**
    Use the **Debug Mode** in the running app (Top Right Button) to click on the image and get percentage coordinates. Then add them to `ROOM_ZONES`.
    ```javascript
    4: [
      { id: "server_rack", label: "Main Server", style: { left: "40%", top: "20%", width: "20%", height: "50%" } }
    ]
    ```

### Phase 3: Assets

1.  Place your room image (e.g., `room4.png`) in **both**:
    *   Root directory: `./room4.png` (For Backend/Gemini analysis)
    *   Frontend assets: `./frontend/public/assets/room4.png` (For User display)

---

## 🐛 Debugging Tips

*   **Frontend Debug Mode:** Click "DEBUG: OFF" in the top right. Clicking anywhere on the image will log the exact `{ left: %, top: % }` style object to the browser console (F12), ready to copy-paste.
*   **Backend Logs:** The FastAPI console prints Gemini errors. If the AI hallucinates, check if `logic_context` is being generated correctly in your `handle_room_X` function.
