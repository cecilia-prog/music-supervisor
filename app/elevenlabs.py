"""
11Labs Conversational AI integration for Music Supervisor.
This module handles webhook endpoints for 11Labs agent interactions.
"""
import logging
from typing import Dict, Any, Optional
from fastapi import Request

logger = logging.getLogger(__name__)


class ElevenLabsHandler:
    """Handler for 11Labs conversational AI agent callbacks."""
    
    def __init__(self, catalog_service, search_service, musicbrainz_service):
        """
        Initialize 11Labs handler with music services.
        
        Args:
            catalog_service: MusicCatalog instance
            search_service: SearchRanker instance
            musicbrainz_service: MusicBrainzService instance
        """
        self.catalog = catalog_service
        self.search = search_service
        self.musicbrainz = musicbrainz_service
    
    async def handle_webhook(self, request: Request) -> Dict[str, Any]:
        """
        Handle webhook callback from 11Labs agent.
        
        Args:
            request: FastAPI request object with webhook payload
            
        Returns:
            Response to send back to 11Labs agent
        """
        try:
            payload = await request.json()
            logger.info(f"Received 11Labs webhook: {payload}")
            
            # Extract the user's query/intent from the payload
            intent = self._extract_intent(payload)
            user_query = payload.get("query", "")
            
            # Route to appropriate handler based on intent
            if intent == "search_music":
                return await self._handle_search(user_query, payload)
            elif intent == "get_track_info":
                return await self._handle_track_info(payload)
            elif intent == "resolve_song":
                return await self._handle_resolve(user_query)
            elif intent == "recommend_by_mood":
                return await self._handle_mood_search(payload)
            else:
                return self._default_response()
                
        except Exception as e:
            logger.error(f"Error handling 11Labs webhook: {e}")
            return {
                "response": "I'm having trouble accessing the music catalog right now. Could you try again?",
                "error": str(e)
            }
    
    def _extract_intent(self, payload: Dict) -> str:
        """Extract user intent from webhook payload."""
        # This will depend on how 11Labs structures their webhook
        # Common patterns:
        return payload.get("intent", payload.get("action", "unknown"))
    
    async def _handle_search(self, query: str, payload: Dict) -> Dict[str, Any]:
        """Handle music search requests."""
        limit = payload.get("limit", 5)
        
        from app.search import SearchRanker
        results = SearchRanker.search_tracks(
            tracks=self.catalog.get_all_tracks(),
            query=query,
            limit=limit
        )
        
        if not results:
            return {
                "response": f"I couldn't find any tracks matching '{query}'. Would you like to try a different search?",
                "tracks": []
            }
        
        # Format results for natural language response
        top_result = results[0]
        response_text = self._format_search_response(results, query)
        
        return {
            "response": response_text,
            "tracks": [
                {
                    "id": r.track.id,
                    "title": r.track.title,
                    "artist": r.track.artist,
                    "album": r.track.album,
                    "score": r.score
                }
                for r in results
            ]
        }
    
    async def _handle_track_info(self, payload: Dict) -> Dict[str, Any]:
        """Handle requests for specific track information."""
        track_id = payload.get("track_id")
        track_title = payload.get("track_title")
        
        track = None
        if track_id:
            track = self.catalog.get_track_by_id(int(track_id))
        elif track_title:
            # Search by exact title
            from app.search import SearchRanker
            results = SearchRanker.search_tracks(
                tracks=self.catalog.get_all_tracks(),
                query=track_title,
                limit=1
            )
            if results:
                track = results[0].track
        
        if not track:
            return {
                "response": "I couldn't find that track in the catalog.",
                "track": None
            }
        
        response_text = (
            f"{track.title} by {track.artist} is from the album {track.album}, "
            f"released in {track.year}. It's a {track.genre} track with a {track.mood.lower()} mood. "
            f"The song is {track.duration // 60} minutes and {track.duration % 60} seconds long."
        )
        
        return {
            "response": response_text,
            "track": {
                "id": track.id,
                "title": track.title,
                "artist": track.artist,
                "album": track.album,
                "duration": track.duration,
                "genre": track.genre,
                "mood": track.mood,
                "year": track.year
            }
        }
    
    async def _handle_resolve(self, query: str) -> Dict[str, Any]:
        """Handle song name resolution using MusicBrainz."""
        mb_match = self.musicbrainz.get_best_match(query)
        
        if not mb_match:
            return {
                "response": f"I couldn't identify '{query}'. Could you provide more details?",
                "resolved": False
            }
        
        mb_id, mb_title, mb_artist, mb_confidence = mb_match
        
        # Try to match to catalog
        catalog_match = self.musicbrainz.match_to_catalog(query, self.catalog.get_all_tracks())
        
        if catalog_match:
            track, confidence = catalog_match
            response_text = (
                f"Found it! '{mb_title}' by {mb_artist}. "
                f"It's in our catalog as track ID {track.id}."
            )
            return {
                "response": response_text,
                "resolved": True,
                "track": {
                    "id": track.id,
                    "title": track.title,
                    "artist": track.artist,
                    "musicbrainz_id": mb_id,
                    "confidence": confidence
                }
            }
        else:
            return {
                "response": f"I found '{mb_title}' by {mb_artist}, but it's not in our current catalog.",
                "resolved": True,
                "in_catalog": False,
                "musicbrainz_id": mb_id
            }
    
    async def _handle_mood_search(self, payload: Dict) -> Dict[str, Any]:
        """Handle mood-based recommendations."""
        mood = payload.get("mood", "").lower()
        limit = payload.get("limit", 5)
        
        from app.search import SearchRanker
        results = SearchRanker.search_tracks(
            tracks=self.catalog.get_all_tracks(),
            query=mood,
            limit=limit
        )
        
        if not results:
            return {
                "response": f"I don't have any tracks matching the mood '{mood}'. Try moods like peaceful, energetic, or melancholic.",
                "tracks": []
            }
        
        mood_tracks = [r for r in results if mood in r.track.mood.lower()]
        
        if mood_tracks:
            response_text = f"Here are some {mood} tracks: " + ", ".join(
                f"{t.track.title} by {t.track.artist}" for t in mood_tracks[:3]
            )
        else:
            response_text = f"Here are tracks related to {mood}: " + ", ".join(
                f"{t.track.title} by {t.track.artist}" for t in results[:3]
            )
        
        return {
            "response": response_text,
            "tracks": [
                {
                    "id": r.track.id,
                    "title": r.track.title,
                    "artist": r.track.artist,
                    "mood": r.track.mood
                }
                for r in results
            ]
        }
    
    def _format_search_response(self, results, query: str) -> str:
        """Format search results into natural language."""
        if len(results) == 1:
            track = results[0].track
            return f"I found '{track.title}' by {track.artist}. It's a {track.genre} track from {track.year}."
        else:
            top_3 = results[:3]
            tracks_list = ", ".join(f"'{t.track.title}' by {t.track.artist}" for t in top_3)
            return f"I found {len(results)} tracks for '{query}'. The top matches are: {tracks_list}."
    
    def _default_response(self) -> Dict[str, Any]:
        """Default response for unknown intents."""
        return {
            "response": "I can help you search for music, get track information, or find songs by mood. What would you like to do?",
            "suggestions": [
                "Search for rock songs",
                "Tell me about Bohemian Rhapsody",
                "Find peaceful tracks"
            ]
        }
