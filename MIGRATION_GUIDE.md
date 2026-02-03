# Migration Guide: Updating to Refactored Backend

## 🔄 For Existing Users

If you're upgrading from the previous version, here's what changed and how to adapt.

## Breaking Changes

### 1. Track ID Format

**Before:**
```python
track.id  # Integer: 1, 2, 3...
```

**After:**
```python
track.buffet_track_id  # String: "track_0001", "track_0002"...
track.id  # Still exists for backwards compatibility
```

**Migration:**
- ✅ **No action required** - endpoints support both formats
- ✅ Legacy numeric IDs still work: `GET /api/v1/tracks/1`
- ✅ New string IDs also work: `GET /api/v1/tracks/track_0001`
- Frontend can continue using numeric IDs

### 2. Search API Signature

**Before:**
```python
SearchRanker.search_tracks(tracks, query, limit)
```

**After:**
```python
SearchRanker.search_tracks(tracks, request)  # request is SearchRequest
```

**Migration:**
- If calling search directly in code:
  ```python
  # Old
  results = SearchRanker.search_tracks(tracks, "rock", 10)
  
  # New
  request = SearchRequest(query="rock", limit=10)
  results = SearchRanker.search_tracks(tracks, request)
  ```
- ✅ REST API unchanged: Still `POST /api/v1/search` with same JSON body
- Just accepts additional optional filter fields now

### 3. Resolve Response Structure

**Before:**
```json
{
  "query": "...",
  "canonical_id": 123,
  "musicbrainz_id": "...",
  "matched_track": {...},
  "confidence": 0.8
}
```

**After:**
```json
{
  "query": "...",
  "best_match": {...},
  "candidates": [],
  "confidence": 0.8,
  "source": "internal",
  "canonical_id": "track_0123",  // Legacy field
  "musicbrainz_id": "...",        // Legacy field
  "matched_track": {...}           // Legacy field (same as best_match)
}
```

**Migration:**
- ✅ **No action required** - legacy fields still populated
- Can upgrade to use `best_match` and `candidates` when ready

## New Features (No Breaking Changes)

### 1. Environment Configuration

Create `.env` file (optional):
```bash
cp .env.example .env
# Edit as needed - all optional!
```

Default values work fine without `.env`.

### 2. Advanced Search Filters

Now supports:
```json
{
  "query": "music",
  "limit": 10,
  "moods": ["Peaceful"],
  "genres": ["Pop"],
  "tags": ["classic"],
  "min_energy": 0.5,
  "max_energy": 0.8,
  "stems_required": true,
  "clearance_required": true
}
```

All filters are optional - old queries still work.

### 3. New Agent Endpoints

For Custom GPT/Actions integration:
- `POST /agent/search_music`
- `GET /agent/track/{buffet_track_id}`
- `POST /agent/resolve`

Optional API key auth via `API_KEY` env var.

### 4. Development Endpoints

When `ENABLE_DEV_ENDPOINTS=true`:
- `POST /catalog/reload` - Reload CSV without restart
- `POST /cache/clear` - Clear MusicBrainz cache

### 5. Feature Flags

Control features via environment:
- `ENABLE_DEV_ENDPOINTS` - Dev endpoints (default: false)
- `ENABLE_ELEVENLABS` - 11Labs integration (default: true)
- `MUSICBRAINZ_ENABLED` - MusicBrainz API (default: true)

## CSV Format Changes

### Optional New Columns

Your existing CSV works as-is. Optionally add:

```csv
id,title,artist,album,duration,genre,mood,tags,year,mbid,isrc,spotify_id,stems_available,clearance_status,energy,valence
1,Bohemian Rhapsody,Queen,...,1975,abc123,USRC12345,spotify123,true,cleared,0.8,0.6
```

**New optional columns:**
- `buffet_track_id` - Custom string ID (auto-generated from `id` if missing)
- `mbid` - MusicBrainz ID
- `isrc` - International Standard Recording Code
- `spotify_id` - Spotify track ID
- `stems_available` - true/false
- `clearance_status` - cleared, pending, restricted, unknown
- `energy` - 0.0 to 1.0
- `valence` - 0.0 to 1.0

Missing columns are fine - they default to null/false.

## Dependency Changes

### New Dependencies

```bash
# If not already installed
pip install pytest pytest-asyncio httpx
```

No version changes to existing dependencies (except python-multipart: 0.0.22 → 0.0.20 for compatibility).

## Testing Your Upgrade

### 1. Start the server

```bash
uvicorn app.main:app --reload
```

Should start without errors.

### 2. Test health endpoint

```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "catalog_loaded": true,
  "tracks_count": 30,
  ...
}
```

### 3. Test search (backwards compatible)

```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "rock", "limit": 5}'
```

Should return results as before.

### 4. Test new filters

```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "music", "limit": 5, "moods": ["Peaceful"]}'
```

Should return only peaceful tracks.

### 5. Run tests

```bash
pytest tests/ -v
```

All tests should pass.

## Frontend Updates (Optional)

### If you want to use new features:

1. **Use new filter fields in search:**
   ```javascript
   const response = await fetch('/api/v1/search', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       query: 'rock',
       limit: 10,
       moods: ['Epic'],
       min_energy: 0.7
     })
   });
   ```

2. **Use buffet_track_id for display:**
   ```javascript
   track.buffet_track_id  // "track_0001"
   ```

3. **Handle new resolve structure:**
   ```javascript
   const result = await resolve(query);
   const bestMatch = result.best_match;
   const alternatives = result.candidates;
   const confidence = result.confidence;
   ```

## Rollback Plan

If needed, previous version can be restored:

```bash
# Checkout previous commit
git checkout HEAD~1

# Or keep new code but use old endpoint behavior
# (All old endpoints still work the same way)
```

## Common Issues

### Import errors

```bash
pip install -r requirements.txt
```

### Catalog won't load

Check CSV format - must have at least: `id,title,artist,album,duration,genre,mood,tags,year`

### Tests fail

Normal if pytest not installed:
```bash
pip install pytest pytest-asyncio httpx
```

## Questions?

See `REFACTORING_COMPLETE.md` for full documentation.
