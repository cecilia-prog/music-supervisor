"""
Tests for search ranking and filtering.
"""

import pytest
from app.search import SearchRanker
from app.models import Track, SearchRequest, ClearanceStatus


@pytest.fixture
def sample_tracks():
    """Create sample tracks for testing."""
    return [
        Track(
            buffet_track_id="track_0001",
            id=1,
            title="Bohemian Rhapsody",
            artist="Queen",
            album="A Night at the Opera",
            duration=354,
            genre="Rock",
            mood="Epic",
            tags="rock,classic,opera",
            year=1975,
            energy=0.8,
            valence=0.6
        ),
        Track(
            buffet_track_id="track_0002",
            id=2,
            title="Imagine",
            artist="John Lennon",
            album="Imagine",
            duration=183,
            genre="Pop",
            mood="Peaceful",
            tags="pop,peaceful,classic",
            year=1971,
            energy=0.3,
            valence=0.7
        ),
        Track(
            buffet_track_id="track_0003",
            id=3,
            title="Stairway to Heaven",
            artist="Led Zeppelin",
            album="Led Zeppelin IV",
            duration=482,
            genre="Rock",
            mood="Epic",
            tags="rock,classic,progressive",
            year=1971,
            energy=0.7,
            valence=0.5,
            stems_available=True,
            clearance_status=ClearanceStatus.cleared
        )
    ]


def test_basic_search(sample_tracks):
    """Test basic search functionality."""
    request = SearchRequest(query="rock", limit=10)
    results = SearchRanker.search_tracks(sample_tracks, request)
    
    assert len(results) > 0
    # Should find rock tracks
    rock_tracks = [r for r in results if "rock" in r.track.genre.lower() or "rock" in r.track.tags.lower()]
    assert len(rock_tracks) > 0


def test_search_ranking_deterministic(sample_tracks):
    """Test that search ranking is deterministic."""
    request = SearchRequest(query="rock", limit=10)
    
    results1 = SearchRanker.search_tracks(sample_tracks, request)
    results2 = SearchRanker.search_tracks(sample_tracks, request)
    
    # Same query should give same results
    assert len(results1) == len(results2)
    for r1, r2 in zip(results1, results2):
        assert r1.track.buffet_track_id == r2.track.buffet_track_id
        assert r1.score == r2.score


def test_filter_by_mood(sample_tracks):
    """Test filtering by mood."""
    request = SearchRequest(query="music", moods=["Peaceful"], limit=10)
    results = SearchRanker.search_tracks(sample_tracks, request)
    
    # All results should match the mood filter
    for result in results:
        assert SearchRanker.normalize_text(result.track.mood) == "peaceful"


def test_filter_by_genre(sample_tracks):
    """Test filtering by genre."""
    request = SearchRequest(query="music", genres=["Rock"], limit=10)
    results = SearchRanker.search_tracks(sample_tracks, request)
    
    # All results should be Rock
    for result in results:
        assert SearchRanker.normalize_text(result.track.genre) == "rock"


def test_filter_by_tags(sample_tracks):
    """Test filtering by tags."""
    request = SearchRequest(query="music", tags=["classic"], limit=10)
    results = SearchRanker.search_tracks(sample_tracks, request)
    
    # All results should have the tag
    for result in results:
        track_tags = [SearchRanker.normalize_text(t) for t in result.track.get_tags_list()]
        assert "classic" in track_tags


def test_filter_by_energy_range(sample_tracks):
    """Test filtering by energy range."""
    request = SearchRequest(query="music", min_energy=0.5, max_energy=0.9, limit=10)
    results = SearchRanker.search_tracks(sample_tracks, request)
    
    # All results should be in energy range
    for result in results:
        assert result.track.energy is not None
        assert 0.5 <= result.track.energy <= 0.9


def test_filter_stems_required(sample_tracks):
    """Test filtering for stems availability."""
    request = SearchRequest(query="music", stems_required=True, limit=10)
    results = SearchRanker.search_tracks(sample_tracks, request)
    
    # All results should have stems available
    for result in results:
        assert result.track.stems_available is True


def test_filter_clearance_required(sample_tracks):
    """Test filtering for clearance status."""
    request = SearchRequest(query="music", clearance_required=True, limit=10)
    results = SearchRanker.search_tracks(sample_tracks, request)
    
    # All results should be cleared
    for result in results:
        assert result.track.clearance_status == ClearanceStatus.cleared


def test_combined_filters(sample_tracks):
    """Test combining multiple filters."""
    request = SearchRequest(
        query="rock",
        genres=["Rock"],
        min_energy=0.6,
        limit=10
    )
    results = SearchRanker.search_tracks(sample_tracks, request)
    
    for result in results:
        assert SearchRanker.normalize_text(result.track.genre) == "rock"
        assert result.track.energy is not None
        assert result.track.energy >= 0.6


def test_normalize_text():
    """Test text normalization."""
    assert SearchRanker.normalize_text("Hello World!") == "hello world"
    assert SearchRanker.normalize_text("Rock'n'Roll") == "rocknroll"
    assert SearchRanker.normalize_text("  Multiple   Spaces  ") == "multiple spaces"


def test_tokenize():
    """Test tokenization."""
    tokens = SearchRanker.tokenize("Hello World")
    assert tokens == {"hello", "world"}
    
    tokens = SearchRanker.tokenize("Rock and Roll")
    assert tokens == {"rock", "and", "roll"}
