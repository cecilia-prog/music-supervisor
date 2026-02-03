import { createContext, useState, useRef, useEffect } from "react";
import useApi from "./hooks/useApi.js";
import { toast } from "sonner";
import { AgentConn, AgentError } from "#lib/agent/Agent.js";
import AgentConnInitOptions from "#lib/agent/AgentConnInitOptions.js";
import { AgentMessage, AgentActions } from "#lib/agent/agentMessages.js";
import Mic from "#lib/audio/Mic.js";
import Conversation from "#lib/agent/Conversation.js";

/** @typedef {import("#lib/agent/Agent.js").ConnectionStatus} ConnectionStatus */
/** @typedef {import('#lib/agent/Conversation.js').ConversationState} ConversationState */

/** @typedef {import('#lib/audio/AudioRecorder.js').RecorderState} RecorderState */

/** @typedef {Object} AgentResponseState
 * @property {import ('#lib/agent/Agent.js').AgentCallbackEventType} type
 * @property {AgentMessage} message
 **/

/** @typedef {Object} ConnectionState
 * @property {ConnectionStatus} status
 * @property {boolean} isLoading
 * @property {string | null} selectedAgentId
 */

/** @typedef {AgentError} AgentErrorState */

/** @typedef {(agentId: string, options: AgentConnInitOptions) => Promise<Boolean>} SelectAgentFunction

/** @typedef {Object} MicState
 * @property {boolean} isOpen
 * @property {boolean} isTransmitting
 * @property {boolean} withDebugRecording
 * @property {number} volume
 **/

/** @typedef {Object} AgentMicContext
 * @property {MicState} micState
 * @property {function(function(boolean): void=): Promise<void>} toggleMic
 * @property {function(import('#lib/audio/Mic.js').MeterCallback): void} setMicOnMeter
 * @property {function(boolean): void} setWithDebugRecording
 * @property {function(function(import('#lib/audio/AudioRecorder.js').RecorderState): void): void} setOnRecorderStateChange
 * @property {function(string): void} debugPlayback
 * @property {function(): Promise<void>} resumePlayback
 * @property {boolean} interruptionEnabled
 * @property {function(boolean): void} setInterruptionEnabled
 **/

/**
 * State setter
 * @typedef {React.Dispatch<React.SetStateAction<AgentResponseState | null>>} AgentResponseSetter
 * @typedef {React.Dispatch<React.SetStateAction<AgentErrorState | null>>} AgentErrorSetter
 * @typedef {React.Dispatch<React.SetStateAction<ConversationState | null>>} ConversationStateSetter
 * @typedef {React.Dispatch<React.SetStateAction<ConnectionStatus>>} ConectionStatusSetter
 * @typedef {React.Dispatch<React.SetStateAction<string>>} SelectedAgentIdSetter
 * @typedef {React.Dispatch<React.SetStateAction<boolean>>} IsLoadingSetter
 * @typedef {React.Dispatch<React.SetStateAction<MicState>>} MicStateSetter
 * */

export const AgentConnectionContext = createContext(null);
export const AgentResponseContext = createContext(null);
export const AgentMicContext = createContext(null);

