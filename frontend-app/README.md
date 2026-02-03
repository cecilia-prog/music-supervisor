# Setup

## Prerequisites
- Node.js (version 18.x or higher)
- npm or yarn

## Frontend Only Setup

If you only need to run the frontend without backend functionality:

```bash
npm install
npm run dev
```

Server runs on `http://localhost:5173/`

## Full Stack Setup (Frontend + Backend)

We use Vercel serverless functions for the backend. Follow these steps for full setup:

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Vercel CLI
```bash
npm install -g vercel
```

### 3. Login to Vercel
```bash
vercel login
```
**Note:** Use the credentials provided in 1Password (Ask Pedro for a dev account).

### 4. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```
**Important Notes:**
- The `ALLOWED_ORIGINS` should include `http://localhost:3000` to match the port Vercel dev runs on. If you change the port, update this variable accordingly.
- The Basic Auth credentials are for local development only - you'll be prompted to enter them when accessing the frontend
- Production credentials are managed in the Vercel dashboard

### 5. Start Development Server
```bash
vercel dev
```

This starts both the frontend and backend together. The application will be available at `http://localhost:3000` (or the port Vercel assigns).

## Project Structure

```
.
├── src/              # Frontend React code
├── utils/            # Project wide utilities
├── components/       # Shadcn UI components
├── components.json   # Shadcn UI components config
├── api/              # Vercel serverless functions
│   ├── _utils/       # Shared utilities (CORS, logging, etc.)
│   └── *.js          # API endpoints
├── .env              # Local environment variables (not committed)
├── .env.example      # Example environment variables
├── middleware.js     # Basic Auth middleware
├── vite.config.js    # Vite configuration
└── vercel.json       # Vercel configuration

```

## Troubleshooting

**Environment variables not loading:**
Make sure your `.env` file is in the project root and restart `vercel dev` after making changes.

**CORS errors:**
Ensure `ALLOWED_ORIGINS` in your `.env` includes the correct `localhost` port that Vercel dev is running on.

**Basic Auth not working:**
Verify that `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` are set in your `.env` file and that you're entering the correct credentials in the browser prompt.

## Shadcn UI Components

Components are added on-demand rather than pre-installed.

### Adding a component

```bash
npx shadcn@latest add button
```

Browse available components at [shadcn.com/docs/components](https://v3.shadcn.com/docs/components)

### Using components

Components are added to `src/components/ui/`. Import and use them:

```javascript
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"

function MyComponent() {
  return <Button>Click me</Button>
}
```

### Component props

Check [Radix UI docs](https://www.radix-ui.com/primitives/docs/components) for available props. Example for Select:

- `value` / `onValueChange` - Control selected value
- `defaultValue` - Set initial value
- `disabled` - Disable the select

## Tailwind CSS

Style components using utility classes directly in `className`:

```javascript
<div className="flex items-center justify-center p-4 bg-gray-100">
  <p className="text-lg text-gray-800">Centered text</p>
</div>
```

[Full Tailwind docs](https://tailwindcss.com/docs)

## JSDoc

Use JSDoc for type hints and IntelliSense (ESLint will warn on issues):

```javascript
/**
 * @param {string} name - User's name
 * @param {number} age - User's age
 * @returns {string}
 */
function greet(name, age) {
  return `Hello ${name}, you are ${age} years old`
}
```


