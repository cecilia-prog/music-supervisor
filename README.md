# Music Supervisor 🎵

An AI-powered music discovery system with voice interface. Search and discover music through conversation using 11Labs AI, backed by a FastAPI service with intelligent search and MusicBrainz integration.

## 🌟 Features

### Backend (FastAPI)
- **Music Catalog Management**: 30 curated classic tracks with rich metadata
- **Intelligent Search**: Smart ranking based on title, artist, tags, moods, and genres
- **MusicBrainz Integration**: Resolve song names to canonical IDs
- **11Labs Voice AI**: Webhook endpoints for conversational music discovery
- **RESTful API**: Clean, documented API with auto-generated Swagger UI
- **CORS Enabled**: Ready for frontend integration

### Frontend (React + 11Labs)
- **Voice Search**: Natural language music discovery through conversation
- **Beautiful UI**: Modern React interface with Tailwind CSS
- **Real-time Results**: Live track cards with detailed metadata
- **Audio Visualization**: Real-time microphone activity meters
- **Conversation Mode**: Immersive voice-first experience
- **Chat Mode**: Text-based search with voice option

## 📁 Project Structure

```
music-supervisor/
├── app/                           # Backend API
│   ├── main.py                   # FastAPI app + 11Labs webhook endpoints
│   ├── elevenlabs.py             # 🆕 11Labs webhook handler
│   ├── catalog.py                # Music catalog management
│   ├── search.py                 # Intelligent search & ranking
│   ├── musicbrainz.py            # MusicBrainz API integration
│   ├── models.py                 # Pydantic data models
│   └── config.py                 # Configuration
├── frontend-app/                 # 🆕 Voice UI (React + 11Labs)
│   ├── src/
│   │   ├── components/
│   │   │   ├── music/           # Music-specific components
│   │   │   │   ├── TrackCard.jsx
│   │   │   │   ├── MusicResults.jsx
│   │   │   │   └── musicHelpers.js
│   │   │   ├── brand/           # Branding components
│   │   │   └── ChatBox.jsx      # Main conversation UI
│   │   └── lib/
│   │       ├── agent/           # 11Labs integration
│   │       ├── audio/           # Audio handling
│   │       └── musicApi.js      # Music API client
│   ├── .env.local               # ⚠️ YOU CREATE: 11Labs credentials
│   ├── ELEVENLABS_SETUP.md      # 11Labs configuration guide
│   └── README.md                # Frontend documentation
├── data/
│   └── music_catalog.csv        # 30 classic tracks
├── frontend/                     # Simple HTML demo (backup)
├── requirements.txt              # Python dependencies
├── SETUP_COMPLETE.md            # 🆕 Quick start guide
├── ELEVENLABS_INTEGRATION.md    # 🆕 Integration details
├── SANDY_MIGRATION_PLAN.md      # 🆕 Migration documentation
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

**Backend:**
- Python 3.8+
- pip

**Frontend:**
- Node.js 20+
- pnpm
- 11Labs account (https://elevenlabs.io)

### 1. Backend Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload
```

Backend runs at: `http://localhost:8000`  
API docs at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend-app

# Install dependencies
pnpm install

# Create .env.local with your credentials
# See ELEVENLABS_SETUP.md for configuration details
cat > .env.local << EOF
VITE_MUSIC_API_URL=http://localhost:8000
VITE_ELEVENLABS_API_KEY=your_api_key_here
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
EOF

# Start the dev server
pnpm dev
```

Frontend runs at: `http://localhost:5173`

### 3. Configure 11Labs Agent

Follow the guide in `frontend-app/ELEVENLABS_SETUP.md` to:
1. Create an 11Labs account
2. Set up a conversational AI agent
3. Configure 3 custom functions (search_music, get_track_info, recommend_by_mood)
4. Add webhook URL (requires ngrok for local testing)

## 📡 API Endpoints

### Music Catalog

## 📡 API Endpoints

### Music Catalog

**GET** `/api/v1/tracks` - Get all tracks  
**GET** `/api/v1/tracks/{id}` - Get track by ID  
**POST** `/api/v1/search` - Search tracks with ranking  
**POST** `/api/v1/resolve` - Resolve song name to MusicBrainz ID

### 11Labs Integration (🆕)

**POST** `/api/v1/elevenlabs/webhook` - Webhook for agent callbacks  
**GET** `/api/v1/elevenlabs/config` - Webhook configuration info

### Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🧠 How It Works

### Voice Interaction Flow

```
1. User speaks → 11Labs Agent processes speech
2. Agent determines intent (search, track info, mood recommendation)
3. Agent calls custom function → Webhook to backend
4. Backend processes request → Returns music data
5. Agent speaks response → Frontend displays TrackCards
6. User sees results + hears AI explanation
```

