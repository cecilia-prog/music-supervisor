import csv
from pathlib import Path
from typing import List, Optional, Dict
from app.models import Track, ClearanceStatus
import logging

logger = logging.getLogger(__name__)


class MusicCatalog:
    """Manager for the internal music catalog."""
    
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.tracks: List[Track] = []
        self.tracks_by_id: Dict[str, Track] = {}  # Now keyed by buffet_track_id (string)
        self.load_catalog()
    
    def load_catalog(self):
        """Load tracks from CSV file with support for both old and new schema."""
        catalog_file = Path(self.csv_path)
        
        if not catalog_file.exists():
            raise FileNotFoundError(f"Catalog file not found: {self.csv_path}")
        
        self.tracks = []
        self.tracks_by_id = {}
        
        with open(catalog_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Normalize ID: prefer buffet_track_id, fall back to id
                if 'buffet_track_id' in row and row['buffet_track_id']:
                    buffet_track_id = row['buffet_track_id']
                    legacy_id = int(row['id']) if 'id' in row and row['id'] else None
                elif 'id' in row and row['id']:
                    # Convert legacy numeric ID to string buffet_track_id
                    legacy_id = int(row['id'])
                    buffet_track_id = f"track_{legacy_id:04d}"
                else:
                    logger.warning(f"Skipping row with no ID: {row}")
                    continue
                
                # Build track with required fields
                track_data = {
                    'buffet_track_id': buffet_track_id,
                    'id': legacy_id,
                    'title': row['title'],
                    'artist': row['artist'],
                    'album': row['album'],
                    'duration': int(row['duration']),
                    'genre': row['genre'],
                    'mood': row['mood'],
                    'tags': row['tags'],
                    'year': int(row['year']),
                }
                
                # Add optional fields if present
                if 'mbid' in row and row['mbid']:
                    track_data['mbid'] = row['mbid']
                if 'isrc' in row and row['isrc']:
                    track_data['isrc'] = row['isrc']
                if 'spotify_id' in row and row['spotify_id']:
                    track_data['spotify_id'] = row['spotify_id']
                if 'stems_available' in row and row['stems_available']:
                    track_data['stems_available'] = row['stems_available'].lower() in ('true', '1', 'yes')
                if 'clearance_status' in row and row['clearance_status']:
                    try:
                        track_data['clearance_status'] = ClearanceStatus(row['clearance_status'].lower())
                    except ValueError:
                        track_data['clearance_status'] = ClearanceStatus.unknown
                if 'energy' in row and row['energy']:
                    try:
                        track_data['energy'] = float(row['energy'])
                    except ValueError:
                        pass
                if 'valence' in row and row['valence']:
                    try:
                        track_data['valence'] = float(row['valence'])
                    except ValueError:
                        pass
                
                track = Track(**track_data)
                self.tracks.append(track)
                self.tracks_by_id[track.buffet_track_id] = track
        
        logger.info(f"Loaded {len(self.tracks)} tracks from {self.csv_path}")
    
    def get_track_by_id(self, track_id: str) -> Optional[Track]:
        """Retrieve a track by its buffet_track_id."""
        return self.tracks_by_id.get(track_id)
    
    def get_track_by_legacy_id(self, legacy_id: int) -> Optional[Track]:
        """Retrieve a track by legacy numeric ID (for backwards compatibility)."""
        buffet_id = f"track_{legacy_id:04d}"
        return self.tracks_by_id.get(buffet_id)
    
    def get_all_tracks(self) -> List[Track]:
        """Get all tracks in the catalog."""
        return self.tracks
