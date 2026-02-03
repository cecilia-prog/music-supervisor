# Audio Playback Clicking Analysis

## Current Architecture

### Audio Pipeline Flow
```
WebSocket → base64 audio → AudioDecoder middleware → ArrayBuffer → 
AudioQueuePlayer.load() → Int16Array PCM → Float32Array ringBuffer → 
AudioBufferSourceNode → AudioContext destination
```

### Key Components

1. **Input**: Base64-encoded PCM16 audio at 16 kHz from ElevenLabs agent
2. **Decoder**: `AudioDecoder` middleware (lib/agent/middlewares.js)
3. **Player**: `AudioQueuePlayer` (lib/audio/AudioQueuePlayer.js)
4. **Buffer Size**: 150ms default (`DEFAULT_BUFFER_SIZE_MS`)
5. **AudioContext**: Browser creates at 48 kHz (typical)

## Root Cause Analysis

### ✅ CONFIRMED: Sample Rate Mismatch (Primary Culprit)

**Issue**: 16 kHz PCM data played through 48 kHz AudioContext WITHOUT resampling

```javascript
// Current code in AudioQueuePlayer.js
const buffer = this.audioContext.createBuffer(1, this.ringBuffer.length, this.sampleRate);
//                                                                        ^^^^^^^^^^^^^^^^
//                                                               Creates 16 kHz buffer...
buffer.getChannelData(0).set(this.ringBuffer);
source.buffer = buffer;
source.connect(this.audioContext.destination);
//              ^^^^^^^^^^^^^^^
//              ...but AudioContext runs at 48 kHz!
```

**What happens**:
- You create an AudioBuffer with `sampleRate: 16000`
- AudioContext resamples 16 kHz → 48 kHz using built-in resampler
- **Browser resampling is LOW QUALITY** (typically linear interpolation)
- This creates audible artifacts, especially at chunk boundaries

**Why clicks occur at boundaries**:
1. Each 150ms chunk is resampled independently
2. No phase continuity between chunks
3. Discontinuities at boundaries cause clicks/pops

### ✅ CONFIRMED: Insufficient Pre-roll (Secondary Issue)

**Current behavior**:
```javascript
_toPlayback(buffer) {
  const source = this.audioContext.createBufferSource();
  source.buffer = buffer;
  
  const currentTime = this.audioContext.currentTime;
  const startTime = Math.max(this.nextStartTime, currentTime);
  // ^^^^^^^^^ If nextStartTime < currentTime, plays IMMEDIATELY
  
  this.nextStartTime = startTime + source.buffer.duration;
  this.queueCount++;
  
  this._ensureRunning().then(() => {
    source.connect(this.audioContext.destination);
    source.start(startTime);
  });
}
```

**Problems**:
1. **No pre-buffer**: First chunk can start playing before second arrives
2. **Race condition**: `_ensureRunning()` is async, but `source.start()` needs precise timing
3. **Buffer underrun risk**: If `queueCount === 0` and new chunk arrives, it plays immediately without gap filling

### ❌ NOT THE ISSUE: Chunk Boundaries (Samples are Preserved)

The current code correctly handles sample boundaries:
```javascript
load(audioBuffer) {
  const pcmData = new Int16Array(audioBuffer);
  
  for (let i = 0; i < pcmData.length; i++) {
    this.ringBuffer[this.bufferIndex] = /* ... */;
    this.bufferIndex++;
    
    if (this.bufferIndex >= this.ringBuffer.length) {
      this._enqueuePlayback(); // Enqueues exactly when full
      this.bufferIndex = 0;
    }
  }
  
  this._flush(); // Handles partial buffers
}
```

No samples are dropped or duplicated. The ring buffer mechanism is sound.

### ⚠️ MINOR ISSUE: Timer Jitter

**Less critical** but worth noting:
- Main thread delivery can have jitter (10-50ms variance)
- However, Web Audio API's scheduling handles this well with `source.start(startTime)`
- This is likely NOT causing clicks, but could cause occasional gaps

## Recommended Solutions (Priority Order)

### Solution 1: HIGH-QUALITY RESAMPLING (CRITICAL FIX)

**Problem**: Browser resampling is poor quality
**Solution**: Resample 16 kHz → 48 kHz BEFORE creating AudioBuffer

#### Option A: Create AudioContext at 16 kHz (EASIEST)

```javascript
// In AudioQueuePlayer constructor
this.audioContext = context || new AudioContext({ 
  sampleRate: this.sampleRate  // 16000
});
```

**Pros**:
- Zero code changes elsewhere
- No resampling artifacts
- Browser handles final output resampling (which is only 16→48 once at the end)

**Cons**:
- May not be supported on all browsers (Safari?)
- Forces mic AudioContext to also be 16 kHz if shared

#### Option B: Manual High-Quality Resampling (BETTER)

Add a resampler that uses windowed sinc interpolation:

```javascript
_resample16to48(pcm16) {
  // Use Web Audio OfflineAudioContext for high-quality resampling
  const offlineCtx = new OfflineAudioContext(
    1, // mono
    pcm16.length * 3, // 16k → 48k is 3x samples
    48000
  );
  
  // Create buffer at original rate
  const sourceBuffer = offlineCtx.createBuffer(1, pcm16.length, 16000);
  sourceBuffer.getChannelData(0).set(pcm16);
  
  // Create source
  const source = offlineCtx.createBufferSource();
  source.buffer = sourceBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);
  
  // Render resampled audio
  return offlineCtx.startRendering(); // Returns Promise<AudioBuffer>
}
```

