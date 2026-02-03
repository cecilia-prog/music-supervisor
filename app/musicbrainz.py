import musicbrainzngs
import logging
import time
from typing import Optional, Tuple, List, Dict, Any
from app.models import Track
from app.cache import MusicBrainzCache

logger = logging.getLogger(__name__)


class MusicBrainzService:
    """Service for interacting with MusicBrainz API with caching and rate limiting."""
    
    def __init__(
        self,
        app_name: str = "MusicSupervisor",
        app_version: str = "1.0",
        contact: str = "",
        rate_limit: float = 1.0,
        cache_dir: str = "data/cache"
    ):
        """
        Initialize MusicBrainz service.
        
        Args:
            app_name: Application name for MusicBrainz API
            app_version: Application version
            contact: Contact email for MusicBrainz API
            rate_limit: Minimum seconds between API requests
            cache_dir: Directory for cache files
        """
        musicbrainzngs.set_useragent(app_name, app_version, contact)
        self.rate_limit = rate_limit
        self.last_request_time = 0.0
        self.cache = MusicBrainzCache(cache_dir=cache_dir)
        logger.info(f"MusicBrainz service initialized with {rate_limit}s rate limit")
    
    def _enforce_rate_limit(self):
        """Enforce rate limiting (1 req/sec default)."""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.rate_limit:
            sleep_time = self.rate_limit - elapsed
            logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
            time.sleep(sleep_time)
        self.last_request_time = time.time()
    
    def search_recording(self, query: str, limit: int = 5) -> List[dict]:
        """
        Search for recordings on MusicBrainz with caching.
        
        Args:
            query: Free-text search query
            limit: Maximum number of results
            
        Returns:
            List of recording dictionaries from MusicBrainz
        """
        # Check cache first
        cache_key = f"{query}::{limit}"
        cached = self.cache.get(cache_key, cache_type="query")
        if cached:
            logger.info(f"Cache HIT for query: {query}")
            return cached.get('recordings', [])
        
        # Cache miss - call API
        start_time = time.time()
        self._enforce_rate_limit()
        
        try:
            result = musicbrainzngs.search_recordings(query=query, limit=limit)
            recordings = result.get('recording-list', [])
            elapsed = time.time() - start_time
            logger.info(f"MusicBrainz API call took {elapsed:.2f}s for query: {query}")
            
            # Cache the result
            self.cache.set(cache_key, {'recordings': recordings}, cache_type="query")
            
            return recordings
        except Exception as e:
            logger.error(f"MusicBrainz API error: {e}")
            return []
    
    def get_recording_by_mbid(self, mbid: str) -> Optional[Dict[str, Any]]:
        """
        Get recording details by MusicBrainz ID with caching.
        
        Args:
            mbid: MusicBrainz recording ID
            
        Returns:
            Recording dict or None
        """
        # Check cache first
        cached = self.cache.get(mbid, cache_type="mbid")
        if cached:
            logger.info(f"Cache HIT for MBID: {mbid}")
            return cached
        
        # Cache miss - call API
        start_time = time.time()
        self._enforce_rate_limit()
        
        try:
            result = musicbrainzngs.get_recording_by_id(mbid, includes=['artists'])
            recording = result.get('recording', {})
            elapsed = time.time() - start_time
            logger.info(f"MusicBrainz API call took {elapsed:.2f}s for MBID: {mbid}")
            
            # Cache the result
            self.cache.set(mbid, recording, cache_type="mbid")
            
            return recording
        except Exception as e:
            logger.error(f"MusicBrainz API error for MBID {mbid}: {e}")
            return None
    
    def get_best_match(self, query: str) -> Optional[Tuple[str, str, str, float]]:
        """
        Get the best matching recording from MusicBrainz.
        
        Args:
            query: Free-text search query
            
        Returns:
            Tuple of (musicbrainz_id, title, artist, confidence) or None
        """
        recordings = self.search_recording(query, limit=1)
        
        if not recordings:
            return None
        
        recording = recordings[0]
        
        # Extract relevant information
        mb_id = recording.get('id', '')
        title = recording.get('title', '')
        
        # Get artist name
        artist = ''
        if 'artist-credit' in recording and recording['artist-credit']:
            artist = recording['artist-credit'][0].get('artist', {}).get('name', '')
        
        # Use the score from MusicBrainz as confidence (0-100) and normalize to 0-1
        confidence = float(recording.get('ext:score', 0)) / 100.0
        
        return (mb_id, title, artist, confidence)
    
    def match_to_catalog(self, query: str, catalog_tracks: List[Track]) -> Optional[Tuple[Track, float, str]]:
        """
        Try to match a MusicBrainz result to a track in the internal catalog.
        
        Args:
            query: Free-text search query
            catalog_tracks: List of tracks from internal catalog
            
        Returns:
            Tuple of (matched_track, confidence, mbid) or None
        """
        mb_match = self.get_best_match(query)
        
        if not mb_match:
            return None
        
        mb_id, mb_title, mb_artist, mb_confidence = mb_match
        
        # Try to find a matching track in the catalog
        best_match = None
        best_score = 0.0
        
        for track in catalog_tracks:
            score = 0.0
            
            # Exact title match
            if track.title.lower() == mb_title.lower():
                score += 5.0
            # Partial title match
            elif mb_title.lower() in track.title.lower() or track.title.lower() in mb_title.lower():
                score += 3.0
            
            # Exact artist match
            if track.artist.lower() == mb_artist.lower():
                score += 5.0
            # Partial artist match
            elif mb_artist.lower() in track.artist.lower() or track.artist.lower() in mb_artist.lower():
                score += 3.0
            
            if score > best_score:
                best_score = score
                best_match = track
        
        if best_match and best_score > 5.0:  # Require at least one exact match
            # Combine catalog match score with MusicBrainz confidence
            combined_confidence = (best_score / 10.0) * 0.7 + mb_confidence * 0.3
            return (best_match, min(combined_confidence, 1.0), mb_id)
        
        return None
    
    def clear_cache(self) -> int:
        """Clear the MusicBrainz cache."""
        return self.cache.clear()
    
    def get_cache_status(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return self.cache.get_cache_status()
