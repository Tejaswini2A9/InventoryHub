from pydantic_settings import BaseSettings
import os

def load_raw_env():
    """
    Manually parse the .env file literally to avoid python-dotenv's 
    premature variable expansion which corrupts Railway placeholders.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(base_dir, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    if "=" in line:
                        key, val = line.split("=", 1)
                        val = val.strip().strip("'\"")
                        os.environ.setdefault(key.strip(), val)

# Pre-load env literally to bypass default python-dotenv expansion
load_raw_env()

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./inventory_db.db"
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 60
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "InventoryHub"
    SMTP_USE_TLS: bool = True

settings = Settings()
