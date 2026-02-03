import { useContext } from "react";
import { AgentConnectionContext, AgentResponseContext, AgentMicContext } from "../AgentContext.jsx";
/** @typedef {import("../AgentContext.jsx").MicState} MicState */
/** @typedef {import("../AgentContext.jsx").ConnectionState} ConnectionState */
/** @typedef {import("../AgentContext.jsx").AgentResponseState} AgentResponseState */
/** @typedef {import("../AgentContext.jsx").ConversationState} ConversationState */
/** @typedef {import("../AgentContext.jsx").AgentErrorState} AgentErrorState */
/** @typedef {import("../AgentContext.jsx").SelectAgentFunction} SelectAgentFunction */
/** @typedef {import("../AgentContext.jsx").RecorderState} RecorderState */

/**
 * @returns {{agentResponse: AgentResponseState | null, agentError: AgentErrorState | null, conversationState: ConversationState | null}}
 */
export function useAgentResponse() {
  const context = useContext(AgentResponseContext);

  if (!context) {
    throw new Error("useAgentResponse must be used within an AgentResponseContext provider");
  }

  return context;
}

/**
 * @returns {{connection: ConnectionState, selectAgent: SelectAgentFunction, disconnectAgent: () => void, selectedVoice: {id: string, name: string} | null, setSelectedVoice: (voice: {id: string, name: string} | null) => void}}
 */
export function useAgentConnection() {
  const context = useContext(AgentConnectionContext);

  if (!context) {
    throw new Error("useAgentConnection must be used within an AgentConnectionContext provider");
  }
  return context;
}

/** @typedef {import("#lib/audio/Mic.js").MeterCallback} MeterCallback */

/** 
   * @typedef {Object} AgentMicContext
   * @property {MicState} micState
   ** @property {(onToggle: (isOpen: boolean) => void, isRecording?: boolean) => Promise<void>} toggleMic
   * @property {(onMeter: MeterCallback) => void} setMicOnMeter
   * @property {(withRecording: boolean) => void} setWithDebugRecording
   * @property {function((state: RecorderState) => void): void} setOnRecorderStateChange
   * @property {(action: 'play' | 'stop')=> void} debugPlayback

/**
 * @returns {AgentMicContext}}{
 */
export function useAgentMic() {
  const context = useContext(AgentMicContext);

  if (!context) {
    throw new Error("useAgentMic must be used within an AgentMicContext provider");
  }
  return context;

}
