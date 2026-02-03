# Sparky Assets Setup Guide

## Required Assets

Please add the following asset files to complete the Sparky branding integration:

### 1. Brand Assets (`/src/assets/sparky/`)

Create the `/src/assets/sparky/` directory and add:

- `sparky-mark.png` - Static mark for header logo (32x32px recommended)
- `sparky-wordmark.png` - Optional wordmark (for future use)
- `sparky-idle.gif` - Subtle idle animation (shown when not listening/speaking)
- `sparky-listening.gif` - Ears/listening state animation
- `sparky-speaking.gif` - Speaking/talking state animation

### 2. Launch Animations (`/src/assets/sparky/launch/`)

Create the `/src/assets/sparky/launch/` directory and add:

- `sparky-bouncy.gif` - Bouncy entrance animation (default)
- `sparky-floaty.gif` - Floating entrance animation
- `sparky-roll.gif` - Rolling entrance animation  
- `sparky-hard.gif` - Hard entrance animation

**Note:** Currently configured to use `sparky-bouncy.gif` by default. You can change this in `/src/config/brand.ts`.

### 3. Favicons & App Icons (`/public/`)

Add these files to the `/public/` directory:

- `favicon.ico` - Standard favicon (16x16, 32x32, 48x48)
- `icons/icon-192.png` - PWA icon (192x192px)
- `icons/icon-512.png` - PWA icon (512x512px)

## What's Already Implemented

✅ Component structure for Icon system
✅ SparkyLogo component for header
✅ SparkyConversation component with state management (idle/listening/speaking)
✅ SparkyLaunch component for entrance animation
✅ App integration with launch screen
✅ ChatBox updated with Sparky branding
✅ PWA manifest (`site.webmanifest`)
✅ index.html updated with favicon/manifest links

## Configuration

### Launch Animation Settings

Edit `/src/config/brand.ts` to customize:

```typescript
export const BRAND = {
  launch: {
    enabled: true,  // Set to false to disable launch animation
    variant: 'bouncy' as 'bouncy' | 'floaty' | 'roll' | 'hard',
    durationMs: 1400  // Animation duration in milliseconds
  }
};
```

### Conversation Mode States

The app automatically switches between Sparky states:

- **Idle** (`sparky-idle.gif`): Default state when not recording or speaking
- **Listening** (`sparky-listening.gif`): When microphone is active
- **Speaking** (`sparky-speaking.gif`): When agent is speaking (TODO: implement audio player state detection)

## Testing

Once assets are added:

1. The launch animation will play once per session on app load
2. Click anywhere or press any key to skip the animation
3. Sparky mark will appear in the top-left header
4. In conversation mode, Sparky will animate based on state
5. Favicons will appear in browser tabs and bookmarks

## Asset Requirements

- **GIFs**: Keep file size reasonable (< 500KB each recommended)
- **PNGs**: Use transparent backgrounds where appropriate
- **Optimization**: Compress assets for web (use tinypng.com or similar)
- **2x versions**: Not required, but can be provided for hi-DPI displays

## Directory Structure

```
sandy/
├── public/
│   ├── favicon.ico
│   ├── site.webmanifest
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
└── src/
    └── assets/
        └── sparky/
            ├── sparky-mark.png
            ├── sparky-wordmark.png
            ├── sparky-idle.gif
            ├── sparky-listening.gif
            ├── sparky-speaking.gif
            └── launch/
                ├── sparky-bouncy.gif
                ├── sparky-floaty.gif
                ├── sparky-roll.gif
                └── sparky-hard.gif
```
