# Sandy Project - AI Development Guide

## Project Overview
Sandy is a web application with a React frontend and Vercel serverless backend that implements an agent-based communication system. The project uses Vite for frontend builds and includes audio processing capabilities.

## Key Architecture Components

### Agent System
- Core agent implementation in `lib/agent/Agent.js`
- Uses WebSocket for real-time communication
- Implements middleware pattern for processing messages (`lib/agent/middlewareProcessor.js`)
- Supports audio processing through `lib/audio/` modules

### Frontend Structure
- React components in `src/components/`
- Debug tools in `src/components/debug/`
- Uses Shadcn UI components (imported on-demand)
- Global state management through React Context (`src/AgentContext.jsx`)

### Backend (Vercel Serverless)
- API endpoints in `api/` directory
- Includes TTS and conversational agent endpoints
- Uses middleware.js for Basic Auth protection
- CORS and request parsing utilities in `lib/`

## Development Workflow

### Environment Setup
1. Copy `.env.example` to `.env`
2. Set required environment variables (see README)
3. Install dependencies: `npm install`
4. Install Vercel CLI: `npm install -g vercel`
5. Login to Vercel: `vercel login`

### Development Commands
- Frontend only: `npm run dev` (port 5173)
- Full stack: `vercel dev` (port 3000)
- Run tests: `npm test`
- Run UI tests: `npm run test:ui`

### Adding UI Components
Use shadcn CLI to add components:
```bash
npx shadcn@latest add <component-name>
```
Components are added to `src/components/ui/`

## Project Conventions

### Code Organization
- Frontend React code in `src/`
- Shared utilities in `lib/`
- UI components in `components/`
- API endpoints in `api/`

### Error Handling
- Use `lib/tryCatch.js` for consistent error handling
- Implement middleware error handling in agent connections
- Use the Logger middleware for debugging

### Testing
- Test files located next to implementation files
- Example: `lib/agent/test/AgentConnInitOptions.test.js`
- Use Vitest for running tests

## Common Integration Points
- ElevenLabs API integration (`lib/elevenLabs.js`)
- WebSocket connections for agent communication
- Audio processing pipeline (`lib/audio/`)
- Basic Auth middleware for API protection