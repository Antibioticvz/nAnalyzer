#!/usr/bin/env python3
"""
Initialize the database by creating all tables
"""
import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine, Base
from app.models import user, call, segment, alert, feedback


async def init_db():
    """Create all database tables"""
    print("Creating database tables...")
    
    async with engine.begin() as conn:
        # Drop all tables (for development)
        await conn.run_sync(Base.metadata.drop_all)
        print("Dropped existing tables")
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("Created all tables")
    
    print("Database initialization complete!")


if __name__ == "__main__":
    asyncio.run(init_db())
