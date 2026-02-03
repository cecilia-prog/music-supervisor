# Logging System

This project uses a logging override system to control console output verbosity in different environments.

## Log Levels

The system supports four log levels (from most verbose to least):

- **debug** (0): Shows all logs including debug, log, warn, and error
- **log** (1): Shows log, warn, and error (hides debug)
- **warn** (2): Shows only warn and error (hides debug and log)
- **production** (3): Shows only error (hides everything else)

## Usage

### Development

Set the log level using the `VITE_LOG_LEVEL` environment variable:

```bash
# Show all logs including debug statements
VITE_LOG_LEVEL=debug npm run dev
VITE_LOG_LEVEL=debug vercel dev

# Show log, warn, and error
VITE_LOG_LEVEL=log npm run dev

# Show only warnings and errors
VITE_LOG_LEVEL=warn npm run dev

# Production mode - only errors
VITE_LOG_LEVEL=production npm run dev
```

### Production

By default, production builds run with `VITE_LOG_LEVEL=production`, which suppresses all logs except errors.

To override this in Vercel, set the `VITE_LOG_LEVEL` environment variable in your project settings.

## Console Method Guidelines

Use the appropriate console method based on the type of information:

- **console.debug()**: Verbose debugging information (API responses, state changes, detailed traces)
- **console.log()**: General information (component lifecycle, important events)
- **console.warn()**: Warnings that don't break functionality (missing optional data, deprecated usage)
- **console.error()**: Errors that need attention (failed API calls, exceptions, critical issues)

## Example

```javascript
// Verbose debugging - hidden in production
console.debug("[Component] Fetching data...", { params });

// General information - hidden in production by default
console.log("[Component] Data loaded successfully");

// Warnings - shown in warn and production modes
console.warn("[Component] Deprecated prop used");

// Errors - always shown
console.error("[Component] Failed to load data", error);
```

## Implementation

The logging override is imported at the top of `src/App.jsx` and runs before any other code, ensuring all console statements throughout the app respect the configured log level.
