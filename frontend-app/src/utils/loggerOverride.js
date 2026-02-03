// loggerOverride.js
// Overrides console methods based on LOG_LEVEL environment variable
// Usage: LOG_LEVEL=debug npm run dev (or vercel dev)
// Levels: debug (0) -> log (1) -> warn (2) -> production (3)

// const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'production';
const LOG_LEVEL = "debug"

const levels = {
  debug: 0,
  log: 1,
  warn: 2,
  production: 3
};

const currentLevel = levels[LOG_LEVEL] ?? levels.production;

// Store original console methods
const originalConsole = {
  debug: console.debug,
  log: console.log,
  warn: console.warn,
  error: console.error
};

// Override console methods based on level
if (currentLevel > levels.debug) {
  console.debug = () => {};
}

if (currentLevel > levels.log) {
  console.log = () => {};
}

if (currentLevel > levels.warn) {
  console.warn = () => {};
}

// Always keep console.error enabled
console.error = originalConsole.error;

// Export for debugging purposes
export { originalConsole, LOG_LEVEL, currentLevel };