### 11Labs Custom Functions

**search_music**: Find tracks by artist, title, genre, tags  
**get_track_info**: Get detailed info about a specific track  
**recommend_by_mood**: Find tracks matching a mood (energetic, chill, etc.)

## 🎨 Music Components

### TrackCard
Displays individual track with:
- Title, Artist, Album
- Duration, Year
- Genre badge with emoji
- Mood badge with emoji  
- Tags
- Relevance score (search results)

### MusicResults
List view with:
- Search query display
- Result count
- Grid of TrackCards

### musicHelpers
Utilities for:
- `formatDuration()` - Convert seconds to MM:SS
- `getMoodEmoji()` - Map moods to emojis
- `getGenreEmoji()` - Map genres to emojis

## 📚 Documentation

- **SETUP_COMPLETE.md** - Complete setup checklist
- **ELEVENLABS_INTEGRATION.md** - Technical integration details
- **frontend-app/ELEVENLABS_SETUP.md** - Step-by-step 11Labs config
- **SANDY_MIGRATION_PLAN.md** - Migration documentation

## 🔧 Development

### Backend Testing

```bash
# Run health check
curl http://localhost:8000/

# Search for rock tracks
curl -X POST http://localhost:8000/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "rock", "limit": 5}'

# Resolve a song name
curl -X POST http://localhost:8000/api/v1/resolve \
  -H "Content-Type: application/json" \
  -d '{"query": "Bohemian Rhapsody Queen"}'
```

### Frontend Development

```bash
cd frontend-app

# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Local Testing with ngrok

For webhook testing with 11Labs:

```bash
# Expose backend to internet
ngrok http 8000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Add to 11Labs agent webhook URL: https://abc123.ngrok.io/api/v1/elevenlabs/webhook
```

## 📊 Music Catalog

30 classic tracks including:
- Rock: Queen, Led Zeppelin, The Beatles
- Pop: Michael Jackson, Madonna
- Electronic: Daft Punk, Kraftwerk
- Hip-Hop: Public Enemy, Dr. Dre
- Classical: Bach, Mozart, Beethoven
- Jazz: Miles Davis, John Coltrane
- And more...

Each track includes:
- Title, Artist, Album
- Duration, Year
- Genre, Mood
- Searchable tags

## 🛠️ Tech Stack

### Backend
- **FastAPI** 0.109.1 - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **musicbrainzngs** - MusicBrainz API client
- **python-dotenv** - Environment management

### Frontend
- **React** 19 - UI library
- **Vite** 7 - Build tool
- **Tailwind CSS** 4 - Styling
- **Radix UI** - Accessible components
- **@elevenlabs/elevenlabs-js** 2.18.0 - Voice AI SDK
- **pnpm** - Package manager

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.8+)
- Ensure all dependencies installed: `pip install -r requirements.txt`
- Check port 8000 is available: `lsof -i :8000`

### Frontend won't start
- Check Node version: `node --version` (need 20+)
- Install pnpm: `npm install -g pnpm`
- Delete `node_modules` and reinstall: `rm -rf node_modules && pnpm install`

### 11Labs not working
- Verify API key in `.env.local`
- Check agent ID is correct
- Confirm webhook URL is accessible (use ngrok for local)
- Review `frontend-app/ELEVENLABS_SETUP.md`

### No music results showing
- Ensure backend is running on port 8000
- Check `VITE_MUSIC_API_URL` in `.env.local`
- Open browser console for errors
- Verify CORS is enabled in backend

## 🚦 Current Status

✅ **Completed:**
- FastAPI backend with music catalog
- Intelligent search & ranking
- MusicBrainz integration
- 11Labs webhook handler
- React frontend with voice UI
- Music components (TrackCard, MusicResults)
- Full documentation

⏳ **Requires User Setup:**
- Create 11Labs account
- Get API key & Agent ID
- Configure custom functions in 11Labs
- Create `.env.local` with credentials
- Install frontend dependencies (`pnpm install`)
- Expose backend with ngrok for testing

## 📝 License

MIT

## 👤 Author

Cecilia Conde

---

**Need Help?** Check the detailed guides:
- Quick Start: `SETUP_COMPLETE.md`
- 11Labs Setup: `frontend-app/ELEVENLABS_SETUP.md`
- Integration Details: `ELEVENLABS_INTEGRATION.md`

---

**Need Help?** Check the detailed guides:
- Quick Start: `SETUP_COMPLETE.md`
- 11Labs Setup: `frontend-app/ELEVENLABS_SETUP.md`
- Integration Details: `ELEVENLABS_INTEGRATION.md`
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