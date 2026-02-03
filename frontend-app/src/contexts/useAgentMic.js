import { useContext } from 'react'
import { AgentMicContext } from './AgentMicContextDef'

/**
 * Hook to access the AgentMic context
 * @returns {object} The AgentMic context value
 */
export function useAgentMic() {
  const context = useContext(AgentMicContext)
  if (!context) {
    throw new Error('useAgentMic must be used within an AgentMicContext provider')
  }
  return context
}