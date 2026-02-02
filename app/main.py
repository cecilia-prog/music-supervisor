from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List
from pathlib import Path
from contextlib import asynccontextmanager
import logging

from app.config import Settings, get_settings
from app.models import Track, TrackSearchResult, SearchRequest, ResolveRequest, ResolveResponse
from app.catalog import MusicCatalog
from app.search import SearchRanker
from app.musicbrainz import MusicBrainzService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Global instances
settings = get_settings()
catalog = None
musicbrainz_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup services."""
    global catalog, musicbrainz_service
    
    # Startup
    logger.info("Starting Music Metadata Aggregator service...")
    
    # Initialize catalog
    catalog_path = Path(settings.catalog_path)
    if not catalog_path.is_absolute():
        # Make path relative to project root
        catalog_path = Path(__file__).parent.parent / settings.catalog_path
    
    catalog = MusicCatalog(str(catalog_path))
    logger.info(f"Loaded {len(catalog.tracks)} tracks from catalog")
    
    # Initialize MusicBrainz service
    musicbrainz_service = MusicBrainzService(
        app_name=settings.musicbrainz_app_name,
        app_version=settings.musicbrainz_version,
        contact=settings.musicbrainz_contact
    )
    logger.info("MusicBrainz service initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Music Metadata Aggregator service...")


# Initialize FastAPI app
app = FastAPI(
    title="Music Metadata Aggregator",
    description="AI Music Supervisor - Music Metadata Aggregator API",
    version="1.0.0",
    lifespan=lifespan
)


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "description": settings.app_description,
        "endpoints": {
            "search": "/api/v1/search",
            "track_by_id": "/api/v1/tracks/{track_id}",
            "resolve": "/api/v1/resolve",
            "all_tracks": "/api/v1/tracks"
        }
    }


@app.get("/api/v1/tracks", response_model=List[Track])
async def get_all_tracks():
    """
    Get all tracks in the catalog.
    
    Returns:
        List of all tracks
    """
    if catalog is None:
        raise HTTPException(status_code=500, detail="Catalog not initialized")
    
    return catalog.get_all_tracks()


@app.get("/api/v1/tracks/{track_id}", response_model=Track)
async def get_track_by_id(track_id: int):
    """
    Get a specific track by its ID.
    
    Args:
        track_id: The ID of the track to retrieve
        
    Returns:
        Track object
        
    Raises:
        HTTPException: If track not found
    """
    if catalog is None:
        raise HTTPException(status_code=500, detail="Catalog not initialized")
    
    track = catalog.get_track_by_id(track_id)
    
    if track is None:
        raise HTTPException(status_code=404, detail=f"Track with ID {track_id} not found")
    
    return track


@app.post("/api/v1/search", response_model=List[TrackSearchResult])
async def search_tracks(search_request: SearchRequest):
    """
    Search for tracks based on a query string.
    
    The search ranks tracks based on matches to:
    - Title (highest weight)
    - Artist
    - Tags
    - Mood
    - Genre
    - Album
    
    Args:
        search_request: Search request containing query and limit
        
    Returns:
        List of tracks with relevance scores, ordered by score
    """
    if catalog is None:
        raise HTTPException(status_code=500, detail="Catalog not initialized")
    
    results = SearchRanker.search_tracks(
        tracks=catalog.get_all_tracks(),
        query=search_request.query,
        limit=search_request.limit
    )
    
    return results


@app.post("/api/v1/resolve", response_model=ResolveResponse)
async def resolve_query(resolve_request: ResolveRequest):
    """
    Resolve a free-text query to canonical IDs using MusicBrainz API.
    
    This endpoint:
    1. Queries the MusicBrainz API with the free-text query
    2. Attempts to match the MusicBrainz result to a track in the internal catalog
    3. Returns both the MusicBrainz ID and internal catalog ID if found
    
    Args:
        resolve_request: Request containing the free-text query
        
    Returns:
        ResolveResponse with canonical IDs and matched track information
    """
    if catalog is None or musicbrainz_service is None:
        raise HTTPException(status_code=500, detail="Services not initialized")
    
    query = resolve_request.query
    
    # Get MusicBrainz match
    mb_match = musicbrainz_service.get_best_match(query)
    
    if not mb_match:
        return ResolveResponse(
            query=query,
            canonical_id=None,
            musicbrainz_id=None,
            matched_track=None,
            confidence=0.0
        )
    
    mb_id, mb_title, mb_artist, mb_confidence = mb_match
    
    # Try to match to internal catalog
    catalog_match = musicbrainz_service.match_to_catalog(query, catalog.get_all_tracks())
    
    if catalog_match:
        matched_track, combined_confidence = catalog_match
        return ResolveResponse(
            query=query,
            canonical_id=matched_track.id,
            musicbrainz_id=mb_id,
            matched_track=matched_track,
            confidence=combined_confidence
        )
    else:
        # MusicBrainz found something but it doesn't match our catalog
        return ResolveResponse(
            query=query,
            canonical_id=None,
            musicbrainz_id=mb_id,
            matched_track=None,
            confidence=mb_confidence * 0.5  # Lower confidence if not in catalog
        )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "catalog_loaded": catalog is not None,
        "tracks_count": len(catalog.tracks) if catalog else 0
    }
