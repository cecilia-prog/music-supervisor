import './utils/loggerOverride.js'
import { Toaster } from '@/components/ui/sonner'
import { AgentProvider } from './AgentContext.jsx'
import Debug from './components/debug/Debug.jsx'
import ChatBox from './components/ChatBox.jsx'
import { useDeveloperMode } from './hooks/useDeveloperMode.js'

/**
 * Main App component with Sparky branding integration
 */
function App() {
  const isDeveloperMode = useDeveloperMode();

  return (
    <>
      <main className="w-screen h-screen bg-white gap-4 relative">
        <AgentProvider>
          {isDeveloperMode && <Debug />}
          <ChatBox />
        </AgentProvider>
      </main>
      <Toaster />
    </>
  )
}

export default App
