"""
Structured resolver pipeline for music queries.
Tries internal catalog matching first, then falls back to MusicBrainz.
"""

from typing import List, Tuple, Optional, Dict, Any
from app.models import Track, ResolveResponse
from app.search import SearchRanker, SearchRequest
from app.musicbrainz import MusicBrainzService
import logging

logger = logging.getLogger(__name__)


class ResolverService:
    """
    Structured resolver that attempts internal matching before external APIs.
    
    Pipeline:
    1. Attempt fuzzy match against internal catalog
    2. If low confidence, call MusicBrainz
    3. Return best match with candidates, confidence, and source
    """
    
    # Confidence thresholds
    HIGH_CONFIDENCE = 0.8
    MEDIUM_CONFIDENCE = 0.5
    LOW_CONFIDENCE = 0.3
    
    def __init__(
        self,
        catalog_tracks: List[Track],
        musicbrainz_service: Optional[MusicBrainzService] = None
    ):
        self.catalog_tracks = catalog_tracks
        self.musicbrainz_service = musicbrainz_service
    
    def _internal_match(self, query: str, limit: int = 5) -> Tuple[Optional[Track], List[Track], float]:
        """
        Attempt to match query against internal catalog.
        
        Returns:
            Tuple of (best_match, candidates, confidence)
        """
        # Use search ranking to find matches
        search_request = SearchRequest(query=query, limit=limit)
        results = SearchRanker.search_tracks(self.catalog_tracks, search_request)
        
        if not results:
            return None, [], 0.0
        
        # Best match is highest scored
        best_result = results[0]
        candidates = [r.track for r in results[1:]]
        
        # Normalize score to 0-1 confidence
        # Scores can vary widely, so we use a logarithmic-ish approach
        # A score of 10+ is very high confidence
        confidence = min(best_result.score / 12.0, 1.0)
        
        logger.info(f"Internal match for '{query}': {best_result.track.title} by {best_result.track.artist} (confidence: {confidence:.2f})")
        
        return best_result.track, candidates, confidence
    
    def _external_match(self, query: str) -> Tuple[Optional[Track], List[Track], float, Optional[str]]:
        """
        Attempt to match query using MusicBrainz.
        
        Returns:
            Tuple of (best_match, candidates, confidence, mbid)
        """
        if not self.musicbrainz_service:
            return None, [], 0.0, None
        
        result = self.musicbrainz_service.match_to_catalog(query, self.catalog_tracks)
        
        if not result:
            logger.info(f"External match (MusicBrainz) found nothing for '{query}'")
            return None, [], 0.0, None
        
        track, confidence, mbid = result
        
        logger.info(f"External match for '{query}': {track.title} by {track.artist} (confidence: {confidence:.2f}, MBID: {mbid})")
        
        # No candidates from MusicBrainz single match
        return track, [], confidence, mbid
    
    def resolve(self, query: str) -> ResolveResponse:
        """
        Resolve a query to a track using the structured pipeline.
        
        Algorithm:
        1. Try internal catalog match
        2. If confidence < MEDIUM_CONFIDENCE and MusicBrainz enabled, try external
        3. Return best result with source attribution
        
        Args:
            query: Free-text query to resolve
            
        Returns:
            ResolveResponse with best_match, candidates, confidence, and source
        """
        logger.info(f"Resolving query: '{query}'")
        
        # Step 1: Internal match
        internal_track, internal_candidates, internal_confidence = self._internal_match(query)
        
        # Step 2: If internal confidence is medium-high, use it
        if internal_confidence >= self.MEDIUM_CONFIDENCE:
            logger.info(f"Using internal match (confidence {internal_confidence:.2f} >= {self.MEDIUM_CONFIDENCE})")
            return ResolveResponse(
                query=query,
                best_match=internal_track,
                candidates=internal_candidates,
                confidence=internal_confidence,
                source="internal",
                canonical_id=internal_track.buffet_track_id if internal_track else None,
                musicbrainz_id=internal_track.mbid if internal_track else None,
                matched_track=internal_track
            )
        
        # Step 3: Try MusicBrainz if enabled and internal confidence is low
        if self.musicbrainz_service:
            logger.info(f"Internal confidence {internal_confidence:.2f} < {self.MEDIUM_CONFIDENCE}, trying MusicBrainz")
            external_track, _, external_confidence, mbid = self._external_match(query)
            
            # Use external match if it has higher confidence
            if external_track and external_confidence > internal_confidence:
                logger.info(f"Using external match (confidence {external_confidence:.2f} > {internal_confidence:.2f})")
                return ResolveResponse(
                    query=query,
                    best_match=external_track,
                    candidates=internal_candidates,  # Include internal candidates too
                    confidence=external_confidence,
                    source="musicbrainz",
                    canonical_id=external_track.buffet_track_id,
                    musicbrainz_id=mbid,
                    matched_track=external_track
                )
        
        # Step 4: Fall back to internal match (even if low confidence)
        if internal_track:
            logger.info(f"Using internal match as fallback (confidence {internal_confidence:.2f})")
            return ResolveResponse(
                query=query,
                best_match=internal_track,
                candidates=internal_candidates,
                confidence=internal_confidence,
                source="internal",
                canonical_id=internal_track.buffet_track_id,
                musicbrainz_id=internal_track.mbid if internal_track else None,
                matched_track=internal_track
            )
        
        # Step 5: No match found
        logger.warning(f"No match found for query: '{query}'")
        return ResolveResponse(
            query=query,
            best_match=None,
            candidates=[],
            confidence=0.0,
            source="none",
            canonical_id=None,
            musicbrainz_id=None,
            matched_track=None
        )
