# GCP Virtual Escape Room - Developer & Architecture Guide

## Overview
The **GCP Virtual Escape Room** is an interactive, narrative-driven educational game designed to teach players about "escaping" legacy data silos (Databricks, Snowflake, Microsoft Fabric) and modernizing onto Google Cloud Platform. 

Players solve puzzles by interacting with AI-powered agents (objects in the room) that simulate real-world vendor lock-in scenarios. The game demonstrates the power of AI Agents, open standards (Iceberg), and modern data architecture.

---

## 🏗️ Technical Architecture

### 1. Frontend (React + Vite)
- **Role:** The visual interface and game client.
- **Key Components:**
  - `App.jsx`: The main game loop controller. Handles authentication, room rendering, chat interfaces, and inventory management.
  - **Video Engine:** Renders seamless video backgrounds (MP4) that transition based on game state (e.g., `background` -> `melted` -> `completed`).
  - **Mission Control:** A persistent chat interface that acts as the narrator/guide (using a typewriter effect for immersion).
  - **Interaction Layer:** Clickable "Zones" (divs with absolute positioning) overlaid on the video/image background allow users to "click" on items like terminals, desks, or characters.

### 2. Backend (FastAPI + Python)
- **Role:** The game server, state manager, and AI orchestrator.
- **Key Files:**
  - `main.py`: Entry point. Handles API routes (`/interact`, `/register`, `/next-room`), manages `ROOM_ORDER`, and orchestrates the AI calls.
  - `database.py`: SQLAlchemy setup for SQLite persistence.
  - `rooms/`: A modular package where each room's logic, configuration, and prompts are defined.

### 3. Database (SQLite)
- **Role:** Persists team progress and inventory.
- **Schema:**
  - `Team`: Stores `id`, `name`, and a JSON `game_state` blob (tracking flags like `snowman_stopped`, `room_completed`, `current_room`).
  - `InventoryItem`: Stores items collected by the player (e.g., "Corporate Credit Card", "Gemini Code Assist").

### 4. AI Engine (Google Gemini 2.5 Pro)
- **Role:** Powers the NPCs (Non-Player Characters) and objects.
- **Integration:** The backend initializes a `genai.GenerativeModel` for each interaction, injecting specific *System Instructions* based on the clicked item.
- **Tools:** The model is equipped with function calling capabilities (Tools) to interact with the game world:
  - `check_inventory(team_id)`: Allows agents to "see" what the player is holding.
  - `perform_exploration(action)`: A generic tool allowing agents to narrate physical actions (searching, looking) without refusing the prompt.

---

## 🧩 Room Design & Logic

### 🏛️ Room 1: The Databricks Cell ("The Lakehouse")
*Theme: A futuristic but restrictive prison cell.*
- **Objective:** Break the "Vendor Lock-in" to open the door.
- **Key Agents:**
  - **Rusty Terminal:** A bureaucratic interface. Requires a username ("Unity") and correct architecture answer ("Serverless") to reveal the Key Slot.
  - **Pile of Manuals:** Boring technical books. Searching them drops the **BigQuery Keycard**.
  - **Hologram:** The final lock. Requires the password "OPEN FORMATS".
- **Flow:**
  1. Talk to Terminal (Login) -> Fail.
  2. Search Manuals -> Get Keycard.
  3. Talk to Terminal (Insert Key) -> Terminal Unlocks.
  4. Talk to Hologram (Password) -> Room Complete.

### ❄️ Room 2: The Snowflake Vault ("The Frozen Meter")
*Theme: An icy cavern where money burns.*
- **Objective:** Stop the uncontrollable spending (Auto-Scaling) to calm the panic.
- **Key Agents:**
  - **Fire Pit:** Burning cash. Searching it reveals the **Corporate Credit Card**.
  - **Vending Machine:** Takes the card. Sells only one valid item: the **Flat Rate Shield** (BigQuery Editions).
  - **Auto-Scaler Snowman:** A manic entity spending credits. Using the Shield on him melts him (stops spending).
  - **Yeti CFO:** Panicking about the bill. Once the Snowman stops, he calms down and gives the victory letter **'E'**.
