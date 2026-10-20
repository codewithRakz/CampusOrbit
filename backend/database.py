import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

import urllib.parse

def get_database_url():
    url = os.getenv("DATABASE_URL")
    if not url: return None
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    
    # Safely URL encode password if it contains special characters like @
    try:
        scheme, rest = url.split("://", 1)
        if "@" in rest:
            creds, host_path = rest.rsplit("@", 1)
            if ":" in creds:
                user, pwd = creds.split(":", 1)
                url = f"{scheme}://{user}:{urllib.parse.quote_plus(pwd)}@{host_path}"
    except Exception:
        pass
    return url

SQLALCHEMY_DATABASE_URL = get_database_url()

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
