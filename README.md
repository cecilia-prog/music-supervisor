# Music Metadata Aggregator

A FastAPI-based Music Metadata Aggregator service for an AI Music Supervisor. This backend service manages an internal music catalog and integrates with the MusicBrainz API to provide comprehensive music metadata and search capabilities.

## Features

- **Internal Music Catalog**: Load and manage a music catalog from CSV file
- **Search Tracks**: Search tracks with intelligent ranking based on title, artist, tags, moods, and genres
- **Fetch by ID**: Retrieve specific tracks by their internal catalog ID
- **Query Resolution**: Resolve free-text queries to canonical IDs using the MusicBrainz API
- **RESTful API**: Clean, well-documented REST API built with FastAPI
- **Auto-generated Documentation**: Interactive API documentation via Swagger UI

## Project Structure

```
music-supervisor/
├── app/
│   ├── __init__.py          # Package initialization
│   ├── main.py              # FastAPI application and endpoints
│   ├── models.py            # Pydantic data models
│   ├── catalog.py           # Music catalog management
│   ├── search.py            # Search and ranking logic
│   ├── musicbrainz.py       # MusicBrainz API integration
│   └── config.py            # Application configuration
├── data/
│   └── music_catalog.csv    # Internal music catalog (30 classic tracks)
├── requirements.txt         # Python dependencies
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/cecilia-prog/music-supervisor.git
   cd music-supervisor
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Service

### Start the Server

Run the FastAPI application using uvicorn:

```bash
uvicorn app.main:app --reload
```

The service will start on `http://localhost:8000`

### Access API Documentation

Once the server is running, you can access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## API Endpoints

### 1. Root Endpoint

Get API information and available endpoints.

**Request**:
```bash
curl http://localhost:8000/
```

**Response**:
```json
{
  "name": "Music Metadata Aggregator",
  "version": "1.0.0",
  "description": "AI Music Supervisor - Music Metadata Aggregator API",
  "endpoints": {
    "search": "/api/v1/search",
    "track_by_id": "/api/v1/tracks/{track_id}",
    "resolve": "/api/v1/resolve",
    "all_tracks": "/api/v1/tracks"
  }
}
```

### 2. Get All Tracks

Retrieve all tracks in the catalog.

**Request**:
```bash
curl http://localhost:8000/api/v1/tracks
```

**Response**: Array of track objects

### 3. Get Track by ID

Fetch a specific track by its internal ID.

**Request**:
```bash
curl http://localhost:8000/api/v1/tracks/1
```

**Response**:
```json
{
  "id": 1,
  "title": "Bohemian Rhapsody",
  "artist": "Queen",
  "album": "A Night at the Opera",
  "duration": 354,
  "genre": "Rock",
  "mood": "Epic",
  "tags": "rock,classic,opera",
  "year": 1975
}
```

### 4. Search Tracks

Search tracks with ranking based on multiple fields.

**Request**:
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "rock",
    "limit": 5
  }'
```

**Response**:
```json
[
  {
    "track": {
      "id": 1,
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "album": "A Night at the Opera",
      "duration": 354,
      "genre": "Rock",
      "mood": "Epic",
      "tags": "rock,classic,opera",
      "year": 1975
    },
    "score": 5.5
  },
  ...
]
```

**More Search Examples**:

Search by artist:
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Beatles", "limit": 10}'
```

Search by mood:
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "peaceful", "limit": 5}'
```

Search by tag:
```bash
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "80s", "limit": 10}'
```

### 5. Resolve Query

Resolve free-text queries to canonical IDs using MusicBrainz API.

**Request**:
```bash
curl -X POST http://localhost:8000/api/v1/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Imagine by John Lennon"
  }'
```

**Response**:
```json
{
  "query": "Imagine by John Lennon",
  "canonical_id": 5,
  "musicbrainz_id": "6b9f0a60-cb5b-4d26-949e-9d5a5e130b53",
  "matched_track": {
    "id": 5,
    "title": "Imagine",
    "artist": "John Lennon",
    "album": "Imagine",
    "duration": 183,
    "genre": "Pop",
    "mood": "Peaceful",
    "tags": "pop,piano,inspirational",
    "year": 1971
  },
  "confidence": 0.95
}
```

### 6. Health Check

Check service health and status.

**Request**:
```bash
curl http://localhost:8000/health
```

**Response**:
```json
{
  "status": "healthy",
  "catalog_loaded": true,
  "tracks_count": 30
}
```

## Search Ranking Algorithm

The search functionality uses a weighted scoring system:

- **Exact title match**: +10.0
- **Exact artist match**: +8.0
- **Partial title match**: +3.0
- **Partial artist match**: +2.5
- **Tag matches**: +2.0 per tag
- **Mood match**: +1.5
- **Genre match**: +1.5
- **Album match**: +1.0
- **Year match**: +1.0

Results are sorted by score in descending order and limited to the requested number of results.

## Music Catalog

The service includes a sample catalog of 30 classic tracks in `data/music_catalog.csv`:

- Diverse genres: Rock, Pop, Soul, Funk, Reggae, Hip Hop, Folk, Country, and more
- Rich metadata: title, artist, album, duration, genre, mood, tags, year
- Classic tracks from 1960s to 2000s

### Adding Your Own Tracks

To add more tracks, edit `data/music_catalog.csv` following this format:

```csv
id,title,artist,album,duration,genre,mood,tags,year
31,Your Song,Artist Name,Album Name,240,Genre,Mood,"tag1,tag2,tag3",2024
```

## MusicBrainz Integration

The `/resolve` endpoint integrates with the [MusicBrainz](https://musicbrainz.org/) API to:

1. Search for recordings using free-text queries
2. Return MusicBrainz recording IDs
3. Match results to the internal catalog when possible
4. Provide confidence scores for matches

The service is configured to respect MusicBrainz API rate limits (1 request per second).

## Configuration

You can configure the application by creating a `.env` file in the project root:

```env
# Application settings
APP_NAME=Music Metadata Aggregator
APP_VERSION=1.0.0

# Catalog settings
CATALOG_PATH=data/music_catalog.csv

# MusicBrainz settings
MUSICBRAINZ_APP_NAME=MusicSupervisor
MUSICBRAINZ_VERSION=1.0
MUSICBRAINZ_CONTACT=your.email@example.com
```

## Development

### Running in Development Mode

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag enables auto-reload on code changes.

### Testing the API

You can test the API using:

1. **Swagger UI**: http://localhost:8000/docs (interactive testing)
2. **curl**: Command-line HTTP requests (examples above)
3. **Postman**: Import the OpenAPI spec from http://localhost:8000/openapi.json
4. **Python requests**:

```python
import requests

# Search for tracks
response = requests.post(
    "http://localhost:8000/api/v1/search",
    json={"query": "Beatles", "limit": 5}
)
print(response.json())

# Get track by ID
response = requests.get("http://localhost:8000/api/v1/tracks/1")
print(response.json())

# Resolve query
response = requests.post(
    "http://localhost:8000/api/v1/resolve",
    json={"query": "Hotel California Eagles"}
)
print(response.json())
```

## Dependencies

- **FastAPI**: Modern, fast web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI
- **Pydantic**: Data validation using Python type annotations
- **musicbrainzngs**: Python bindings for the MusicBrainz API

See `requirements.txt` for complete dependency list.

## License

This project is provided as-is for educational and development purposes.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For issues or questions, please open an issue on GitHub.