- **Flow:**
  1. Search Fire -> Get Card.
  2. Buy Shield at Vending Machine.
  3. Use Shield on Snowman -> Snowman Melts (Background changes to `melted`).
  4. Talk to Yeti -> Room Complete.

### 🏭 Room 3: The Microsoft Factory ("The Tangled Factory")
*Theme: A chaotic, grimy industrial factory representing "Integration Hell".*
- **Objective:** Fix the broken data pipeline using AI.
- **Key Agents:**
  - **Manager's Desk:** Cluttered mess. Searching it reveals the **Gemini Code Assist** chip.
  - **Control Panel:** Flashing red errors. Using the Chip fixes the code (`STATE: FIXED`).
  - **Fabric Loom:** The engine. It is jammed/broken until the panel is fixed.
- **Flow:**
  1. Search Desk -> Get Gemini Chip.
  2. Use Chip on Control Panel -> Fix Code.
  3. Panel asks for Format -> Choose **Iceberg** (Open Standard).
  4. Loom Unjams -> Room Complete.

---

## 🤖 Agent Interaction Model

The system uses a **Stateless-Stateful Hybrid** approach:

1.  **Stateful Database:** The SQL database holds the "Truth" (Inventory, Flags).
2.  **Stateless Request:** When a user clicks an item, the Frontend sends `clicked_item` and `user_query`.
3.  **Dynamic Prompt Construction:**
    - The Backend looks up the `ROOM_CONFIG` for the current room.
    - It retrieves the specific Python handler function for that room (e.g., `handle_room_item` in `microsoft_room.py`).
    - The handler function reads the `game_state`, injects variables (e.g., `{is_jammed}`, `{inventory}`), and selects the correct **Prompt Template** (e.g., `DESK_PROMPT`).
4.  **AI Execution:**
    - The constructed prompt is sent to **Gemini 2.5 Pro**.
    - The model generates a response or calls a tool.
    - If the model generates a special tag like `[ACTION: ADD_ITEM(...)]` or `[STATE_UPDATE: key=value]`, the backend parses this regex and updates the SQL database immediately.
5.  **Response:** The text response + updated state is sent back to the Frontend.

---

## 🛠️ Tools & Actions

### 1. `[ACTION: ADD_ITEM(Name, Icon)]`
- **Trigger:** Generated by the AI when a player "finds" something.
- **Backend Logic:** Parses the tag, creates a new `InventoryItem` record in the DB associated with the Team.
- **UI:** The item immediately appears in the Inventory bar.

### 2. `[STATE_UPDATE: key=value]`
- **Trigger:** Generated by the AI when a major event happens (e.g., `snowman_stopped=true`, `panel_fixed=true`).
- **Backend Logic:** Updates the JSON `game_state` blob for the Team.
- **Effect:** This persists progress across sessions and changes how Agents react in future turns.

### 3. `check_inventory` (Gemini Tool)
- **Function:** Allows the AI to "know" if the user has an item without us explicitly telling it in the prompt.
- **Usage:** Used primarily by "Gatekeeper" agents (e.g., Vending Machine checking for a Credit Card).

---

## 🎥 Visual System & Transitions

- **Backgrounds:** The room is not a static image but a looping `.mp4` video.
- **States:**
  - `Default`: The standard room loop.
  - `Intermediate` (Snowflake only): When `snowman_stopped` is true, the video switches to a "Melted" version.
  - `Completed`: When `room_completed` is true, the video switches to an "End/Success" animation.
- **Overlay:** Upon completion, a "Victory Overlay" appears displaying the **Secret Letter** earned in that room (`S`, `E`, `M`).

---

## 🚀 How to Run

1.  **Backend:**
    ```bash
    python main.py
    ```
    *Runs on port 8080.*

2.  **Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```
    *Runs on port 5173.*

3.  **Admin Mode:**
    Access `http://localhost:5173/?admin=1` to see Debug/Reset buttons.
