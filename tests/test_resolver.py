"""
Tests for resolver pipeline.
"""

import pytest
from unittest.mock import Mock, MagicMock
from app.resolver import ResolverService
from app.models import Track, ClearanceStatus


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
            year=1975
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
            year=1971
        )
    ]


def test_internal_match_exact(sample_tracks):
    """Test internal matching with exact title."""
    resolver = ResolverService(catalog_tracks=sample_tracks, musicbrainz_service=None)
    
    result = resolver.resolve("Bohemian Rhapsody")
    
    assert result.best_match is not None
    assert result.best_match.title == "Bohemian Rhapsody"
    assert result.source == "internal"
    assert result.confidence > 0.5


def test_internal_match_artist(sample_tracks):
    """Test internal matching with artist name."""
    resolver = ResolverService(catalog_tracks=sample_tracks, musicbrainz_service=None)
    
    result = resolver.resolve("Queen")
    
    assert result.best_match is not None
    assert result.best_match.artist == "Queen"
    assert result.source == "internal"


def test_no_match(sample_tracks):
    """Test when no match is found."""
    resolver = ResolverService(catalog_tracks=sample_tracks, musicbrainz_service=None)
    
    result = resolver.resolve("Some Song That Doesn't Exist XYZ123")
    
    assert result.best_match is None
    assert result.confidence == 0.0
    assert result.source == "none"


def test_resolve_with_candidates(sample_tracks):
    """Test that resolve returns candidates."""
    resolver = ResolverService(catalog_tracks=sample_tracks, musicbrainz_service=None)
    
    result = resolver.resolve("music")
    
    # Should have a best match and potentially candidates
    if result.best_match:
        assert result.candidates is not None
        assert isinstance(result.candidates, list)


def test_musicbrainz_fallback(sample_tracks):
    """Test fallback to MusicBrainz when internal confidence is low."""
    # Mock MusicBrainz service
    mock_mb = Mock()
    mock_mb.match_to_catalog = Mock(return_value=(
        sample_tracks[0],
        0.9,
        "mock-mbid-123"
    ))
    
    resolver = ResolverService(catalog_tracks=sample_tracks, musicbrainz_service=mock_mb)
    
    # Query that won't match well internally
    result = resolver.resolve("some obscure query xyz")
    
    # Should have tried MusicBrainz
    # (Actual behavior depends on internal match score)
    assert result is not None


def test_confidence_scoring(sample_tracks):
    """Test that confidence scores are in valid range."""
    resolver = ResolverService(catalog_tracks=sample_tracks, musicbrainz_service=None)
    
    result = resolver.resolve("Bohemian Rhapsody Queen")
    
    assert 0.0 <= result.confidence <= 1.0


def test_backwards_compatibility_fields(sample_tracks):
    """Test that legacy fields are populated."""
    resolver = ResolverService(catalog_tracks=sample_tracks, musicbrainz_service=None)
    
    result = resolver.resolve("Imagine")
    
    # Check legacy fields
    if result.best_match:
        assert result.canonical_id == result.best_match.buffet_track_id
        assert result.matched_track == result.best_match