**Pros**:
- HIGH quality resampling (same as DAW software)
- Works on all browsers
- Eliminates boundary artifacts

**Cons**:
- Adds ~5-15ms latency per chunk
- More complex code

### Solution 2: ADD PRE-BUFFER (IMPORTANT)

Current issue: Can start playing with only 1 chunk queued

```javascript
// In AudioQueuePlayer constructor
this.minQueuedChunks = 2; // Don't start until we have 2 chunks

// In _toPlayback()
_toPlayback(buffer) {
  const source = this.audioContext.createBufferSource();
  source.buffer = buffer;
  
  source.onended = () => {
    this.queueCount--;
    this._stateUpdate();
  };
  
  const currentTime = this.audioContext.currentTime;
  
  // ADD PRE-BUFFER LOGIC
  if (this.queueCount === 0) {
    // First chunk - add safety margin
    this.nextStartTime = currentTime + 0.1; // 100ms pre-buffer
  } else {
    this.nextStartTime = Math.max(this.nextStartTime, currentTime);
  }
  
  const startTime = this.nextStartTime;
  this.nextStartTime = startTime + source.buffer.duration;
  this.queueCount++;
  
  this._stateUpdate();
  
  // Ensure running BEFORE scheduling
  await this._ensureRunning(); // Make this function return Promise
  source.connect(this.audioContext.destination);
  source.start(startTime);
}
```

### Solution 3: SMOOTH CHUNK BOUNDARIES (OPTIONAL)

Add crossfading between chunks to eliminate any remaining clicks:

```javascript
_toPlayback(buffer) {
  const source = this.audioContext.createBufferSource();
  source.buffer = buffer;
  
  // Create gain node for fade-in
  const gainNode = this.audioContext.createGain();
  source.connect(gainNode);
  gainNode.connect(this.audioContext.destination);
  
  const startTime = /* ... calculate as before ... */;
  const fadeDuration = 0.005; // 5ms crossfade
  
  // Fade in at start
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(1, startTime + fadeDuration);
  
  // Fade out at end (if needed)
  const endTime = startTime + source.buffer.duration;
  gainNode.gain.setValueAtTime(1, endTime - fadeDuration);
  gainNode.gain.linearRampToValueAtTime(0, endTime);
  
  source.start(startTime);
  // ...
}
```

## Diagnosis Commands

### Check AudioContext Sample Rate
```javascript
console.log('AudioContext sample rate:', audioContext.sampleRate);
// Likely outputs: 48000
```

### Check Buffer Timing
```javascript
// In _toPlayback(), add logging:
console.log('Playback timing:', {
  currentTime: currentTime.toFixed(3),
  startTime: startTime.toFixed(3),
  nextStartTime: this.nextStartTime.toFixed(3),
  gap: (startTime - currentTime).toFixed(3),
  queueCount: this.queueCount,
  bufferDuration: source.buffer.duration.toFixed(3)
});
```

### Check for Buffer Underruns
```javascript
// In source.onended:
source.onended = () => {
  const gap = this.nextStartTime - this.audioContext.currentTime;
  if (gap < 0.05) { // Less than 50ms buffered
    console.warn('⚠️ BUFFER UNDERRUN WARNING - only', 
                 (gap * 1000).toFixed(0), 'ms buffered');
  }
  this.queueCount--;
  this._stateUpdate();
};
```

## Minimal Implementation Plan

### Phase 1: Fix Sample Rate Mismatch (CRITICAL)
1. Try Option A first (easiest):
   ```javascript
   this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
   ```
2. Test on Chrome, Firefox, Safari
3. If not supported, implement Option B (offline resampling)

### Phase 2: Add Pre-buffer (IMPORTANT)
1. Add 100ms initial delay when `queueCount === 0`
2. Add buffer underrun detection logging
3. Monitor `bufferedTimeMS` and warn if < 50ms

### Phase 3: Optional Enhancements
1. Add crossfading if clicks still audible
2. Implement adaptive buffer sizing based on network jitter
3. Add audio worklet for even lower latency (complex)

## Expected Results

After implementing Phase 1 + 2:
- ✅ **Eliminate clicking sounds** (from poor resampling)
- ✅ **Prevent buffer underruns** (from insufficient pre-roll)
- ✅ **Smooth playback** even with network jitter
- 📉 **Latency**: +100ms initial delay, but acceptable for conversational AI

## Testing Checklist

1. **Play continuous speech for 30+ seconds**
   - Listen for clicks at ~150ms intervals
   - Should be completely smooth after fix

2. **Toggle mic rapidly** (stress test)
   - Verify no buffer underruns
   - Check console for warnings

3. **Test on slow connection** (throttle network to 3G)
   - Ensure pre-buffer prevents glitches
   - Monitor `bufferedTimeMS` stays > 100ms

4. **Compare browsers**
   - Chrome, Firefox, Safari
   - Verify consistent behavior
