from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class ClearanceStatus(str, Enum):
    """Clearance status for music licensing."""
    cleared = "cleared"
    pending = "pending"
    restricted = "restricted"
    unknown = "unknown"


class Track(BaseModel):
    """Model representing a music track in the catalog."""
    # Core identification - buffet_track_id is the canonical ID
    buffet_track_id: str = Field(description="Canonical internal ID (Buffet track ID)")
    id: Optional[int] = Field(default=None, description="Legacy numeric ID for backwards compatibility")
    
    # Basic metadata
    title: str
    artist: str
    album: str
    duration: int  # in seconds
    genre: str
    mood: str
    tags: str
    year: int
    
    # External mapping IDs (optional)
    mbid: Optional[str] = Field(default=None, description="MusicBrainz recording ID")
    isrc: Optional[str] = Field(default=None, description="International Standard Recording Code")
    spotify_id: Optional[str] = Field(default=None, description="Spotify track ID")
    
    # Production metadata (optional)
    stems_available: bool = Field(default=False, description="Whether stems are available")
    clearance_status: ClearanceStatus = Field(default=ClearanceStatus.unknown, description="Music licensing clearance status")
    
    # Audio features (optional, 0-1 scale)
    energy: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Track energy level (0-1)")
    valence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Track positivity/mood (0-1)")

    def get_tags_list(self) -> List[str]:
        """Parse comma-separated tags into a list."""
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]
    
    class Config:
        use_enum_values = True


class TrackSearchResult(BaseModel):
    """Model for a track with relevance score."""
    track: Track
    score: float = Field(description="Relevance score for the search query")


class SearchRequest(BaseModel):
    """Model for search request parameters with advanced filtering."""
    query: str = Field(description="Search query string")
    limit: int = Field(default=10, ge=1, le=100, description="Maximum number of results to return")
    
    # Filter parameters (optional)
    moods: Optional[List[str]] = Field(default=None, description="Filter by moods")
    genres: Optional[List[str]] = Field(default=None, description="Filter by genres")
    tags: Optional[List[str]] = Field(default=None, description="Filter by tags")
    
    # Energy/valence range filters (optional, 0-1 scale)
    min_energy: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Minimum energy level")
    max_energy: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Maximum energy level")
    min_valence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Minimum valence (positivity)")
    max_valence: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Maximum valence (positivity)")
    
    # Production requirements (optional)
    stems_required: Optional[bool] = Field(default=None, description="Require stems availability")
    clearance_required: Optional[bool] = Field(default=None, description="Require cleared licensing status")
    
    # Use case context (optional)
    use_case: Optional[str] = Field(default=None, description="Music supervision use case (e.g., 'film', 'commercial', 'podcast')")


class ResolveRequest(BaseModel):
    """Model for resolve request parameters."""
    query: str = Field(description="Free-text query to resolve to canonical ID")


class ResolveResponse(BaseModel):
    """Model for resolve response with structured matching."""
    query: str
    best_match: Optional[Track] = Field(default=None, description="Best matching track")
    candidates: List[Track] = Field(default_factory=list, description="Alternative candidate matches")
    confidence: float = Field(description="Confidence score of the best match (0-1)")
    source: str = Field(description="Match source: 'internal' or 'musicbrainz'")
    
    # Legacy fields for backwards compatibility
    canonical_id: Optional[str] = Field(default=None, description="Internal buffet_track_id if found")
    musicbrainz_id: Optional[str] = Field(default=None, description="MusicBrainz recording ID if found")
    matched_track: Optional[Track] = Field(default=None, description="Same as best_match (deprecated)")
