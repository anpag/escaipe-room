from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Team, InventoryItem, ChatHistory

DATABASE_URL = "sqlite:///./game.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def reset_all_progress():
    db = SessionLocal()
    try:
        # This will delete all chat history and inventory for all teams
        num_chats = db.query(ChatHistory).delete()
        num_items = db.query(InventoryItem).delete()
        
        # Reset game state for all teams to the beginning
        teams = db.query(Team).all()
        for team in teams:
            team.game_state = {"current_room": "databricks-room"}
        
        db.commit()
        print(f"Reset complete.")
        print(f"Deleted {num_chats} chat history records.")
        print(f"Deleted {num_items} inventory items.")
        print(f"Reset game state for {len(teams)} teams.")
    finally:
        db.close()

if __name__ == "__main__":
    reset_all_progress()
