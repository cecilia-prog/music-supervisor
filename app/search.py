from typing import List, Tuple
from app.models import Track, TrackSearchResult


class SearchRanker:
    """Simple ranking system for track search."""
    
    @staticmethod
    def calculate_score(track: Track, query: str) -> float:
        """
        Calculate relevance score for a track based on query.
        
        Score is based on matches in:
        - Title (weight: 3.0)
        - Artist (weight: 2.5)
        - Tags (weight: 2.0)
        - Mood (weight: 1.5)
        - Genre (weight: 1.5)
        - Album (weight: 1.0)
        """
        query_lower = query.lower()
        score = 0.0
        
        # Exact match bonuses
        if query_lower == track.title.lower():
            score += 10.0
        if query_lower == track.artist.lower():
            score += 8.0
        
        # Partial match scores
        if query_lower in track.title.lower():
            score += 3.0
        if query_lower in track.artist.lower():
            score += 2.5
        
        # Tag matches
        tags_list = track.get_tags_list()
        for tag in tags_list:
            if query_lower in tag.lower() or tag.lower() in query_lower:
                score += 2.0
        
        # Mood match
        if query_lower in track.mood.lower() or track.mood.lower() in query_lower:
            score += 1.5
        
        # Genre match
        if query_lower in track.genre.lower() or track.genre.lower() in query_lower:
            score += 1.5
        
        # Album match
        if query_lower in track.album.lower():
            score += 1.0
        
        # Year match
        if query in str(track.year):
            score += 1.0
        
        return score
    
    @classmethod
    def search_tracks(cls, tracks: List[Track], query: str, limit: int = 10) -> List[TrackSearchResult]:
        """
        Search tracks and return ranked results.
        
        Args:
            tracks: List of all tracks to search
            query: Search query string
            limit: Maximum number of results to return
            
        Returns:
            List of TrackSearchResult ordered by relevance score
        """
        # Calculate scores for all tracks
        scored_tracks: List[Tuple[Track, float]] = []
        
        for track in tracks:
            score = cls.calculate_score(track, query)
            if score > 0:  # Only include tracks with some relevance
                scored_tracks.append((track, score))
        
        # Sort by score (descending) and limit results
        scored_tracks.sort(key=lambda x: x[1], reverse=True)
        scored_tracks = scored_tracks[:limit]
        
        # Convert to TrackSearchResult objects
        results = [
            TrackSearchResult(track=track, score=score)
            for track, score in scored_tracks
        ]
        
        return results
