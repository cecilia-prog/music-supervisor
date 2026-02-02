import musicbrainzngs
import logging
from typing import Optional, Tuple, List
from app.models import Track

logger = logging.getLogger(__name__)


class MusicBrainzService:
    """Service for interacting with MusicBrainz API."""
    
    def __init__(self, app_name: str = "MusicSupervisor", app_version: str = "1.0", contact: str = ""):
        """
        Initialize MusicBrainz service.
        
        Args:
            app_name: Application name for MusicBrainz API
            app_version: Application version
            contact: Contact email for MusicBrainz API
        """
        musicbrainzngs.set_useragent(app_name, app_version, contact)
        musicbrainzngs.set_rate_limit(limit_or_interval=1.0)  # Be nice to the API
    
    def search_recording(self, query: str, limit: int = 5) -> List[dict]:
        """
        Search for recordings on MusicBrainz.
        
        Args:
            query: Free-text search query
            limit: Maximum number of results
            
        Returns:
            List of recording dictionaries from MusicBrainz
        """
        try:
            result = musicbrainzngs.search_recordings(query=query, limit=limit)
            return result.get('recording-list', [])
        except Exception as e:
            logger.error(f"MusicBrainz API error: {e}")
            return []
    
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
    
    def match_to_catalog(self, query: str, catalog_tracks: List[Track]) -> Optional[Tuple[Track, float]]:
        """
        Try to match a MusicBrainz result to a track in the internal catalog.
        
        Args:
            query: Free-text search query
            catalog_tracks: List of tracks from internal catalog
            
        Returns:
            Tuple of (matched_track, confidence) or None
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
            return (best_match, min(combined_confidence, 1.0))
        
        return None
