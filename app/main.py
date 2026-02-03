from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pathlib import Path
from contextlib import asynccontextmanager
import logging

from app.config import Settings, get_settings, reload_settings
from app.models import Track, TrackSearchResult, SearchRequest, ResolveRequest, ResolveResponse
from app.catalog import MusicCatalog
from app.search import SearchRanker
from app.musicbrainz import MusicBrainzService
from app.resolver import ResolverService
from app.elevenlabs import ElevenLabsHandler
from app import agent

# Configure logging from settings
settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format=settings.log_format
)
logger = logging.getLogger(__name__)


# Global instances
catalog = None
musicbrainz_service = None
resolver_service = None
elevenlabs_handler = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup services."""
    global catalog, musicbrainz_service, resolver_service, elevenlabs_handler
    
    # Startup
    logger.info("Starting Music Metadata Aggregator service...")
    logger.info(f"Environment: DEV_ENDPOINTS={settings.enable_dev_endpoints}, ELEVENLABS={settings.enable_elevenlabs}")
    
    # Initialize catalog
    catalog_path = Path(settings.catalog_path)
    if not catalog_path.is_absolute():
        # Make path relative to project root
        catalog_path = Path(__file__).parent.parent / settings.catalog_path
    
    catalog = MusicCatalog(str(catalog_path))
    logger.info(f"Loaded {len(catalog.tracks)} tracks from catalog")
    
    # Initialize MusicBrainz service (if enabled)
    if settings.musicbrainz_enabled:
        musicbrainz_service = MusicBrainzService(
            app_name=settings.musicbrainz_app_name,
            app_version=settings.musicbrainz_version,
            contact=settings.musicbrainz_contact,
            rate_limit=settings.musicbrainz_rate_limit,
            cache_dir=settings.cache_dir
        )
        logger.info("MusicBrainz service initialized with caching and rate limiting")
    else:
        logger.info("MusicBrainz service disabled")
    
    # Initialize resolver service
    resolver_service = ResolverService(
        catalog_tracks=catalog.get_all_tracks(),
        musicbrainz_service=musicbrainz_service
    )
    logger.info("Resolver service initialized")
    
    # Set agent dependencies
    agent.set_dependencies(catalog, musicbrainz_service, resolver_service)
    logger.info("Agent endpoints configured")
    
    # Initialize 11Labs handler (if enabled)
    if settings.enable_elevenlabs:
        elevenlabs_handler = ElevenLabsHandler(catalog, SearchRanker, musicbrainz_service)
        logger.info("11Labs handler initialized")
    else:
        logger.info("11Labs integration disabled")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Music Metadata Aggregator service...")


# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    description=settings.app_description,
    version=settings.app_version,
    lifespan=lifespan
)

# Add CORS middleware with settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Include agent router
app.include_router(agent.router)


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
async def get_track_by_id(track_id: str):
    """
    Get a specific track by its buffet_track_id (or legacy numeric ID).
    
    Args:
        track_id: The buffet_track_id or legacy numeric ID of the track
        
    Returns:
        Track object
        
    Raises:
        HTTPException: If track not found
    """
    if catalog is None:
        raise HTTPException(status_code=500, detail="Catalog not initialized")
    
    # Try as buffet_track_id first
    track = catalog.get_track_by_id(track_id)
    
    # If not found and track_id is numeric, try legacy lookup
    if track is None and track_id.isdigit():
        track = catalog.get_track_by_legacy_id(int(track_id))
    
    if track is None:
        raise HTTPException(status_code=404, detail=f"Track with ID {track_id} not found")
    
    return track


@app.post("/api/v1/search", response_model=List[TrackSearchResult])
async def search_tracks(search_request: SearchRequest):
    """
    Search for tracks with advanced filtering.
    
    The search ranks tracks based on matches to:
    - Title (highest weight)
    - Artist
    - Tags
    - Mood
    - Genre
    - Album
    
    Supports filtering by:
    - moods, genres, tags
    - energy/valence ranges
    - stems availability
    - clearance status
    
    Args:
        search_request: Search request with query, limit, and optional filters
        
    Returns:
        List of tracks with relevance scores, ordered by score
    """
    if catalog is None:
        raise HTTPException(status_code=500, detail="Catalog not initialized")
    
    results = SearchRanker.search_tracks(
        tracks=catalog.get_all_tracks(),
        request=search_request
    )
    
    return results


@app.post("/api/v1/resolve", response_model=ResolveResponse)
async def resolve_query(resolve_request: ResolveRequest):
    """
    Resolve a free-text query to a track using structured pipeline.
    
    This endpoint:
    1. Attempts fuzzy match against internal catalog first
    2. If confidence is low, queries MusicBrainz API
    3. Returns best match with candidates, confidence score, and source
    
    Args:
        resolve_request: Request containing the free-text query
        
    Returns:
        ResolveResponse with best_match, candidates[], confidence, and source
    """
    if resolver_service is None:
        raise HTTPException(status_code=500, detail="Resolver service not initialized")
    
    result = resolver_service.resolve(resolve_request.query)
    
    return result


@app.get("/health")
async def health_check():
    """
    Health check endpoint with service status.
    
    Returns information about:
    - Service status
    - Catalog loading status and track count
    - MusicBrainz service status
    - Cache status
    """
    cache_status = {}
    if musicbrainz_service:
        cache_status = musicbrainz_service.get_cache_status()
    
    return {
        "status": "healthy",
        "catalog_loaded": catalog is not None,
        "tracks_count": len(catalog.tracks) if catalog else 0,
        "catalog_path": settings.catalog_path,
        "musicbrainz_enabled": settings.musicbrainz_enabled,
        "cache_status": cache_status,
        "features": {
            "dev_endpoints": settings.enable_dev_endpoints,
            "elevenlabs": settings.enable_elevenlabs,
            "api_key_auth": bool(settings.api_key)
        }
    }


# ============= Dev Endpoints (Feature-Flagged) =============

@app.post("/catalog/reload")
async def reload_catalog():
    """
    Reload the music catalog from disk (dev-only endpoint).
    
    Guarded by ENABLE_DEV_ENDPOINTS environment variable.
    Useful for updating the catalog without restarting the server.
    
    Returns:
        Status and new track count
    """
    if not settings.enable_dev_endpoints:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    global catalog, resolver_service
    
    if catalog is None:
        raise HTTPException(status_code=500, detail="Catalog not initialized")
    
    try:
        # Reload catalog
        catalog.load_catalog()
        
        # Update resolver with new tracks
        if resolver_service:
            resolver_service.catalog_tracks = catalog.get_all_tracks()
        
        # Update agent dependencies
        agent.set_dependencies(catalog, musicbrainz_service, resolver_service)
        
        logger.info(f"Catalog reloaded: {len(catalog.tracks)} tracks")
        
        return {
            "status": "success",
            "tracks_count": len(catalog.tracks),
            "message": "Catalog reloaded successfully"
        }
    except Exception as e:
        logger.error(f"Failed to reload catalog: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to reload catalog: {str(e)}")


@app.post("/cache/clear")
async def clear_cache():
    """
    Clear the MusicBrainz cache (dev-only endpoint).
    
    Guarded by ENABLE_DEV_ENDPOINTS environment variable.
    
    Returns:
        Number of cache files deleted
    """
    if not settings.enable_dev_endpoints:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    
    if not musicbrainz_service:
        raise HTTPException(status_code=503, detail="MusicBrainz service not available")
    
    count = musicbrainz_service.clear_cache()
    
    return {
        "status": "success",
        "files_deleted": count,
        "message": f"Cleared {count} cache files"
    }


# ============= 11Labs Integration Endpoints (Feature-Flagged) =============

@app.post("/api/v1/elevenlabs/webhook")
async def elevenlabs_webhook(request: Request):
    """
    Webhook endpoint for 11Labs conversational AI agent.
    
    Guarded by ENABLE_ELEVENLABS environment variable.
    
    This endpoint receives callbacks from the 11Labs agent and
    routes them to appropriate music catalog functions.
    
    Expected payload format from 11Labs:
    {
        "intent": "search_music" | "get_track_info" | "resolve_song" | "recommend_by_mood",
        "query": "user's search query",
        "track_id": 123,  // optional
        "limit": 5,  // optional
        "mood": "peaceful"  // optional
    }
    """
    if not settings.enable_elevenlabs:
        raise HTTPException(status_code=404, detail="11Labs integration disabled")
    
    if elevenlabs_handler is None:
        raise HTTPException(status_code=500, detail="11Labs handler not initialized")
    
    result = await elevenlabs_handler.handle_webhook(request)
    return JSONResponse(content=result)


@app.get("/api/v1/elevenlabs/config")
async def get_elevenlabs_config():
    """
    Get configuration information for 11Labs agent setup.
    
    Guarded by ENABLE_ELEVENLABS environment variable.
    
    Returns the webhook URL and available intents/actions
    that the agent can use.
    """
    if not settings.enable_elevenlabs:
        raise HTTPException(status_code=404, detail="11Labs integration disabled")
    
    return {
        "webhook_url": "/api/v1/elevenlabs/webhook",
        "available_intents": [
            {
                "name": "search_music",
                "description": "Search for tracks by query",
                "parameters": ["query", "limit"]
            },
            {
                "name": "get_track_info",
                "description": "Get detailed information about a specific track",
                "parameters": ["track_id", "track_title"]
            },
            {
                "name": "resolve_song",
                "description": "Resolve a song name to canonical ID using MusicBrainz",
                "parameters": ["query"]
            },
            {
                "name": "recommend_by_mood",
                "description": "Find tracks by mood",
                "parameters": ["mood", "limit"]
            }
        ],
        "example_queries": [
            "Find me some rock songs",
            "Tell me about Bohemian Rhapsody",
            "What songs do you have from the 70s?",
            "I need peaceful music",
            "Play Imagine by John Lennon"
        ]
    }
