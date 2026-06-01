from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import re
from .config import settings

def resolve_database_url(url: str) -> str:
    """
    Parses and substitutes any dynamic ${{VAR}} or ${VAR} environment placeholders.
    For example: postgresql://${{PGUSER}}:${{POSTGRES_PASSWORD}}@${{RAILWAY_PRIVATE_DOMAIN}}:5432/${{PGDATABASE}}
    """
    if not url:
        return ""
    
    # Matches patterns like ${{VAR_NAME}} or ${VAR_NAME}
    pattern = re.compile(r'\$\{\{?(\w+)\}?\}')
    resolved_url = url
    matches = pattern.findall(url)
    
    for var_name in matches:
        env_val = os.getenv(var_name)
        if env_val is not None:
            # Safely replace all syntax forms of this variable
            resolved_url = (
                resolved_url.replace(f"${{{{{var_name}}}}}", env_val)
                            .replace(f"${{{var_name}}}", env_val)
            )
            
    return resolved_url

# Create engine
raw_db_url = settings.DATABASE_URL
db_url = resolve_database_url(raw_db_url)

# Determine if running inside a Docker container
is_docker = os.path.exists('/.dockerenv')

# Self-healing fallback evaluation:
# 1. Check if the database URL still contains unresolved placeholders (e.g. ${{PGUSER}} or ${{RAILWAY_PRIVATE_DOMAIN}})
# 2. Check if we're running locally (not in Docker) but pointing to standard Docker '@db' host
has_unresolved_placeholders = "${{" in db_url or "${" in db_url or "RAILWAY_PRIVATE_DOMAIN" in db_url

if has_unresolved_placeholders:
    print("\n" + "="*80, flush=True)
    print(" [DATABASE CONFIG] WARNING: DATABASE_URL contains unresolved Railway placeholders.", flush=True)
    print(" If running locally, please use your Railway 'Public Connection String' in .env.", flush=True)
    print(" AUTO-HEALING ACTIVE: Gracefully falling back to local SQLite database.", flush=True)
    print("="*80 + "\n", flush=True)
    db_url = "sqlite:///./inventory_db.db"
elif "postgresql://" in db_url and "@db" in db_url and not is_docker:
    print("\n" + "="*80, flush=True)
    print(" [DATABASE CONFIG] NOTICE: PostgreSQL pointing to Docker 'db' host outside of Docker.", flush=True)
    print(" AUTO-HEALING ACTIVE: Gracefully falling back to local SQLite database.", flush=True)
    print("="*80 + "\n", flush=True)
    db_url = "sqlite:///./inventory_db.db"

if "sqlite" in db_url:
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    print(f"\n [DATABASE CONFIG] Connecting to PostgreSQL database: {db_url.split('@')[-1] if '@' in db_url else db_url} \n", flush=True)
    engine = create_engine(db_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session in FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

