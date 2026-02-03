# Sandy → Music Supervisor Migration Plan

## 🎯 Overview

**Sandy** is a React + Vite + Tailwind CSS application with full 11Labs Conversational AI integration.
**What to migrate:** UI components, design system, and 11Labs SDK setup → Adapt for music browsing

## 📊 Sandy Stack Analysis

### Current Tech Stack:
- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS 4 + Radix UI components
- **Voice AI:** @elevenlabs/elevenlabs-js SDK
- **State Management:** React Context API
- **Icons:** Lucide React
- **Notifications:** Sonner (toast library)
- **Build:** Vite with pnpm

### Key Components Found:

#### 1. **11Labs Integration** (lib/agent/)
- `Agent.js` - WebSocket connection to 11Labs
- `AgentConnInitOptions.js` - Configuration
- `agentMessages.js` - Message handling
- `Conversation.js` - Conversation state management

#### 2. **Audio Handling** (lib/audio/)
- `Mic.js` - Microphone input
- `Meter.js` - Audio level visualization
- `AudioRecorder.js` - Recording functionality

#### 3. **UI Components**
- `ChatBox.jsx` - Main conversation interface
- `SimpleAgentConnect.jsx` - Voice/agent selector
- `VoiceSelector.jsx` - Voice selection UI
- `AgentOptionsPopover.jsx` - Settings panel
- Various Radix UI components (button, select, tooltip, etc.)

#### 4. **Custom Contexts**
- `AgentContext.jsx` - Manages 11Labs agent state
- `AgentMicContext.jsx` - Manages microphone state

## 🔄 Migration Strategy

### ✅ Option 1: Keep Sandy as Frontend + Adapt for Music (RECOMMENDED)

**Why this works:**
- Sandy already has ALL the 11Labs integration working
- Beautiful UI with Tailwind + Radix components
- Just need to adapt the conversation display for music results

**What to do:**

1. **Keep Sandy's entire frontend structure**
2. **Add music-specific components** for displaying tracks
3. **Configure agent webhook** to point to music-supervisor backend
4. **Adapt ChatBox** to show music cards instead of generic bubbles

### Migration Steps:

#### Step 1: Create Music-Specific Components in Sandy

```jsx
// sandy/src/components/music/TrackCard.jsx
export function TrackCard({ track, score }) {
  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900">{track.title}</h3>
          <p className="text-blue-600 text-sm mt-1">by {track.artist}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
            <span>📀 {track.album}</span>
            <span>•</span>
            <span>{track.year}</span>
            <span>•</span>
            <span>{formatDuration(track.duration)}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {track.genre}
            </span>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
              {track.mood}
            </span>
          </div>
          {track.tags && (
            <div className="flex flex-wrap gap-1 mt-2">
              {track.tags.split(',').map((tag, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
        {score && (
          <div className="ml-4 text-right">
            <div className="text-2xl font-bold text-blue-600">{score.toFixed(1)}</div>
            <div className="text-xs text-gray-500">relevance</div>
          </div>
        )}
      </div>
    </div>
  );
}
```

```jsx
// sandy/src/components/music/MusicResults.jsx
import { TrackCard } from './TrackCard';

export function MusicResults({ tracks }) {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No tracks found. Try a different search!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-blue-900 mb-4">
        Found {tracks.length} track{tracks.length !== 1 ? 's' : ''}
      </h2>
      {tracks.map((item, i) => (
        <TrackCard 
          key={item.track?.id || i} 
          track={item.track} 
          score={item.score} 
        />
      ))}
    </div>
  );
}
```

#### Step 2: Modify ChatBox to Handle Music

```jsx
// In sandy/src/components/ChatBox.jsx

import { MusicResults } from './music/MusicResults';

// Add state for music results
const [musicResults, setMusicResults] = useState(null);

// Modify the useEffect that handles agentResponse to detect music data
useEffect(() => {
  if (!agentResponse) return;
  const msg = agentResponse.message;

  // Check if response contains music tracks
  if (msg?.rawMessage?.tracks) {
    setMusicResults(msg.rawMessage.tracks);
  }

  // Display agent responses
  if (msg?.type === "agent_response" && msg?.rawMessage?.agent_response) {
    const text = String(msg.rawMessage.agent_response);
    setLog((prev) => [...prev, { who: "agent", text }]);
  }

  // Display user transcripts
  if (msg?.type === "user_transcript" && msg?.rawMessage?.user_transcript) {
    const text = String(msg.rawMessage.user_transcript);
    setLog((prev) => [...prev, { who: "you", text }]);
  }
}, [agentResponse]);

// In the render, after the bubbles:
<div>
  {log.map((m, i) => <Bubble key={i} who={m.who} text={m.text} />)}
  
  {/* Show music results if available */}
  {musicResults && <MusicResults tracks={musicResults} />}
</div>
```

