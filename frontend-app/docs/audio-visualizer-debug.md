# Audio Visualizer Debug Investigation

## Issue
Audio input visualizer (the bar that reacts to microphone input) appears inconsistently - sometimes it shows up and reacts as expected, but other times it doesn't appear at all.

## Root Cause Analysis

### Identified Issues

1. **CRITICAL: Race Condition Between Meter Creation and Callback Registration**
   - `setMicOnMeter()` was being called BEFORE the AudioMeter instance was created
   - When worklet messages arrived, `meter.current` was still `null` in the callback closure
   - The callback referenced a meter that didn't exist yet, causing silent failures
   - **This was the primary cause of inconsistent visualization**

2. **Timing Issue with Meter Callback Registration**
   - `setMicOnMeter()` was being called on every render without proper dependency management
   - The callback could be set BEFORE the mic was opened, or AFTER, leading to inconsistent behavior
   - No way to verify if the callback was properly registered when mic opened

3. **Race Condition with Worklet Loading**
   - No verification that worklet module loaded successfully before mic streaming started
   - No error handling if worklet loading failed
   - Silent failures could cause visualizer to not appear

4. **Missing Callback Verification in Worklet Message Handler**
   - Worklet could be sending RMS level messages, but if `onMeter` callback was null, visualizer wouldn't update
   - No logging to verify messages were being received or callbacks were being executed

5. **No Diagnostic Logging**
   - No way to track:
     - When worklet module loads
     - When mic stream actually starts
     - When RMS level messages are received
     - Whether meter callback is registered at critical moments
     - Whether AudioMeter.update() is being called

## Changes Made

### 1. Enhanced `lib/audio/Mic.js`

#### Added comprehensive logging:
```javascript
- 🎤 Opening mic - logs if onMeter callback is registered
- 🎤 AudioContext created with state
- 🎤 Requesting microphone permission
- 🎤 Microphone stream obtained
- 🎤 Loading audio worklet from URL
- ✅ Audio worklet loaded successfully (or ❌ failed)
- 🎤 AudioWorkletNode created
- 📊 First 3 worklet messages with RMS level and callback status
- ⚠️ Warning if no meter callback is registered when messages arrive
- 🎤 Audio pipeline connected - streaming confirmation
- 🎤 Final check of onMeter callback registration
```

#### Enhanced `setOnMeter()`:
- Added logging when callback is registered
- Tracks callback status throughout lifecycle

#### Enhanced worklet message handler:
- Tracks message count to log first 3 messages
- Logs RMS level, sample count, and callback status
- Warns if no callback is registered when messages arrive

#### Enhanced `close()`:
- Logs when mic is closing
- Resets message counter for next session
- Comprehensive cleanup logging

### 2. Updated `public/audio-processor-worklet.js`

#### Added worklet-side logging:
```javascript
- 🎤 Constructor called - worklet initialized
- 📊 Sending message #N with RMS level (first 3 messages only)
```

#### Added message counter:
- Tracks how many messages have been sent from worklet
- Useful for debugging message flow

### 3. Fixed `src/components/ChatBox.jsx`

#### CRITICAL FIX: Callback registration AFTER meter creation:
```javascript
// BEFORE (BROKEN - callback set before meter exists):
useEffect(() => {
  setMicOnMeter((level) => {
    meter.current?.update(level); // meter.current is NULL!
  });
}, [setMicOnMeter]);

useEffect(() => {
  if (micState.isOpen) {
    // Meter created here, AFTER callback already set
    meter.current = new AudioMeter(canvas.current, {...});
  }
}, [micState.isOpen]);

// AFTER (FIXED - callback set AFTER meter exists):
useEffect(() => {
  if (micState.isOpen) {
    // Create meter first
    meter.current = new AudioMeter(canvas.current, {...});
    meter.current.start();
    
    // THEN register callback with reference to the EXISTING meter
    setMicOnMeter((level) => {
      if (meter.current) {
        meter.current.update(level);
      }
    });
  }
}, [micState.isOpen, setMicOnMeter]);
```

