from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from .env file"""

    DATABASE_URL: str
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields like VITE_API_BASE_URL

    @property
    def async_database_url(self) -> str:
        """Convert postgresql:// to postgresql+asyncpg:// for asyncpg driver"""
        if self.DATABASE_URL.startswith("postgresql://"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        return self.DATABASE_URL


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()


settings = get_settings()