#### Step 3: Configure 11Labs Agent

**In your 11Labs dashboard:**

1. **Create new agent** called "Music Supervisor"

2. **System Prompt:**
```
You are a friendly and knowledgeable music supervisor assistant. 
You help users discover and learn about music from a curated catalog 
of 30 classic tracks spanning multiple genres and decades.

When users ask for music, you should:
- Understand their intent (search, get info, mood-based, etc.)
- Make intelligent queries to the music API
- Present results in an engaging, conversational way
- Share interesting details about the tracks

Be enthusiastic about music and help users discover great songs!
```

3. **Add Custom Function: search_music**
```json
{
  "name": "search_music",
  "description": "Search the music catalog by any text query including artist, title, genre, mood, or tags",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query"
      },
      "limit": {
        "type": "number",
        "description": "Maximum number of results to return",
        "default": 5
      }
    },
    "required": ["query"]
  },
  "webhook_url": "https://your-domain.com/api/v1/elevenlabs/webhook",
  "webhook_method": "POST",
  "webhook_body": {
    "intent": "search_music",
    "query": "{{query}}",
    "limit": "{{limit}}"
  }
}
```

4. **Add Custom Function: get_track_info**
```json
{
  "name": "get_track_info",
  "description": "Get detailed information about a specific track",
  "parameters": {
    "type": "object",
    "properties": {
      "track_title": {
        "type": "string",
        "description": "Title of the track"
      }
    },
    "required": ["track_title"]
  },
  "webhook_url": "https://your-domain.com/api/v1/elevenlabs/webhook",
  "webhook_method": "POST",
  "webhook_body": {
    "intent": "get_track_info",
    "track_title": "{{track_title}}"
  }
}
```

5. **Add Custom Function: recommend_by_mood**
```json
{
  "name": "recommend_by_mood",
  "description": "Find tracks matching a specific mood like peaceful, energetic, melancholic, epic, etc.",
  "parameters": {
    "type": "object",
    "properties": {
      "mood": {
        "type": "string",
        "description": "The desired mood"
      },
      "limit": {
        "type": "number",
        "default": 5
      }
    },
    "required": ["mood"]
  },
  "webhook_url": "https://your-domain.com/api/v1/elevenlabs/webhook",
  "webhook_method": "POST",
  "webhook_body": {
    "intent": "recommend_by_mood",
    "mood": "{{mood}}",
    "limit": "{{limit}}"
  }
}
```

#### Step 4: Update Sandy's API Configuration

```javascript
// sandy/src/config/api.js (create this file)
export const API_CONFIG = {
  MUSIC_API_BASE: import.meta.env.VITE_MUSIC_API_URL || 'http://localhost:8000',
  ELEVENLABS_AGENT_ID: import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'your-agent-id',
};
```

```bash
# sandy/.env
VITE_MUSIC_API_URL=http://localhost:8000
VITE_ELEVENLABS_AGENT_ID=your-agent-id-here
```

#### Step 5: Branding Update

```jsx
// Change "Sparky" references to "Music Supervisor" or your brand
// sandy/src/components/brand/MusicSupervisorLogo.jsx

export default function MusicSupervisorLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <span className="text-white text-xl">🎵</span>
      </div>
      <span className="text-white font-bold text-lg">Music Supervisor</span>
    </div>
  );
}
```

## 🎨 Components to Reuse from Sandy

### ✅ Keep As-Is:
- All `lib/` directory (11Labs integration)
- All `components/ui/` (Radix components)
- `AgentContext.jsx` and `AgentMicContext.jsx`
- `SimpleAgentConnect.jsx` (voice selector)
- All audio handling components
- Tailwind configuration
- Vite configuration

