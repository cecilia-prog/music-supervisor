// DEPRECATED: 

import { useState, useMemo } from 'react'
import Mic from '../../lib/audio/Mic'
import { AgentMicContext } from './AgentMicContextDef'

/**
 * Provides mic functionality and state to child components
 * @param {object} props Component props
 * @param {import('react').ReactNode} props.children Child components
 * @returns {import('react').ReactElement} Provider component
 */
export function AgentMicContextProvider({ children }) {
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(0)
  
  // Initialize mic with required parameters
  const mic = useMemo(() => {
    const m = new Mic({ sampleRate: 16000, bufferSizeMS: 100, withRecording: true })
    m.onMeter = setVolume
    return m
  }, [])

  const value = {
    mic,
    isRecording,
    setIsRecording,
    volume,
    setVolume,
  }

  return (
    <AgentMicContext.Provider value={value}>
      {children}
    </AgentMicContext.Provider>
  )
}
