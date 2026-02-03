# Quick Reference: Refactored Music Supervisor API

## 🚀 Start Server

```bash
uvicorn app.main:app --reload
```

## 🔍 Core Endpoints

### Search (with filters)
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "rock",
    "limit": 5,
    "moods": ["Epic"],
    "min_energy": 0.7
  }'
```

### Get Track
```bash
curl http://localhost:8000/api/v1/tracks/track_0001
# or
curl http://localhost:8000/api/v1/tracks/1
```

### Resolve Query
```bash
curl -X POST http://localhost:8000/api/v1/resolve \
  -H "Content-Type: application/json" \
  -d '{"query": "Bohemian Rhapsody Queen"}'
```

## 🤖 Agent Endpoints (with optional auth)

```bash
# Set API key
export API_KEY="your-secret-key"

# Search
curl -X POST http://localhost:8000/agent/search_music \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"query": "rock", "limit": 5}'

# Get track
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:8000/agent/track/track_0001
```

## 🛠️ Dev Endpoints (require ENABLE_DEV_ENDPOINTS=true)

```bash
# Reload catalog
curl -X POST http://localhost:8000/catalog/reload

# Clear cache
curl -X POST http://localhost:8000/cache/clear
```

## 🏥 Health Check

```bash
curl http://localhost:8000/health
```

## 🧪 Run Tests

```bash
pytest tests/ -v
```

## ⚙️ Environment Variables (.env)

```bash
# Feature flags
ENABLE_DEV_ENDPOINTS=false
ENABLE_ELEVENLABS=true
MUSICBRAINZ_ENABLED=true

# Security
API_KEY=your-secret-key

# CORS
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Logging
LOG_LEVEL=INFO
```

## 📊 Search Filters

Available filters in `SearchRequest`:

- `query` (string) - Search text
- `limit` (int) - Max results (1-100)
- `moods` (array) - Filter by moods
- `genres` (array) - Filter by genres  
- `tags` (array) - Filter by tags
- `min_energy` (float 0-1) - Min energy level
- `max_energy` (float 0-1) - Max energy level
- `min_valence` (float 0-1) - Min positivity
- `max_valence` (float 0-1) - Max positivity
- `stems_required` (bool) - Require stems
- `clearance_required` (bool) - Require cleared status
- `use_case` (string) - Context (e.g., "film")

## 📁 Project Structure

```
music-supervisor/
├── app/
│   ├── main.py           # FastAPI app + endpoints
│   ├── config.py         # Settings
│   ├── models.py         # Pydantic models
│   ├── catalog.py        # Catalog loader
│   ├── search.py         # Search + ranking
│   ├── musicbrainz.py    # MusicBrainz + cache
│   ├── resolver.py       # Resolution pipeline
│   ├── cache.py          # Cache layer
│   ├── agent.py          # Agent endpoints
│   └── elevenlabs.py     # 11Labs webhook handler
├── tests/
│   ├── test_catalog.py   # Catalog tests
│   ├── test_search.py    # Search tests
│   └── test_resolver.py  # Resolver tests
├── data/
│   ├── music_catalog.csv # Track data
│   └── cache/            # MusicBrainz cache
├── .env.example          # Environment template
└── requirements.txt      # Dependencies
```

## 🎯 Key Improvements

✅ Typed configuration with pydantic-settings  
✅ `buffet_track_id` canonical IDs  
✅ Advanced search filters (mood, genre, energy, etc.)  
✅ Structured resolver (internal → MusicBrainz)  
✅ MusicBrainz caching + rate limiting  
✅ `/agent/*` endpoints for Custom GPT  
✅ API key authentication  
✅ Feature flags for dev/11Labs  
✅ Comprehensive test suite  
✅ Dev endpoints (reload, cache clear)  

## 📚 Documentation

- `REFACTORING_COMPLETE.md` - Full implementation details
- `MIGRATION_GUIDE.md` - Upgrade guide
- `SETUP_COMPLETE.md` - Original setup guide
- `.env.example` - Configuration options

## 🔗 URLs

- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health
- OpenAPI JSON: http://localhost:8000/openapi.json
