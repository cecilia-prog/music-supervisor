# 11Labs Integration Guide for Music Supervisor

## Overview

This guide explains how to integrate the Music Supervisor backend with 11Labs Conversational AI.

## Architecture

```
User Voice Input
      ↓
11Labs Agent (Voice AI)
      ↓
Music Supervisor API (this backend)
      ↓
Music Catalog + MusicBrainz
      ↓
Response back to 11Labs
      ↓
User Voice Output
```

## Integration Options

### ✅ Option 1: Full 11Labs Agent (RECOMMENDED)

Use 11Labs Conversational AI to handle:
- Speech-to-text (STT)
- Natural language understanding
- Conversation context
- Text-to-speech (TTS)

**Your backend provides:**
- Music search & ranking
- MusicBrainz integration
- Data via webhook endpoints

**Setup Steps:**

1. **Create 11Labs Agent** at https://elevenlabs.io
   - Create a new Conversational AI agent
   - Give it a personality (e.g., "friendly music expert")
   - Set the voice you prefer

2. **Configure Agent Webhook**
   - Point webhook URL to: `https://your-domain.com/api/v1/elevenlabs/webhook`
   - For local testing with ngrok:
     ```bash
     ngrok http 8000
     # Then use: https://xxxxx.ngrok.io/api/v1/elevenlabs/webhook
     ```

3. **Agent System Prompt** (example):
   ```
   You are a knowledgeable music supervisor assistant helping users find music.
   
   You have access to a music catalog with 30 classic tracks from various genres.
   
   When users ask for music, you should:
   - Understand their intent (search, get info, find by mood)
   - Call the appropriate webhook endpoint
   - Present results in a conversational, friendly way
   
   Available actions:
   - search_music: Search catalog by any text query
   - get_track_info: Get details about a specific track
   - resolve_song: Identify a song and match to catalog
   - recommend_by_mood: Find tracks by mood (peaceful, energetic, etc.)
   
   Be conversational, enthusiastic about music, and helpful!
   ```

4. **Define Custom Functions** in 11Labs:
   
   Function 1: `search_music`
   ```json
   {
     "name": "search_music",
     "description": "Search the music catalog by artist, title, genre, mood, or tags",
     "parameters": {
       "query": {
         "type": "string",
         "description": "Search query"
       },
       "limit": {
         "type": "number",
         "description": "Max results",
         "default": 5
       }
     }
   }
   ```
   
   Function 2: `get_track_info`
   ```json
   {
     "name": "get_track_info",
     "description": "Get detailed information about a specific track",
     "parameters": {
       "track_title": {
         "type": "string",
         "description": "Title of the track"
       }
     }
   }
   ```
   
   Function 3: `recommend_by_mood`
   ```json
   {
     "name": "recommend_by_mood",
     "description": "Find tracks matching a specific mood",
     "parameters": {
       "mood": {
         "type": "string",
         "description": "Mood (peaceful, energetic, melancholic, etc.)"
       },
       "limit": {
         "type": "number",
         "default": 5
       }
     }
   }
   ```

### Option 2: 11Labs TTS/STT Only

Use 11Labs just for voice, handle conversation logic yourself.

**You would need:**
- Frontend with microphone input
- 11Labs SDK for speech processing
- Your own conversation flow logic
- Direct API calls to music backend

**Example using 11Labs SDK:**
```javascript
import { ElevenLabsClient } from "elevenlabs";

const client = new ElevenLabsClient({
  apiKey: "YOUR_API_KEY"
});

// Convert speech to text
const transcript = await client.speechToText(audioBlob);

// Search music
const response = await fetch('http://localhost:8000/api/v1/search', {
  method: 'POST',
  body: JSON.stringify({ query: transcript, limit: 5 })
});
const results = await response.json();

// Convert response to speech
const audio = await client.textToSpeech({
  text: `Found ${results.length} tracks...`,
  voice_id: "your-voice-id"
});
```

## Testing the Integration

### 1. Start Your Backend
```bash
cd music-supervisor
uvicorn app.main:app --reload
```

