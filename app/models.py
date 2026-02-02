from pydantic import BaseModel, Field
from typing import Optional, List


class Track(BaseModel):
    """Model representing a music track in the catalog."""
    id: int
    title: str
    artist: str
    album: str
    duration: int  # in seconds
    genre: str
    mood: str
    tags: str
    year: int

    def get_tags_list(self) -> List[str]:
        """Parse comma-separated tags into a list."""
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]


class TrackSearchResult(BaseModel):
    """Model for a track with relevance score."""
    track: Track
    score: float = Field(description="Relevance score for the search query")


class SearchRequest(BaseModel):
    """Model for search request parameters."""
    query: str = Field(description="Search query string")
    limit: int = Field(default=10, ge=1, le=100, description="Maximum number of results to return")


class ResolveRequest(BaseModel):
    """Model for resolve request parameters."""
    query: str = Field(description="Free-text query to resolve to canonical ID")


class ResolveResponse(BaseModel):
    """Model for resolve response."""
    query: str
    canonical_id: Optional[int] = Field(description="Internal catalog ID if found")
    musicbrainz_id: Optional[str] = Field(description="MusicBrainz recording ID if found")
    matched_track: Optional[Track] = Field(description="Matched track from internal catalog")
    confidence: float = Field(description="Confidence score of the match (0-1)")
