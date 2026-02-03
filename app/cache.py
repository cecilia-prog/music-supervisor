"""
Cache layer for MusicBrainz API results.
Implements both in-memory LRU cache and optional disk-based JSON cache.
"""

from typing import Optional, Any, Dict
from functools import lru_cache
from pathlib import Path
import json
import hashlib
import logging

logger = logging.getLogger(__name__)


class MusicBrainzCache:
    """Cache for MusicBrainz API results with LRU memory and disk persistence."""
    
    def __init__(self, cache_dir: str = "data/cache", enable_disk_cache: bool = True):
        self.cache_dir = Path(cache_dir)
        self.enable_disk_cache = enable_disk_cache
        
        if self.enable_disk_cache:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"MusicBrainz cache initialized at {self.cache_dir}")
    
    def _get_cache_key(self, query: str, cache_type: str = "query") -> str:
        """Generate cache key from query string."""
        # Use hash to create filesystem-safe key
        hash_obj = hashlib.md5(query.encode('utf-8'))
        return f"{cache_type}_{hash_obj.hexdigest()}.json"
    
    def _get_cache_path(self, cache_key: str) -> Path:
        """Get full path to cache file."""
        return self.cache_dir / cache_key
    
    def get(self, query: str, cache_type: str = "query") -> Optional[Dict[str, Any]]:
        """
        Retrieve cached result for a query.
        
        Args:
            query: The query string (or MBID)
            cache_type: Type of cache ('query' or 'mbid')
        
        Returns:
            Cached data dict or None if not found
        """
        if not self.enable_disk_cache:
            return None
        
        cache_key = self._get_cache_key(query, cache_type)
        cache_path = self._get_cache_path(cache_key)
        
        if cache_path.exists():
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    logger.debug(f"Cache HIT for {cache_type}: {query}")
                    return data
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Failed to read cache file {cache_path}: {e}")
                return None
        
        logger.debug(f"Cache MISS for {cache_type}: {query}")
        return None
    
    def set(self, query: str, data: Dict[str, Any], cache_type: str = "query") -> None:
        """
        Store result in cache.
        
        Args:
            query: The query string (or MBID)
            data: Data to cache
            cache_type: Type of cache ('query' or 'mbid')
        """
        if not self.enable_disk_cache:
            return
        
        cache_key = self._get_cache_key(query, cache_type)
        cache_path = self._get_cache_path(cache_key)
        
        try:
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
                logger.debug(f"Cached {cache_type}: {query}")
        except IOError as e:
            logger.warning(f"Failed to write cache file {cache_path}: {e}")
    
    def clear(self) -> int:
        """
        Clear all cache files.
        
        Returns:
            Number of files deleted
        """
        if not self.enable_disk_cache or not self.cache_dir.exists():
            return 0
        
        count = 0
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                cache_file.unlink()
                count += 1
            except IOError as e:
                logger.warning(f"Failed to delete cache file {cache_file}: {e}")
        
        logger.info(f"Cleared {count} cache files")
        return count
    
    def get_cache_status(self) -> Dict[str, Any]:
        """Get cache statistics."""
        if not self.enable_disk_cache or not self.cache_dir.exists():
            return {
                "enabled": False,
                "file_count": 0,
                "size_bytes": 0
            }
        
        cache_files = list(self.cache_dir.glob("*.json"))
        total_size = sum(f.stat().st_size for f in cache_files)
        
        return {
            "enabled": True,
            "file_count": len(cache_files),
            "size_bytes": total_size,
            "cache_dir": str(self.cache_dir)
        }