**Why this fixes the issue:**
- Meter is created FIRST, then callback is registered
- Callback closure captures the meter reference AFTER it exists
- Prevents race condition where callback has null meter reference
- Ensures every mic toggle re-registers callback with current meter instance

### 4. Fixed `src/components/debug/DebugMicInput.jsx`

#### Applied same fix as ChatBox:
- Wrapped `setMicOnMeter()` in `useEffect` with proper dependencies
- Wrapped `setOnRecorderStateChange()` in separate `useEffect`
- Added logging to track callback setup

### 5. Enhanced `src/AgentContext.jsx`

#### Added logging to `toggleMic()`:
```javascript
- 🎤 Current state (OPEN/CLOSED)
- 🎤 Closing mic... or Opening mic...
- 🎤 Mic opened successfully
- 🎤 Mic state updated to new state
```

#### Added logging to `setMicOnMeter()`:
- Logs when callback is being set on Mic instance
- Warns if micRef is null

### 6. Enhanced `lib/audio/Meter.js`

#### Added logging to track meter updates:
```javascript
- 📊 update() called with level (first 5 calls)
- 🎤 start() - beginning animation loop
- 🎤 start() called but already running
- 🎤 stop() - stopping animation loop
```

#### Why this helps:
- Confirms meter.update() is being called from callback
- Verifies animation loop is running (required for visual updates)
- Detects if meter is stopped when it should be running

## Testing Checklist

### Before Testing
1. Open browser console
2. Filter by 🎤 emoji to see mic-related logs
3. Filter by 📊 emoji to see worklet message logs

### Test Scenarios

#### Scenario 1: Normal Flow (Chat Mode)
1. Open Sandy in chat mode
2. Click microphone button to turn on
3. **Expected logs:**
   ```
   [ChatBox] 🎤 Setting up meter callback
   [AgentContext] 🎤 setMicOnMeter called
   [Mic] 🎤 setOnMeter called
   [AgentContext] 🎤 toggleMic called, current state: CLOSED
   [AgentContext] 🎤 Opening mic...
   [Mic] 🎤 Opening mic - onMeter callback registered: true
   [Mic] 🎤 AudioContext created
   [Mic] 🎤 Requesting microphone permission
   [Mic] 🎤 Microphone stream obtained
   [Mic] 🎤 Loading audio worklet from: /audio-processor-worklet.js
   [Mic] ✅ Audio worklet loaded successfully
   [Mic] 🎤 AudioWorkletNode created
   [AudioProcessor Worklet] 🎤 Constructor called - worklet initialized
   [Mic] 🎤 Audio pipeline connected - mic is now streaming
   [Mic] 🎤 Final check - onMeter callback registered: true
   [AgentContext] 🎤 Mic opened successfully
   [AudioProcessor Worklet] 📊 Sending message #0, RMS level: X.XXXX
   [Mic] 📊 Worklet message received: { messageCount: 0, level: "X.XXXX", hasMeterCallback: true, ... }
   ```
4. **Verify:** Green bar appears and moves with audio input
5. Click microphone button to turn off
6. **Expected logs:**
   ```
   [AgentContext] 🎤 toggleMic called, current state: OPEN
   [AgentContext] 🎤 Closing mic...
   [Mic] 🎤 Closing mic, delay: 0
   [Mic] 🎤 _close() called
   [Mic] 🎤 Worklet disconnected and cleaned up
   [Mic] 🎤 Media stream tracks stopped
   [Mic] 🎤 AudioContext closed
   ```
7. **Verify:** Green bar stops moving and meter stops

#### Scenario 2: Multiple Toggle Cycles
1. Toggle mic on and off 5 times rapidly
2. **Verify:** 
   - Visualizer appears every time mic is turned on
   - No errors in console
   - Each cycle logs complete open/close sequences

#### Scenario 3: Conversation Mode
1. Connect to agent in conversation mode
2. Click microphone button
3. **Verify:** 
   - Same log sequence as Scenario 1
   - Visualizer appears in conversation mode interface
   - Audio is being transmitted to agent