export function AgentProvider({ children }) {
  /** @type {React.RefObject<AgentConn | null>} */
  const agentConnRef = useRef(null);

  /** @type {React.RefObject<Mic>} */
  const micRef = useRef(new Mic({ sampleRate: 16000 }));

  /** @type {React.RefObject<Conversation | null>} */
  const conversationRef = useRef(null);

  const { request, loading } = useApi();

  /** Connection States **/
  /** @type {[ConnectionStatus, ConectionStatusSetter]} */
  const [connectionStatus, setConnectionStatus] = useState(/** @type{ConnectionStatus}*/ ("closed"));
  /** @type {[string | null, SelectedAgentIdSetter]} */
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  /** @type {[boolean, IsLoadingSetter]} */
  const [isLoading, setIsLoading] = useState(false);

  /** Response States **/
  /** @type {[AgentResponseState | null, AgentResponseSetter ]} */
  const [agentResponse, setAgentResponse] = useState(null);

  //** Conversation State **/
  /** @type {[ConversationState | null, ConversationStateSetter]} */
  const [conversationState, setConversationState] = useState(Conversation.waitingOnMetaState());

  /** @type {[AgentErrorState | null, AgentErrorSetter]} */
  const [agentError, setAgentError] = useState(null);

  /** Mic States **/
  /** @type {[MicState, MicStateSetter]} */
  const [micState, setMicState] = useState(
    /** @type {MicState} */ ({
      isOpen: false,
      isTransmitting: false,
      withDebugRecording: false,
      volume: 0,
    }),
  );

  /** Voice Selection State **/
  /** @type {[{id: string, name: string} | null, React.Dispatch<React.SetStateAction<{id: string, name: string} | null>>]} */
  const [selectedVoice, setSelectedVoice] = useState(null);

  /** Interruption/Barge-in State **/
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [interruptionEnabled, setInterruptionEnabled] = useState(true); // Enabled by default

  // Debug log voice state changes
  useEffect(() => {
    console.debug("[AgentContext] 🎤 Voice State Changed", {
      place: "AgentContext",
      voiceId: selectedVoice?.id,
      displayName: selectedVoice?.name
    });
  }, [selectedVoice]);

  /** this effect handles the websocket connection state to inform the UI **/
  useEffect(() => {
    const shouldSetLoading = loading || connectionStatus === "connecting";
    if (shouldSetLoading !== isLoading) setIsLoading(shouldSetLoading);
  }, [loading, connectionStatus]);

  /** Clean Up **/
  useEffect(() => {
    return () => {
      agentConnRef.current?.cleanup();
      micRef.current?.close();
    };
  }, []);

  //
  /**  Instantiates a Conversation based on an `conversation_initiation_metadata` AgentMessage response.
   * @param {AgentMessage} agentMessage */
  const initConversation = (agentMessage) => {
    const convOrErr = Conversation.fromAgentMetaInfoMessage(agentMessage);

    if (convOrErr instanceof Conversation) {
      conversationRef.current = convOrErr;
      return setConversationState(convOrErr.toState());
    }

    const errState = Conversation.errorState(convOrErr);
    setConversationState(errState);
  };

  /** Handles incoming AgentMessages and responds accordingly
   * @param {AgentMessage} agentMessage */
  const handleConversation = (agentMessage) => {
    // Auto-resume audio context when agent starts sending audio
    // This handles cases where user gesture happened but context is still suspended
    if (agentMessage.action === AgentActions.LOAD_AUDIO) {
      resumePlayback().catch(() => {
        // Silently fail - user will see toast if resume fails
      });
    }
    
    conversationRef.current?.handle(agentMessage, (resp) => {
      agentConnRef.current?.send(resp);
    });
  };

  /**  AgentConn callbacks with incoming messages, errors and close events.
   * @type {import("#lib/agent/Agent.js").AgentCallback} */
  const agentConnCallback = (type, data) => {
    if (type === "error") {
      console.error('[AgentContext.agentConnCallback] Error received:', data);
      setAgentError(/** @type {AgentError} */ (data));
      return;
    }

    const agentMessage = /** @type {AgentMessage} */ (data);

    if (agentMessage.action === AgentActions.INIT_CONVERSATION) initConversation(agentMessage);
    else handleConversation(agentMessage);

    setAgentResponse({ type, message: agentMessage });
  };

  /** Handles AgentConn connection status changes to update the state in this context accordingly
   * @param {ConnectionStatus} newState
   * */
  const onStatusChange = (newState) => {
    setConnectionStatus(newState);
  };

  /**  Establishes the WebSocket connection to the Eleven Labs Agent
   * @param {string} signedUrl
   * @param {AgentConnInitOptions} options
   **/
  const connectAgent = (signedUrl, options) => {
    if (agentConnRef.current) {
      disconnectAgent();
    }

    agentConnRef.current = new AgentConn(signedUrl, {
      agentConnInitOptions: options,
      callback: agentConnCallback,
    });

    agentConnRef.current.onStatusChange(onStatusChange);
  };

  /**  Disconnects the current agent connection and reloads the AgentConn instance. */
  const disconnectAgent = () => {
    console.debug("[AgentContext] 🔌 Disconnecting", {
      place: "disconnectAgent",
      voiceId: selectedVoice?.id,
      displayName: selectedVoice?.name,
      note: "Voice state preserved after disconnect"
    });
    setConnectionStatus("closing");
    const conn = agentConnRef.current;
    if (!conn) return;

    conn.close();
    agentConnRef.current = null;
  };

  /** Get the current selected voice */
  const getSelectedVoice = () => {
    return selectedVoice;
  };

  /**  Selects an agent, generates a signed URL and establishes a WebSocket connection.
   * This the main function exposed by this context to allow components to select an agent.
   * @type {SelectAgentFunction} */
  const selectAgent = async (agentId, options) => {
    if (!agentId) return;

    console.debug("[AgentContext] 🔗 Connecting with Voice", {
      place: "selectAgent",
      voiceId: selectedVoice?.id,
      displayName: selectedVoice?.name,
      optionsVoiceId: options?.voiceId
    });

    setIsLoading(true);

    if (agentConnRef.current) {
      await agentConnRef.current.cleanup();
      agentConnRef.current = null;
    }

    setConnectionStatus("connecting");

    const resp = await request("/api/conversational/signedUrl", {
      method: "POST",
      body: { agentId: agentId },
    });

    if (!resp || !resp.success) {
      console.error('[AgentContext.selectAgent] Failed to get signed URL:', resp);
      toast.error("Error fetching signed URL", {
        description: resp?.error || "Unknown error",
      });

      setSelectedAgentId(null);
      return;
    }
    
    // Validate the signed URL
    if (!resp.data || !resp.data.signedUrl) {
      console.error('[AgentContext.selectAgent] Invalid response - missing signedUrl:', resp.data);
      toast.error("Invalid signed URL", {
        description: "The signed URL is missing from the response",
      });
      setSelectedAgentId(null);
      setIsLoading(false);
      return;
    }
    
    setSelectedAgentId(agentId);
    connectAgent(resp.data.signedUrl, options);

    setIsLoading(false);
    return;
  };

  /**
   * Voice Activity Detection state for interruption
   * Tracks RMS levels to detect when user starts speaking
   */
  const vadStateRef = useRef({
    consecutiveHighSamples: 0,
    threshold: 0.02, // RMS level threshold for speech detection
    requiredSamples: 3, // Number of consecutive high samples to trigger
    lastInterruptTime: 0,
    cooldownMs: 1000, // Prevent rapid re-interruptions
  });

  /**
   * Interrupt agent playback when user starts speaking
   * Called when voice activity is detected above threshold
   */
  const interruptAgent = () => {
    if (!conversationRef?.current) return;
    
    const now = Date.now();
    const { lastInterruptTime, cooldownMs } = vadStateRef.current;
    
    // Cooldown to prevent rapid re-interruptions
    if (now - lastInterruptTime < cooldownMs) {
      return;
    }
    
    // Only interrupt if agent is currently speaking (receiving audio)
    if (conversationState.receiveStatus === "receiving" || 
        conversationState.playerState?.isPlaying) {
      conversationRef.current.interrupt();
      vadStateRef.current.lastInterruptTime = now;
    }
  };

  /**
   * Monitor microphone RMS levels for voice activity detection
   * @param {number} level - RMS level (0.0 to 1.0)
   */
  const onVoiceActivity = (level) => {
    // Skip VAD if interruption is disabled
    if (!interruptionEnabled) return;
    
    const vadState = vadStateRef.current;
    
    if (level > vadState.threshold) {
      vadState.consecutiveHighSamples++;
      
      // Trigger interruption if threshold reached
      if (vadState.consecutiveHighSamples >= vadState.requiredSamples) {
        interruptAgent();
        // Reset to prevent continuous triggering
        vadState.consecutiveHighSamples = 0;
      }
    } else {
      // Reset counter if level drops below threshold
      vadState.consecutiveHighSamples = 0;
    }
  };

  /**  Handles sending audio data chunks to eleven labs agent via AgentConn.
   * We only send audio data when  Conversation.TransmissionStatus is `ready` or `sending`.
   * @param {String} audioData */
  const onMicAudioData = (audioData) => {
    if (conversationState.sendStatus === "pendingMeta") return;
    if (conversationState.sendStatus === "error") return;

    // we toggle mic off if there is an agent error so user is forced to re-initiate
    if (agentError) return toggleMic();

    if (connectionStatus !== "open") return toggleMic();

    if (conversationState?.sendStatus === "ready") {
      conversationRef?.current.updateSendStatus("sending");
      setConversationState((prev) => ({ ...prev, sendStatus: "sending" }));
    }

    agentConnRef?.current.send(AgentMessage.userAudioChunk(audioData));
  };

  /**
   * Toggle microphone open/close
   * @param {function(boolean): void} [onToggle] - Optional callback when mic
   * @returns {Promise<void>}
   **/
  const toggleMic = async (onToggle) => {
    console.log('[AgentContext] 🎤 toggleMic called', {
      currentState: micState.isOpen,
      hasRef: !!micRef.current,
      connectionStatus,
      conversationSendStatus: conversationState?.sendStatus,
    });

    if (!micRef.current) {
      console.error('[AgentContext] ❌ No mic ref available');
      return;
    }

    onToggle?.(!micState.isOpen);

    if (micState.isOpen && conversationState.sendStatus === "sending") {
      console.log('[AgentContext] Setting conversation status to ready');
      setConversationState((prev) => ({ ...prev, sendStatus: "ready" }));
      conversationRef?.current.updateSendStatus("ready");
    }

    if (micState.isOpen) {
      console.log('[AgentContext] 🔇 Closing microphone');
      micRef.current.close();
    } else {
      // Always open mic in streaming mode
      // ElevenLabs agent expects continuous audio streaming, not batched chunks
      console.log('[AgentContext] 🔊 Opening microphone in streaming mode...');
      try {
        await micRef.current.open(onMicAudioData);
        console.log('[AgentContext] ✅ Microphone opened successfully');
      } catch (err) {
        console.error('[AgentContext] ❌ Failed to open microphone:', err);
        console.error('[AgentContext] Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
        toast.error('Unable to access microphone. Please check permissions and try again.');
        // Ensure UI reflects closed mic
        setMicState((prev) => ({ ...prev, isOpen: false }));
        return;
      }
    }

    console.log('[AgentContext] Setting mic state to:', !micState.isOpen);
    setMicState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  };


  /**   Allow to set a meter callback to receive volume RMS levels.
   * @param {import('#lib/audio/Mic.js').MeterCallback} onMeter */
  const setMicOnMeter = (onMeter) => {
    if (!micRef.current) return;
    
    // Chain the callbacks: call both VAD and visualization meter
    const chainedCallback = (level) => {
      onVoiceActivity(level); // Check for interruption
      onMeter(level); // Update visualization
    };
    
    micRef.current.setOnMeter(chainedCallback);
  };

  /**  Sets whether to record microphone input for debugging purposes.
   * Consumed by `DebugRecordingCheckbox` component.
   * @param {boolean} withRecording */
  const setWithDebugRecording = (withRecording) => {
    if (!micRef.current) return;
    micRef.current.withRecording = withRecording;
    setMicState((prev) => ({ ...prev, withDebugRecording: withRecording }));
  };

  /**  When debug recording is enabled, allows to set a callback to receive recorder state changes.
   * @param {function(RecorderState): void} callback */
  const setOnRecorderStateChange = (callback) => {
    if (!micRef.current) return;
    micRef.current.setOnRecorderStateChange(callback);
  };

  /**  When debug recording is enabled, allows to play or stop the recorded audio.
   * @param {'play' | 'stop'} action */
  const debugPlayback = (action = "play") => {
    if (!micRef.current) return;
    if (action === "play") micRef.current.recorder.playback();
    else micRef.current.recorder.cancelPlayback();
  };

  /**
   * Resume playback audio context if suspended.
   * Useful to call from a user gesture (conversation entry / click) to satisfy browser autoplay policies.
   */
  const resumePlayback = async () => {
    try {
      const audioPlayer = conversationRef.current?.audioPlayer;
      const ac = audioPlayer?.audioContext;
      if (ac && ac.state === "suspended") {
        console.log('[AgentContext] 🔊 Attempting to resume suspended AudioContext...');
        await ac.resume();
        console.log('[AgentContext] ✅ AudioContext resumed successfully, state:', ac.state);
        
        // Show success toast for first-time users
        toast.success('Audio enabled! You should be able to hear Sparky now.', {
          duration: 3000,
        });
        return true;
      } else if (ac) {
        console.log('[AgentContext] AudioContext already running, state:', ac.state);
        return true;
      }
      // No audio context yet - conversation not initialized
      // This is normal on first load, we'll try again when audio arrives
      console.log('[AgentContext] No AudioContext yet (conversation not initialized)');
      return false;
    } catch (err) {
      console.error('[AgentContext] resumePlayback failed:', err);
      toast.error('Unable to resume audio. Please try clicking the microphone button.', {
        duration: 5000,
      });
      return false;
    }
  };

  /**
   * Send a text message to the agent
   * @param {string} text - The text message to send
   * @returns {Promise<boolean>} - Whether the message was sent successfully
   */
  const sendText = async (text) => {
    if (!text || !text.trim()) {
      console.warn('[AgentContext.sendText] Empty text, not sending');
      return false;
    }

    // Check if WebSocket is open (don't require mic)
    if (connectionStatus !== "open") {
      console.warn('[AgentContext.sendText] Connection not open, cannot send text');
      toast.error("Agent not connected", {
        description: "Please connect to an agent first",
      });
      return false;
    }

    // Check if agent connection exists
    if (!agentConnRef?.current) {
      console.error('[AgentContext.sendText] AgentConn ref is null');
      return false;
    }

    // If conversation is pending metadata, send user activity first
    if (conversationState?.sendStatus === "pendingMeta") {
      agentConnRef.current.send(AgentMessage.userActivity());
      // Tiny delay to let server register the activity
      await new Promise(resolve => setTimeout(resolve, 10));
      // Update conversation state
      conversationRef?.current?.updateSendStatus("ready");
      setConversationState((prev) => ({ ...prev, sendStatus: "ready" }));
    }

    // Send the text message with client event ID
    const clientEventId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    agentConnRef.current.send(AgentMessage.userTextMessage(text, { clientEventId }));
    
    return true;
  };

  const connState = /** @type {ConnectionState}*/ {
    status: connectionStatus,
    isLoading: isLoading,
    selectedAgentId: selectedAgentId,
  };

  /** @type {Object}
   * @property {ConnectionState} conectionState
   * @property {SelectAgentFunction} selectAgent
   * @property {function(): void}
   * */
  const connectionStates = {
    connection: connState,
    selectAgent,
    disconnectAgent,
    sendText,
    selectedVoice,
    setSelectedVoice,
    getSelectedVoice,
  };

  /** @type {Object}
   * @property {AgentResponseState | null}
   * @property {AgentErrorState | null}
   * @property {ConversationState | null} conversationState
   * */
  const responseStates = {
    agentResponse: agentResponse,
    agentError: agentError,
    conversationState: conversationState,
  };

  /** @type {Object}
   * @property {MicState} mic
   * @property {function(MicState): void} setMicState
   */
  const micStates = {
    micState: micState,
    toggleMic,
    setMicOnMeter,
    setWithDebugRecording,
    setOnRecorderStateChange,
    debugPlayback,
    resumePlayback,
    interruptionEnabled,
    setInterruptionEnabled,
  };

  return (
    <AgentConnectionContext.Provider value={connectionStates}>
      <AgentResponseContext.Provider value={responseStates}>
        <AgentMicContext.Provider value={micStates}>{children}</AgentMicContext.Provider>
      </AgentResponseContext.Provider>
    </AgentConnectionContext.Provider>
  );
}