### 🔄 Modify:
- `ChatBox.jsx` - Add music result display
- Branding components - Change from Sparky to Music theme
- `App.jsx` - Update branding/theme

### ➕ Add New:
- `components/music/TrackCard.jsx`
- `components/music/MusicResults.jsx`
- `components/music/TrackPlayer.jsx` (future: if you want to play samples)
- Music-specific icons and assets

## 📝 Implementation Checklist

### Phase 1: Setup (30 min)
- [ ] Copy `.env.example` from music-supervisor to Sandy
- [ ] Add `VITE_MUSIC_API_URL=http://localhost:8000`
- [ ] Create 11Labs agent account (if not existing)
- [ ] Get 11Labs API key and Agent ID

### Phase 2: Add Music Components (1 hour)
- [ ] Create `sandy/src/components/music/` directory
- [ ] Add `TrackCard.jsx`
- [ ] Add `MusicResults.jsx`
- [ ] Add helper functions (`formatDuration`, etc.)

### Phase 3: Modify ChatBox (45 min)
- [ ] Add `musicResults` state
- [ ] Modify `useEffect` to handle track data
- [ ] Add `<MusicResults>` component to render
- [ ] Test with mock data

### Phase 4: Configure 11Labs (30 min)
- [ ] Create agent in 11Labs dashboard
- [ ] Add system prompt
- [ ] Configure custom functions (3 functions)
- [ ] Set webhook URLs
- [ ] Test webhook with curl

### Phase 5: Connect & Test (45 min)
- [ ] Start music-supervisor backend
- [ ] Start Sandy frontend (`pnpm dev`)
- [ ] Connect to 11Labs agent
- [ ] Test voice commands
- [ ] Fix any issues

### Phase 6: Polish (1 hour)
- [ ] Update branding (logo, colors, name)
- [ ] Add loading states
- [ ] Error handling
- [ ] Responsive design tweaks
- [ ] Add quick action buttons for common queries

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start Music Supervisor Backend
cd /Users/ceciliaconde/Desktop/music-supervisor
/usr/bin/python3 -m uvicorn app.main:app --reload

# Terminal 2: Start Sandy Frontend
cd /Users/ceciliaconde/Desktop/Sandy/sandy
pnpm install  # if needed
pnpm dev

# Terminal 3: Expose backend for 11Labs webhook (for testing)
ngrok http 8000
# Copy the https URL to 11Labs webhook config
```

## 🎯 Expected Result

After migration, users will be able to:

1. **Voice Search:** "Find me some peaceful songs from the 70s"
   - Agent calls `search_music` with query="peaceful 70s"
   - Backend returns matching tracks
   - Sandy displays beautiful track cards
   - Agent speaks: "I found 3 peaceful tracks from the 70s..."

2. **Track Information:** "Tell me about Bohemian Rhapsody"
   - Agent calls `get_track_info`
   - Backend returns track details
   - Sandy shows detailed track card
   - Agent speaks track information

3. **Mood-Based:** "I need something energetic"
   - Agent calls `recommend_by_mood` with mood="energetic"
   - Backend returns high-energy tracks
   - Sandy displays results
   - Agent speaks recommendations

## 💡 Alternative: Simpler Approach

If you want to move faster, you could:

1. **Just copy Sandy's UI components** to music-supervisor/frontend
2. **Don't use 11Labs agent** - use browser speech recognition (like the basic frontend I created)
3. **Keep it simple** - just voice search without conversation context

But I **don't recommend this** because:
- You lose the conversational AI capabilities
- Sandy already has everything working
- 11Labs agent makes the experience much better

## 🆘 Troubleshooting

**Issue:** 11Labs webhook not receiving requests
- Solution: Use ngrok to expose localhost, update webhook URL in 11Labs

**Issue:** CORS errors
- Solution: Backend already has CORS enabled, check `allow_origins` in main.py

**Issue:** Track cards not showing
- Solution: Check console for data format, ensure backend returns `tracks` array

**Issue:** Voice not connecting
- Solution: Check 11Labs API key in Sandy's config

## 📞 Next Steps

Ready to start? Let's begin with Phase 1!

1. First, let's check if you have an 11Labs account
2. Then we'll set up the environment variables
3. Add the music components to Sandy
4. Configure the agent
5. Test it live!

Which phase would you like to start with?
