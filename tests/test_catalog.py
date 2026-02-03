"""
Basic tests for music catalog loading and operations.
"""

import pytest
from pathlib import Path
from app.catalog import MusicCatalog
from app.models import Track, ClearanceStatus


@pytest.fixture
def catalog():
    """Load test catalog."""
    catalog_path = Path(__file__).parent.parent / "data" / "music_catalog.csv"
    return MusicCatalog(str(catalog_path))


def test_catalog_loads(catalog):
    """Test that catalog loads successfully."""
    assert catalog is not None
    assert len(catalog.tracks) > 0
    assert len(catalog.tracks_by_id) > 0


def test_tracks_have_buffet_ids(catalog):
    """Test that all tracks have buffet_track_id."""
    for track in catalog.tracks:
        assert track.buffet_track_id is not None
        assert isinstance(track.buffet_track_id, str)
        assert len(track.buffet_track_id) > 0


def test_get_track_by_id(catalog):
    """Test retrieving tracks by buffet_track_id."""
    # Get first track's ID
    first_track = catalog.tracks[0]
    
    # Retrieve it by ID
    retrieved = catalog.get_track_by_id(first_track.buffet_track_id)
    
    assert retrieved is not None
    assert retrieved.buffet_track_id == first_track.buffet_track_id
    assert retrieved.title == first_track.title


def test_get_track_by_legacy_id(catalog):
    """Test backwards compatibility with legacy numeric IDs."""
    # Assuming track_0001 exists
    track = catalog.get_track_by_legacy_id(1)
    
    if track:
        assert track.buffet_track_id == "track_0001"


def test_track_model_fields(catalog):
    """Test that Track model has all required fields."""
    track = catalog.tracks[0]
    
    # Core fields
    assert hasattr(track, 'buffet_track_id')
    assert hasattr(track, 'title')
    assert hasattr(track, 'artist')
    assert hasattr(track, 'album')
    assert hasattr(track, 'duration')
    assert hasattr(track, 'genre')
    assert hasattr(track, 'mood')
    assert hasattr(track, 'tags')
    assert hasattr(track, 'year')
    
    # Optional mapping fields
    assert hasattr(track, 'mbid')
    assert hasattr(track, 'isrc')
    assert hasattr(track, 'spotify_id')
    assert hasattr(track, 'stems_available')
    assert hasattr(track, 'clearance_status')
    assert hasattr(track, 'energy')
    assert hasattr(track, 'valence')


def test_get_tags_list(catalog):
    """Test tag parsing."""
    track = catalog.tracks[0]
    tags = track.get_tags_list()
    
    assert isinstance(tags, list)
    assert all(isinstance(tag, str) for tag in tags)
