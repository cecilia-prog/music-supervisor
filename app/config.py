from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application settings
    app_name: str = "Music Metadata Aggregator"
    app_version: str = "1.0.0"
    app_description: str = "AI Music Supervisor - Music Metadata Aggregator API"
    
    # Catalog settings
    catalog_path: str = "data/music_catalog.csv"
    cache_dir: str = "data/cache"
    
    # MusicBrainz settings
    musicbrainz_app_name: str = "MusicSupervisor"
    musicbrainz_version: str = "1.0"
    musicbrainz_contact: str = ""
    musicbrainz_rate_limit: float = 1.0  # seconds between requests
    musicbrainz_enabled: bool = True
    
    # API settings
    api_prefix: str = "/api/v1"
    
    # CORS settings
    cors_origins: List[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]
    
    # Security settings
    api_key: str = ""  # If set, require Bearer auth for /agent/* endpoints
    
    # Feature flags
    enable_dev_endpoints: bool = False
    enable_elevenlabs: bool = True
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
_settings = None


def get_settings() -> Settings:
    """Get application settings (singleton)."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


def reload_settings() -> Settings:
    """Reload settings from environment (for testing/dev)."""
    global _settings
    _settings = Settings()
    return _settings
