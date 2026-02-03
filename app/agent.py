"""
Agent-specific endpoints for Custom GPT / Actions integration.
These endpoints have stable schemas and optional API key authentication.
"""

from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Optional
from app.models import Track, TrackSearchResult, SearchRequest, ResolveResponse
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])


async def verify_api_key(authorization: Optional[str] = Header(None)):
    """
    Verify API key from Authorization header if API_KEY is configured.
    
    Expected format: "Bearer <api_key>"
    """
    settings = get_settings()
    
    # If no API key is configured, skip auth
    if not settings.api_key:
        return None
    
    # API key is configured - require authentication
    if not authorization:
        logger.warning("Missing Authorization header")
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    # Check Bearer format
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        logger.warning(f"Invalid Authorization format: {authorization}")
        raise HTTPException(status_code=401, detail="Invalid Authorization header format. Expected 'Bearer <token>'")
    
    token = parts[1]
    
    # Verify token
    if token != settings.api_key:
        logger.warning(f"Invalid API key attempt")
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    logger.debug("API key verified successfully")
    return token


# These will be injected by main.py
catalog = None
musicbrainz_service = None
resolver_service = None


def set_dependencies(catalog_instance, musicbrainz_instance, resolver_instance):
    """Set service dependencies (called from main.py)."""
    global catalog, musicbrainz_service, resolver_service
    catalog = catalog_instance
    musicbrainz_service = musicbrainz_instance
    resolver_service = resolver_instance


@router.post("/search_music", response_model=List[TrackSearchResult])
async def search_music(
    request: SearchRequest,
    api_key: Optional[str] = Depends(verify_api_key)
):
    """
    Search music catalog with advanced filtering.
    
    Stable endpoint for Custom GPT Actions.
    """
    from app.search import SearchRanker
    
    if not catalog:
        raise HTTPException(status_code=503, detail="Catalog not loaded")
    
    results = SearchRanker.search_tracks(catalog.get_all_tracks(), request)
    
    logger.info(f"Agent search: query='{request.query}', results={len(results)}")
    
    return results


@router.get("/track/{buffet_track_id}", response_model=Track)
async def get_track(
    buffet_track_id: str,
    api_key: Optional[str] = Depends(verify_api_key)
):
    """
    Get a specific track by its buffet_track_id.
    
    Stable endpoint for Custom GPT Actions.
    """
    if not catalog:
        raise HTTPException(status_code=503, detail="Catalog not loaded")
    
    track = catalog.get_track_by_id(buffet_track_id)
    
    if not track:
        raise HTTPException(status_code=404, detail=f"Track not found: {buffet_track_id}")
    
    logger.info(f"Agent track retrieval: {buffet_track_id}")
    
    return track


@router.post("/resolve", response_model=ResolveResponse)
async def resolve_query(
    query: str,
    api_key: Optional[str] = Depends(verify_api_key)
):
    """
    Resolve a free-text query to a track.
    
    Tries internal catalog first, then MusicBrainz if needed.
    Stable endpoint for Custom GPT Actions.
    """
    if not resolver_service:
        raise HTTPException(status_code=503, detail="Resolver service not available")
    
    result = resolver_service.resolve(query)
    
    logger.info(f"Agent resolve: query='{query}', source={result.source}, confidence={result.confidence:.2f}")
    
    return result
