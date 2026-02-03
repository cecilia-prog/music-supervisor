# Agent Interruption (Barge-in) Feature

## Overview

The interruption feature allows users to interrupt the agent mid-speech when they start speaking. This creates a more natural conversation flow, similar to how humans interrupt each other in real-world conversations.

## How It Works

### Voice Activity Detection (VAD)
- **Threshold-based detection**: Monitors microphone RMS levels continuously
- **Configurable threshold**: Default is 0.02 (2% of max volume)
- **Consecutive samples required**: 3 samples above threshold to trigger
- **Cooldown period**: 1 second between interruptions to prevent rapid re-triggers

### Interruption Process
1. User's microphone is active (conversation mode)
2. Agent is speaking (audio playback active)
3. User starts speaking (RMS level exceeds threshold for 3 consecutive samples)
4. System detects voice activity → triggers interruption
5. Agent audio queue cleared immediately
6. Agent playback stops
7. User's speech proceeds normally

## Implementation Details

### Key Components

#### AudioQueuePlayer (`lib/audio/AudioQueuePlayer.js`)
```javascript
interrupt() {
  // Fast-forward playback time to skip all queued audio
  this.nextStartTime = this.audioContext.currentTime;
  // Reset queue
  this.queueCount = 0;
  this.bufferIndex = 0;
}
```

#### Conversation (`lib/agent/Conversation.js`)
```javascript
interrupt() {
  this.audioPlayer.interrupt();
  this.receiveStatus = "ready";
}
```

#### AgentContext (`src/AgentContext.jsx`)
```javascript
// VAD state configuration
vadStateRef = {
  threshold: 0.02,          // RMS level to detect speech
  requiredSamples: 3,       // Consecutive samples needed
  cooldownMs: 1000,         // Cooldown between interruptions
}

// Chains VAD with visualization
setMicOnMeter((level) => {
  onVoiceActivity(level);   // Check for interruption
  onMeter(level);           // Update visualization
});
```

### VAD Parameters (Tunable)

Located in `src/AgentContext.jsx`:

```javascript
vadStateRef.current = {
  consecutiveHighSamples: 0,
  threshold: 0.02,           // Lower = more sensitive (more false positives)
  requiredSamples: 3,        // Higher = less sensitive (slower reaction)
  lastInterruptTime: 0,
  cooldownMs: 1000,          // Milliseconds between allowed interruptions
};
```

## Usage

### Enable/Disable Interruption

The feature is **enabled by default**. To toggle:

```javascript
import { useAgentMic } from './hooks/useAgent';

function MyComponent() {
  const { interruptionEnabled, setInterruptionEnabled } = useAgentMic();
  
  return (
    <button onClick={() => setInterruptionEnabled(!interruptionEnabled)}>
      Interruption: {interruptionEnabled ? 'ON' : 'OFF'}
    </button>
  );
}
```

### Expected Behavior

**When Enabled:**
- User can interrupt agent by speaking
- Agent stops immediately when user voice detected
- Console logs: `[AgentContext] 🛑 User is speaking - interrupting agent`
- Console logs: `[AudioQueuePlayer] 🛑 INTERRUPT - Clearing audio queue`

**When Disabled:**
- User must wait for agent to finish speaking
- Traditional turn-taking conversation

## Tuning Guidelines

### If Interruptions Are Too Sensitive (False Positives)

**Option 1: Increase threshold**
```javascript
vadStateRef.current.threshold = 0.03; // More noise tolerance
```

**Option 2: Require more consecutive samples**
```javascript
vadStateRef.current.requiredSamples = 5; // Slower but more confident
```

### If Interruptions Are Too Slow

**Option 1: Lower threshold**
```javascript
vadStateRef.current.threshold = 0.015; // Detect quieter speech
```

**Option 2: Require fewer consecutive samples**
```javascript
vadStateRef.current.requiredSamples = 2; // Faster reaction
```

**Option 3: Reduce cooldown**
```javascript
vadStateRef.current.cooldownMs = 500; // Allow more frequent interruptions
```

## Testing

### Manual Testing
1. Connect to agent in conversation mode
2. Let agent start speaking
3. Start speaking before agent finishes
4. Verify agent stops immediately
5. Check console for interruption logs

### Test Scenarios
- **Quiet speech**: Whisper while agent is speaking
- **Loud speech**: Shout while agent is speaking
- **Background noise**: Test with music/noise in background
- **Multiple interruptions**: Interrupt multiple times in quick succession

### Expected Console Output
```
[AgentContext] 🎤 Opening mic...
[Mic] 🎤 Opening mic - onMeter callback registered: true
[AudioQueuePlayer] 🔊 Loading audio chunk #0: { durationMs: 150, ... }
[AgentContext] 🛑 User is speaking - interrupting agent
[AudioQueuePlayer] 🛑 INTERRUPT - Clearing audio queue { queuedChunks: 3, bufferedMs: 450 }
```

## Limitations

1. **Latency**: ~50-100ms delay from when you start speaking to when agent stops
   - Caused by: RMS calculation, consecutive sample requirement, audio processing
   
2. **False Positives**: Background noise or non-speech sounds may trigger interruption
   - Solution: Increase threshold or requiredSamples
   
3. **False Negatives**: Very quiet speech may not trigger interruption
   - Solution: Decrease threshold
   
4. **Cooldown Required**: Can't interrupt immediately after an interruption
   - Solution: Reduce cooldownMs (but may cause issues)

## Advanced: Custom VAD

To implement more sophisticated VAD (e.g., ML-based):

1. Replace `onVoiceActivity` function in `AgentContext.jsx`
2. Use WebAssembly VAD library (e.g., Silero VAD, WebRTC VAD)
3. Keep the same `interruptAgent()` interface

Example structure:
```javascript
import { useVAD } from '@/lib/vad'; // Your VAD library

const vad = useVAD({
  onSpeechStart: () => {
    if (interruptionEnabled) {
      interruptAgent();
    }
  }
});

// In setMicOnMeter:
const chainedCallback = (level) => {
  vad.processAudio(level); // Instead of onVoiceActivity
  onMeter(level);
};
```

## Future Enhancements

- [ ] Add UI toggle for interruption enable/disable
- [ ] Add VAD threshold slider in settings
- [ ] Visualize when interruption is triggered
- [ ] Add haptic/visual feedback when interruption occurs
- [ ] Implement more sophisticated VAD (ML-based)
- [ ] Add interruption analytics/metrics
