# Virtual Escape Room

## Overview
This project is a virtual escape room game where users interact with different themed environments to solve puzzles. It features a React-based frontend and a modular Python FastAPI backend powered by Google's Gemini AI. The application is designed to be easily extendable, allowing developers to add new rooms with custom logic and assets.

## Architecture

### Backend (Python/FastAPI)
The backend is built with FastAPI and uses a modular architecture to manage the game's rooms.

-   **`main.py`**: The main entry point for the backend application. It handles API endpoints, database sessions, and dynamically loads all available room modules.
-   **`database.py`**: Defines the database schema using SQLAlchemy, including tables for teams and inventory items.
-   **`rooms/`**: This directory contains the individual modules for each escape room. This modular design allows for easy expansion.
    -   Each room file (e.g., `room1.py`) is self-contained and includes:
        -   `ROOM_CONFIG`: A dictionary containing the room's name, theme, interactive zones, and AI model settings.
        -   Interaction handlers (e.g., `handle_terminal`, `handle_books`): Functions that contain the specific logic for interacting with items in that room.

### Frontend (React/Vite)
The frontend is a single-page application built with React and Vite.

-   **Path:** `/frontend`
-   **Tech Stack:** React, Tailwind CSS, Lucide Icons.
-   **Dynamic Rendering:** The frontend is decoupled from the game's content. It dynamically fetches the configuration for the current room from the backend's `/api/room/{room_id}` endpoint.
-   **State Management:** React hooks (`useState`, `useEffect`) are used to manage the application's state, including the current room, player inventory, and chat messages.
-   **Debug Mode:** A debug mode is available in the UI, which provides a visual tool to easily get the coordinates for new interactive zones in a room.

## Getting Started

You need to run two separate processes in two different terminals: the backend API server and the frontend development server.

### 1. Backend Setup
First, set up and run the Python backend.

**Prerequisites:**
-   Python 3.8+
-   Pip

**Instructions:**
1.  **Create a virtual environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Set up your Gemini API Key:**
    -   Create a `.env` file in the root of the project.
    -   Add your API key to the `.env` file:
        ```
        GEMINI_API_KEY="YOUR_API_KEY_HERE"
        ```
4.  **Run the backend server:**
    ```bash
    python main.py
    ```
    The backend will be available at `http://localhost:8080`.

### 2. Frontend Setup
In a **new terminal**, set up and run the React frontend.

**Prerequisites:**
-   Node.js (v18 or higher)
-   npm

**Instructions:**
1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The application will be accessible at the URL provided by Vite (usually `http://localhost:5173`).

## How to Add a New Room
The modular design makes it easy to add new rooms to the game.

1.  **Create a new room file:**
    -   Create a new Python file in the `rooms/` directory (e.g., `rooms/room2.py`).
2.  **Define the Room Configuration:**
    -   In your new room file, create a `ROOM_CONFIG` dictionary. This dictionary must contain a unique key for your room (e.g., `"new-room-id"`) and include the following:
        -   `name`: The display name of the room.
        -   `theme`: An object with `name`, `icon`, and `color` for the UI.
        -   `zones`: A list of interactive zones, each with an `id`, `label`, and `style` (position and dimensions in percentages).
        -   `items`: Configuration for special items, including any specific AI models to be used.
3.  **Implement Interaction Logic:**
    -   Create functions to handle interactions with the items in your room (e.g., `handle_special_item`).
    -   The backend will automatically import and register your new room module on startup.
4.  **Add Assets:**
    -   Place any new images or videos for your room in the `frontend/public/assets/` directory. Make sure the filenames match the room ID you defined in the `ROOM_CONFIG`.