from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, JSON, DateTime
from sqlalchemy.orm import sessionmaker, relationship, DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func

DATABASE_URL = "sqlite:///./game.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# New SQLAlchemy 2.0 Base
class Base(DeclarativeBase):
    pass

class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    game_state: Mapped[dict] = mapped_column(JSON, default={})

    inventory: Mapped[list["InventoryItem"]] = relationship(back_populates="team")
    chat_history: Mapped[list["ChatHistory"]] = relationship(back_populates="team")

class InventoryItem(Base):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    icon: Mapped[str] = mapped_column(String)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"))

    team: Mapped["Team"] = relationship(back_populates="inventory")

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"))
    item_id: Mapped[str] = mapped_column(String, index=True) # e.g., 'sparky', 'coordinator'
    role: Mapped[str] = mapped_column(String) # 'user' or 'model'
    content: Mapped[str] = mapped_column(String)
    timestamp: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    team: Mapped["Team"] = relationship(back_populates="chat_history")

def create_db_and_tables():
    # This is safe to run multiple times. It will only create tables that don't exist.
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
