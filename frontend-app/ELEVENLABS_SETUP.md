# 11Labs Agent Setup Guide

## Step-by-Step Configuration

### 1. Create 11Labs Account
1. Go to https://elevenlabs.io
2. Sign up or log in
3. Navigate to Settings → API Keys
4. Generate a new API key
5. Copy it to `.env.local` as `VITE_ELEVENLABS_API_KEY`

### 2. Create Music Supervisor Agent

1. Go to https://elevenlabs.io/app/conversational-ai
2. Click "Create Agent"
3. Name it "Music Supervisor"
4. Choose a voice you like

### 3. Configure System Prompt

In the agent settings, set this system prompt:

```
You are a friendly and knowledgeable music supervisor assistant helping users discover music from a curated catalog of 30 classic tracks spanning multiple genres and decades.

When users ask for music, you should:
1. Understand their intent (search, get track info, find by mood, etc.)
2. Call the appropriate function with the right parameters
3. Present results in an engaging, conversational way
4. Share interesting details about tracks when relevant

Available functions:
- search_music: Search catalog by any text (artist, title, genre, mood, tags)
- get_track_info: Get detailed information about a specific track
- recommend_by_mood: Find tracks matching a specific mood

Be enthusiastic about music, conversational, and helpful in discovering great songs!
```

### 4. Add Custom Functions

#### Function 1: search_music

**Function Name:** `search_music`

**Description:** 
```
Search the music catalog by artist, title, genre, mood, or tags. Returns ranked results based on relevance.
```

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "The search query (can be artist name, song title, genre, mood, era, or any combination)"
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of results to return (default: 5, max: 20)",
      "default": 5
    }
  },
  "required": ["query"]
}
```

**Webhook Configuration:**
- URL: `http://your-backend-url/api/v1/elevenlabs/webhook`
- Method: `POST`
- Body Template:
```json
{
  "intent": "search_music",
  "query": "{{query}}",
  "limit": {{limit}}
}
```

---

#### Function 2: get_track_info

**Function Name:** `get_track_info`

**Description:**
```
Get detailed information about a specific track including artist, album, duration, genre, mood, tags, and year.
```

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "track_title": {
      "type": "string",
      "description": "The title of the track to look up"
    }
  },
  "required": ["track_title"]
}
```

**Webhook Configuration:**
- URL: `http://your-backend-url/api/v1/elevenlabs/webhook`
- Method: `POST`
- Body Template:
```json
{
  "intent": "get_track_info",
  "track_title": "{{track_title}}"
}
```

---

#### Function 3: recommend_by_mood

**Function Name:** `recommend_by_mood`

**Description:**
```
Find tracks matching a specific mood. Available moods: peaceful, energetic, melancholic, epic, rebellious, dark, groovy, emotional, empowering, uplifting, motivational, nostalgic, dreamy, hopeful, comforting, sorrowful, contemplative, thoughtful.
```

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "mood": {
      "type": "string",
      "description": "The desired mood (e.g., peaceful, energetic, melancholic)"
    },
    "limit": {
      "type": "number",
      "description": "Maximum number of results to return (default: 5)",
      "default": 5
    }
  },
  "required": ["mood"]
}
```

**Webhook Configuration:**
- URL: `http://your-backend-url/api/v1/elevenlabs/webhook`
- Method: `POST`
- Body Template:
```json
{
  "intent": "recommend_by_mood",
  "mood": "{{mood}}",
  "limit": {{limit}}
}
```

---

### 5. Testing Webhooks Locally

For local development, you need to expose your local backend:

```bash
# Install ngrok
brew install ngrok

# Expose port 8000
ngrok http 8000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Use this as your webhook URL: https://abc123.ngrok.io/api/v1/elevenlabs/webhook
```

### 6. Test Your Agent

1. Copy your Agent ID from the 11Labs dashboard
2. Add it to `.env.local` as `VITE_ELEVENLABS_AGENT_ID`
3. Start your backend and frontend
4. Connect to the agent in the UI
5. Try saying: "Find me some peaceful songs"

### Example Conversation Flows

**Search by Genre:**
```
User: "Find me some rock songs"
Agent: [Calls search_music with query="rock"]
Backend: Returns rock tracks
Agent: "I found 8 rock tracks! The top matches are Bohemian Rhapsody by Queen..."
```

**Track Information:**
```
User: "Tell me about Imagine by John Lennon"
Agent: [Calls get_track_info with track_title="Imagine"]
Backend: Returns track details
Agent: "Imagine by John Lennon is from the album Imagine, released in 1971..."
```

**Mood-Based:**
```
User: "I need something peaceful"
Agent: [Calls recommend_by_mood with mood="peaceful"]
Backend: Returns peaceful tracks
Agent: "Here are some peaceful tracks: Imagine by John Lennon, Blackbird by The Beatles..."
```

### Troubleshooting

**Webhook Not Receiving Requests:**
- Check ngrok is running
- Verify webhook URL is correct
- Check backend logs for errors

**Agent Not Responding:**
- Verify API key is correct
- Check agent ID matches
- Look at browser console for errors

**Functions Not Being Called:**
- Ensure function parameters are correct
- Check system prompt guides the agent to use functions
- Review agent logs in 11Labs dashboard

**CORS Errors:**
- Backend has CORS enabled by default
- Check `allow_origins` in `app/main.py` if issues persist

### Production Deployment

For production:
1. Deploy your backend to a public URL (Railway, Render, Fly.io)
2. Update webhook URLs in 11Labs to use production URL
3. Update `VITE_MUSIC_API_URL` in your frontend env
4. Deploy frontend to Vercel/Netlify

### Additional Resources

- 11Labs Docs: https://elevenlabs.io/docs
- Conversational AI Guide: https://elevenlabs.io/docs/conversational-ai
- Webhook Documentation: https://elevenlabs.io/docs/conversational-ai/webhooks
