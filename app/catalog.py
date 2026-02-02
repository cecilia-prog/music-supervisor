import csv
from pathlib import Path
from typing import List, Optional, Dict
from app.models import Track


class MusicCatalog:
    """Manager for the internal music catalog."""
    
    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.tracks: List[Track] = []
        self.tracks_by_id: Dict[int, Track] = {}
        self.load_catalog()
    
    def load_catalog(self):
        """Load tracks from CSV file."""
        catalog_file = Path(self.csv_path)
        
        if not catalog_file.exists():
            raise FileNotFoundError(f"Catalog file not found: {self.csv_path}")
        
        with open(catalog_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                track = Track(
                    id=int(row['id']),
                    title=row['title'],
                    artist=row['artist'],
                    album=row['album'],
                    duration=int(row['duration']),
                    genre=row['genre'],
                    mood=row['mood'],
                    tags=row['tags'],
                    year=int(row['year'])
                )
                self.tracks.append(track)
                self.tracks_by_id[track.id] = track
    
    def get_track_by_id(self, track_id: int) -> Optional[Track]:
        """Retrieve a track by its ID."""
        return self.tracks_by_id.get(track_id)
    
    def get_all_tracks(self) -> List[Track]:
        """Get all tracks in the catalog."""
        return self.tracks
