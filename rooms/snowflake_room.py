
ROOM_CONFIG = {
    "snowflake-room": {
        "name": "Room 5: The Snowflake Vault",
        "model": "gemini-2.5-flash",
        "system_instruction": "You are the guardian of the Snowflake Vault. It is cold here.",
        "items": {},
        "theme": {
            "name": "Room 5: The Snowflake Vault",
            "filter": "hue-rotate(180deg) contrast(1.2)", # Icy look
            "icon": "Database",
            "color": "text-cyan-400"
        },
        "zones": [
             { "id": "sign", "label": "Vault Sign", "style": { "left": "40%", "top": "40%", "width": "20%", "height": "20%" } }
        ]
    }
}

def handle_room_item(team, clicked_item: str, user_query: str) -> tuple[str, bool]:
    # Basic handler for the new room
    return "You are in the Snowflake Vault. It is currently under construction.", False
