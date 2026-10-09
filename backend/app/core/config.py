from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "ProcuLink"
    DATABASE_URL: str
    SECRET_KEY: str
    REDIS_URL: str = "redis://redis:6379/0"

    # Azure OpenAI
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_CHAT_DEPLOYMENT: str = "gpt-4.1"
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT: str = "text-embedding-3-large"
    AZURE_OPENAI_API_VERSION: str = "2024-12-01-preview"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