### 2. Expose Locally (for testing)
```bash
# Install ngrok if needed
brew install ngrok

# Expose your local server
ngrok http 8000

# Copy the https URL (e.g., https://abc123.ngrok.io)
```

### 3. Test Webhook Manually
```bash
# Test search intent
curl -X POST http://localhost:8000/api/v1/elevenlabs/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "search_music",
    "query": "peaceful songs",
    "limit": 3
  }'

# Test track info
curl -X POST http://localhost:8000/api/v1/elevenlabs/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "get_track_info",
    "track_title": "Imagine"
  }'

# Test mood search
curl -X POST http://localhost:8000/api/v1/elevenlabs/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "recommend_by_mood",
    "mood": "peaceful",
    "limit": 5
  }'
```

### 4. Test with Frontend
```bash
# Serve the frontend
cd frontend
python3 -m http.server 8080

# Open browser to http://localhost:8080
```

## Example Conversation Flows

### Conversation 1: Search by Genre
```
User: "Find me some rock songs"
Agent: Calls webhook with intent="search_music", query="rock"
Backend: Returns Bohemian Rhapsody, Stairway to Heaven, etc.
Agent: "I found 8 rock songs! The top match is Bohemian Rhapsody by Queen..."
```

### Conversation 2: Mood-based
```
User: "I need something peaceful"
Agent: Calls webhook with intent="recommend_by_mood", mood="peaceful"
Backend: Returns Imagine, Blackbird, Sound of Silence
Agent: "Here are some peaceful tracks: Imagine by John Lennon, Blackbird by The Beatles..."
```

### Conversation 3: Specific Track
```
User: "Tell me about Hotel California"
Agent: Calls webhook with intent="get_track_info", track_title="Hotel California"
Backend: Returns track details
Agent: "Hotel California by Eagles is from the album Hotel California, released in 1976..."
```

## Frontend Integration with Sandy Repo

If your Sandy repo already has 11Labs integration, you can:

1. **Copy the voice interface components** from Sandy
2. **Update the API endpoints** to point to this music supervisor backend
3. **Reuse the 11Labs SDK setup** from Sandy
4. **Adapt the UI** for music browsing instead of your previous use case

### Key files to look for in Sandy:
- Voice input/output handling
- 11Labs SDK initialization
- WebSocket connections (if used)
- Audio playback components
- Conversation UI components

## Production Deployment

### Environment Variables
Create `.env` file:
```env
# Application
APP_NAME=Music Metadata Aggregator
APP_VERSION=1.0.0

# MusicBrainz
MUSICBRAINZ_CONTACT=your.email@example.com

# 11Labs (if using their SDK)
ELEVENLABS_API_KEY=your_api_key_here

# CORS (update for production)
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Deploy Backend
```bash
# Option 1: Railway, Render, or Fly.io
# Option 2: Docker
# Option 3: Cloud provider (AWS, GCP, Azure)
```

### Update CORS in main.py
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-production-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Webhook Payload Reference

### Expected from 11Labs
```json
{
  "intent": "search_music | get_track_info | resolve_song | recommend_by_mood",
  "query": "string",
  "track_id": 123,
  "track_title": "string",
  "limit": 10,
  "mood": "string"
}
```

### Response to 11Labs
```json
{
  "response": "Natural language response for the agent to speak",
  "tracks": [
    {
      "id": 1,
      "title": "Song Title",
      "artist": "Artist Name",
      "score": 8.5
    }
  ],
  "track": { /* single track object */ },
  "error": "optional error message"
}
```

## Next Steps

1. **Review your Sandy repo** - Check what's already built
2. **Decide on integration approach** - Full agent vs TTS/STT only
3. **Set up 11Labs account** - Create agent with the prompts above
4. **Test webhook locally** - Use ngrok for testing
5. **Migrate frontend code** - Adapt Sandy's UI for music
6. **Deploy to production** - When ready for real users

## Need Help?

- Check 11Labs docs: https://elevenlabs.io/docs
- Test endpoints at: http://localhost:8000/docs
- Get config info: http://localhost:8000/api/v1/elevenlabs/config
