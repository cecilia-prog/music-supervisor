from typing import List, Tuple, Optional, Set
from app.models import Track, TrackSearchResult, SearchRequest, ClearanceStatus
import re
import logging

logger = logging.getLogger(__name__)


class SearchRanker:
    """Advanced ranking system for track search with filters and boosts."""
    
    @staticmethod
    def normalize_text(text: str) -> str:
        """Normalize text for matching: lowercase, strip punctuation, trim."""
        # Convert to lowercase
        text = text.lower()
        # Remove punctuation but keep spaces
        text = re.sub(r'[^\w\s]', '', text)
        # Normalize whitespace
        text = ' '.join(text.split())
        return text
    
    @staticmethod
    def tokenize(text: str) -> Set[str]:
        """Tokenize normalized text into words."""
        normalized = SearchRanker.normalize_text(text)
        return set(normalized.split())
    
    @staticmethod
    def passes_filters(track: Track, request: SearchRequest) -> bool:
        """
        Check if track passes all filter criteria.
        Returns True if track should be included in results.
        """
        # Mood filter
        if request.moods:
            normalized_moods = [SearchRanker.normalize_text(m) for m in request.moods]
            track_mood = SearchRanker.normalize_text(track.mood)
            if track_mood not in normalized_moods:
                return False
        
        # Genre filter
        if request.genres:
            normalized_genres = [SearchRanker.normalize_text(g) for g in request.genres]
            track_genre = SearchRanker.normalize_text(track.genre)
            if track_genre not in normalized_genres:
                return False
        
        # Tags filter (any tag match)
        if request.tags:
            normalized_req_tags = [SearchRanker.normalize_text(t) for t in request.tags]
            track_tags = [SearchRanker.normalize_text(t) for t in track.get_tags_list()]
            if not any(tag in track_tags for tag in normalized_req_tags):
                return False
        
        # Energy range filter
        if track.energy is not None:
            if request.min_energy is not None and track.energy < request.min_energy:
                return False
            if request.max_energy is not None and track.energy > request.max_energy:
                return False
        else:
            # If energy filtering is requested but track has no energy data, exclude it
            if request.min_energy is not None or request.max_energy is not None:
                return False
        
        # Valence range filter
        if track.valence is not None:
            if request.min_valence is not None and track.valence < request.min_valence:
                return False
            if request.max_valence is not None and track.valence > request.max_valence:
                return False
        else:
            # If valence filtering is requested but track has no valence data, exclude it
            if request.min_valence is not None or request.max_valence is not None:
                return False
        
        # Stems requirement
        if request.stems_required and not track.stems_available:
            return False
        
        # Clearance requirement
        if request.clearance_required and track.clearance_status != ClearanceStatus.cleared:
            return False
        
        return True
    
    @staticmethod
    def calculate_score(track: Track, request: SearchRequest) -> float:
        """
        Calculate relevance score for a track based on query and filters.
        
        Score is based on:
        - Title matches (weight: 3.0)
        - Artist matches (weight: 2.5)
        - Tag matches (weight: 2.0)
        - Mood matches (weight: 1.5)
        - Genre matches (weight: 1.5)
        - Album matches (weight: 1.0)
        - Filter overlap boosts
        - Missing required fields penalties
        """
        query_normalized = SearchRanker.normalize_text(request.query)
        query_tokens = SearchRanker.tokenize(request.query)
        score = 0.0
        
        # Exact phrase match bonuses (highest priority)
        if query_normalized == SearchRanker.normalize_text(track.title):
            score += 10.0
        if query_normalized == SearchRanker.normalize_text(track.artist):
            score += 8.0
        
        # Partial phrase matches
        if query_normalized in SearchRanker.normalize_text(track.title):
            score += 3.0
        if query_normalized in SearchRanker.normalize_text(track.artist):
            score += 2.5
        
        # Token-based matches (for multi-word queries)
        title_tokens = SearchRanker.tokenize(track.title)
        artist_tokens = SearchRanker.tokenize(track.artist)
        album_tokens = SearchRanker.tokenize(track.album)
        
        title_overlap = len(query_tokens & title_tokens)
        artist_overlap = len(query_tokens & artist_tokens)
        album_overlap = len(query_tokens & album_tokens)
        
        score += title_overlap * 1.5
        score += artist_overlap * 1.2
        score += album_overlap * 0.5
        
        # Tag matches
        tags_list = track.get_tags_list()
        tag_tokens = set()
        for tag in tags_list:
            tag_tokens.update(SearchRanker.tokenize(tag))
        
        tag_overlap = len(query_tokens & tag_tokens)
        score += tag_overlap * 2.0
        
        # Mood match
        if query_normalized in SearchRanker.normalize_text(track.mood):
            score += 1.5
        mood_tokens = SearchRanker.tokenize(track.mood)
        mood_overlap = len(query_tokens & mood_tokens)
        score += mood_overlap * 1.0
        
        # Genre match
        if query_normalized in SearchRanker.normalize_text(track.genre):
            score += 1.5
        genre_tokens = SearchRanker.tokenize(track.genre)
        genre_overlap = len(query_tokens & genre_tokens)
        score += genre_overlap * 1.0
        
        # Year match
        if request.query in str(track.year):
            score += 1.0
        
        # Filter overlap boosts (reward tracks that match filter criteria even if not required)
        if request.moods and SearchRanker.normalize_text(track.mood) in [SearchRanker.normalize_text(m) for m in request.moods]:
            score += 2.0
        
        if request.genres and SearchRanker.normalize_text(track.genre) in [SearchRanker.normalize_text(g) for g in request.genres]:
            score += 2.0
        
        if request.tags:
            normalized_req_tags = [SearchRanker.normalize_text(t) for t in request.tags]
            track_tags_normalized = [SearchRanker.normalize_text(t) for t in track.get_tags_list()]
            tag_filter_overlap = len(set(normalized_req_tags) & set(track_tags_normalized))
            score += tag_filter_overlap * 1.5
        
        # Penalty for missing stems if stems_required
        if request.stems_required and not track.stems_available:
            score -= 5.0
        
        # Penalty for uncleared status if clearance_required
        if request.clearance_required and track.clearance_status != ClearanceStatus.cleared:
            score -= 5.0
        
        return score
    
    @classmethod
    def search_tracks(
        cls,
        tracks: List[Track],
        request: SearchRequest
    ) -> List[TrackSearchResult]:
        """
        Search tracks with filters and return ranked results.
        
        Args:
            tracks: List of all tracks to search
            request: SearchRequest with query and optional filters
            
        Returns:
            List of TrackSearchResult ordered by relevance score
        """
        # First, filter tracks
        filtered_tracks = [track for track in tracks if cls.passes_filters(track, request)]
        
        logger.info(f"Filtered {len(tracks)} tracks to {len(filtered_tracks)} based on criteria")
        
        # Calculate scores for filtered tracks
        scored_tracks: List[Tuple[Track, float]] = []
        
        for track in filtered_tracks:
            score = cls.calculate_score(track, request)
            if score > 0:  # Only include tracks with some relevance
                scored_tracks.append((track, score))
        
        # Sort by score (descending) and limit results
        scored_tracks.sort(key=lambda x: x[1], reverse=True)
        scored_tracks = scored_tracks[:request.limit]
        
        # Convert to TrackSearchResult objects
        results = [
            TrackSearchResult(track=track, score=score)
            for track, score in scored_tracks
        ]
        
        logger.info(f"Returning {len(results)} search results")
        
        return results