#### Scenario 4: Debug Mode with DebugMicInput
1. Press Ctrl+B (or Cmd+B on Mac) to enable developer mode
2. Open Debug panel (button in top-right)
3. Click mic button in DebugMicInput component
4. **Expected logs:**
   ```
   [DebugMicInput] 🎤 Setting up meter callback
   [AgentContext] 🎤 setMicOnMeter called
   [Mic] 🎤 setOnMeter called
   ... (rest of sequence same as Scenario 1)
   ```
5. **Verify:**
   - Visualizer appears in debug panel
   - Canvas shows moving bars when speaking

### What to Look For

#### ✅ Success Indicators:
- `onMeter callback registered: true` in opening logs
- `hasMeterCallback: true` in worklet message logs
- `[AudioMeter] 🎤 Creating AudioMeter instance` appears
- `[ChatBox] 🎤 Re-registering meter callback` appears AFTER meter creation
- `[AudioMeter] 📊 update() called with level` appears (first 5 times)
- `[Mic] 📊 Meter callback invoked with level` appears (first 5 times)
- No `⚠️` warnings
- Worklet messages being received (📊 logs appear)
- Visualizer canvas shows moving green bars

#### ❌ Failure Indicators:
- `onMeter callback registered: false` in any log
- `hasMeterCallback: false` in worklet messages
- `⚠️ No meter callback registered` warning appears
- `⚠️ Meter callback called but meter.current is null` warning
- No `[AudioMeter] 📊 update()` logs (means callback not reaching meter)
- `[Mic] 📊 Meter callback invoked` appears but no corresponding `[AudioMeter] 📊 update()`
- No worklet messages received after 1 second
- `❌ Failed to load audio worklet` error
- Visualizer canvas remains static/empty (light blue bar only)

#### Critical Log Sequence (Must Appear in This Order):
```
1. [ChatBox] 🎤 Creating AudioMeter instance
2. [AudioMeter] 🎤 start() - beginning animation loop
3. [ChatBox] 🎤 Re-registering meter callback now that meter exists
4. [AgentContext] 🎤 setMicOnMeter called
5. [Mic] 🎤 setOnMeter called - callback: true
6. [Mic] 🎤 Opening mic - onMeter callback registered: true
7. [Mic] ✅ Audio worklet loaded successfully
8. [Mic] 📊 Worklet message received: { ..., hasMeterCallback: true }
9. [Mic] 📊 Meter callback invoked with level: X.XXXX
10. [AudioMeter] 📊 update() called with level: X.XXXX
```

If any step is missing or out of order, the visualizer may fail.

## Expected Behavior After Fix

The meter callback registration is now properly managed, ensuring:

1. **Callback is registered AFTER meter exists** - prevents null reference in closure
2. **Meter is created BEFORE callback registration** - ensures callback has valid reference
3. **Callback re-registers on each mic toggle** - ensures fresh reference to current meter
4. **Full visibility** - logs show exact sequence of operations at every step
5. **Error detection** - worklet loading failures are caught and logged
6. **Update verification** - logs confirm meter.update() is being called with RMS levels

## Additional Notes

### Emoji Legend for Console Filtering
- 🎤 - Mic lifecycle events (open, close, state changes)
- 📊 - Worklet data messages (RMS levels, audio samples)
- ✅ - Success operations
- ❌ - Errors
- ⚠️ - Warnings (e.g., missing callbacks)

### Key Files Modified
- `lib/audio/Mic.js` - Added logging throughout lifecycle
- `public/audio-processor-worklet.js` - Added worklet-side logging
- `src/components/ChatBox.jsx` - Fixed callback registration with useEffect
- `src/components/debug/DebugMicInput.jsx` - Fixed callback registration
- `src/AgentContext.jsx` - Added logging to toggleMic and setMicOnMeter

### Performance Impact
- Logging is minimal (first 3 messages only from worklet)
- No production impact - can be removed by filtering console.log in build
- Consider adding a DEBUG flag in production to disable logging
