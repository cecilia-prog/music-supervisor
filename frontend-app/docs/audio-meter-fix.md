# Audio Meter Visibility Fix

## Problem

The microphone audio input meter sometimes didn't display properly - the container would appear but the gradient bar itself was invisible.

## Root Causes

1. **Race Condition**: The canvas element is conditionally rendered (`{isDeveloperMode && micState.isOpen && ...}`), causing a timing issue where:
   - React schedules the render
   - The useEffect runs
   - But the canvas might not be in the DOM or properly laid out yet

2. **Zero Dimensions**: When `getBoundingClientRect()` was called on a canvas that wasn't fully laid out, it returned width/height of 0, resulting in a 0x0 canvas that couldn't display anything.

3. **Insufficient Retry Logic**: The original retry only checked if `canvas.current` existed, not if it had valid dimensions.

## Solutions Implemented

### 1. AudioMeter.js - Fallback Dimensions

Added validation in `_setupCanvas()` to detect zero dimensions and use fallback values:

```javascript
_setupCanvas() {
  const rect = this.canvas.getBoundingClientRect();
  const displayWidth = rect.width || this.canvas.width;
  const displayHeight = rect.height || this.canvas.height;

  // Validate dimensions - if still 0, use fallback
  if (displayWidth === 0 || displayHeight === 0) {
    console.warn('[AudioMeter] Canvas has zero dimensions, using fallback size');
    this.dim.w = 150;
    this.dim.h = 30;
    this.canvas.width = this.dim.w * dpr;
    this.canvas.height = this.dim.h * dpr;
    this.ctx.scale(dpr, dpr);
    return;
  }
  
  // Normal setup...
}
```

### 2. ChatBox.jsx - Enhanced Retry Logic

Improved the initialization retry mechanism to:
- Check if canvas ref exists
- Verify canvas has non-zero dimensions
- Retry up to 10 times with 50ms intervals
- Proceed with fallback if dimensions still zero after retries

```javascript
const initMeter = () => {
  if (!canvas.current) {
    if (retryCount < maxRetries) {
      retryCount++;
      console.debug('[ChatBox] Canvas not ready, retry', retryCount);
      setTimeout(initMeter, 50);
    }
    return;
  }

  // Check if canvas has valid dimensions
  const rect = canvas.current.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    if (retryCount < maxRetries) {
      retryCount++;
      setTimeout(initMeter, 50);
    } else {
      // Proceed anyway - fallback in AudioMeter will handle it
      createMeter();
    }
    return;
  }

  createMeter();
};
```

### 3. Logging Improvements

Changed verbose logs to `console.debug` so they're hidden in production by default:
- Canvas retry logs
- Meter start/stop logs  
- Cleanup logs

Only important events like "AudioMeter started" remain as `console.log`.

## Testing

To verify the fix works:

1. Enable developer mode to see the audio meter
2. Toggle the microphone on/off multiple times
3. The gradient bar should consistently appear
4. Check browser console for any warnings about zero dimensions

If you see the fallback warning occasionally, that's expected - the meter will still work with the 150x30 fallback dimensions.

## Related Files

- `/lib/audio/Meter.js` - AudioMeter class with fallback dimensions
- `/src/components/ChatBox.jsx` - Enhanced retry logic for canvas initialization
- `/src/utils/loggerOverride.js` - Console logging control system
