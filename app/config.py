from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Application settings."""
    
    # Application settings
    app_name: str = "Music Metadata Aggregator"
    app_version: str = "1.0.0"
    app_description: str = "AI Music Supervisor - Music Metadata Aggregator API"
    
    # Catalog settings
    catalog_path: str = "data/music_catalog.csv"
    
    # MusicBrainz settings
    musicbrainz_app_name: str = "MusicSupervisor"
    musicbrainz_version: str = "1.0"
    musicbrainz_contact: str = ""
    
    # API settings
    api_prefix: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_settings() -> Settings:
    """Get application settings."""
    return Settings()
