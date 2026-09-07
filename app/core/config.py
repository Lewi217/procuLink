from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "ProcuLink"
    DATABASE_URL: str
    SECRET_KEY: str
    REDIS_URL: str = "redis://redis:6379/0"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
