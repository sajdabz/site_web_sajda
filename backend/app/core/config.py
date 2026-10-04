import os
import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduLearn Platform"
    SECRET_KEY: str = "supersecretjwtkeyforlearningplatformpleasechangeproduction"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'app.db').replace(os.sep, '/')}"
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=os.path.join(BASE_DIR, ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# If user provided a relative sqlite URL in .env, ensure it resolves to BASE_DIR
if settings.DATABASE_URL.startswith("sqlite:///./"):
    rel_path = settings.DATABASE_URL.replace("sqlite:///./", "")
    abs_path = os.path.join(BASE_DIR, rel_path).replace(os.sep, "/")
    settings.DATABASE_URL = f"sqlite:///{abs_path}"

# Ensure absolute upload directory
if not os.path.isabs(settings.UPLOAD_DIR):
    settings.UPLOAD_DIR = os.path.join(BASE_DIR, settings.UPLOAD_DIR)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
