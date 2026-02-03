import {useContext, useEffect, useMemo, useRef, useState} from "react";
import { AgentConnectionContext, AgentResponseContext } from "../AgentContext";
import { AgentMessage } from "#lib/agent/agentMessages.js";
import { Mic, MicOff, AudioWaveform, X } from "lucide-react";
import { useAgentMic } from "../hooks/useAgent.js";
import AudioMeter from "#lib/audio/Meter.js";
import { toast } from "sonner";
import SimpleAgentConnect from "./SimpleAgentConnect";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeveloperMode } from "../hooks/useDeveloperMode";
import MusicSupervisorLogo from "./brand/MusicSupervisorLogo";
import SparkyConversation from "./brand/SparkyConversation";
import VoiceInfoPanel from "./voice/VoiceInfoPanel";
import sunglassesGif from "../assets/sparky/Smiley-Sunglasses.gif";
import { MusicResults } from "./music/MusicResults";

function Bubble({who, text}) {
  const isUser = who === "you";
  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-blue-50 text-blue-900 border border-blue-100" : "bg-white text-blue-900 border border-blue-100"}`}>
        {text}
      </div>
    </div>
  );
}

export default function ChatBox() {
  const { connection, sendText: sendTextFromCtx, selectedVoice } = useContext(AgentConnectionContext) || {};
  const { agentResponse } = useContext(AgentResponseContext) || {};
  const { micState, toggleMic, setMicOnMeter, resumePlayback } = useAgentMic();
  const isDeveloperMode = useDeveloperMode();

  const [message, setMessage] = useState("");
  const [log, setLog] = useState(() => []);
  const [mode, setMode] = useState("chat"); // "chat" or "conversation"
  const [audioActivity, setAudioActivity] = useState(0); // 0-1 scale for visual indicator
  const [musicResults, setMusicResults] = useState(null); // Music search results
  const [lastQuery, setLastQuery] = useState(""); // Last search query
  const listRef = useRef(null);
  const meter = useRef(null);
  const canvas = useRef(null);

  const canSend = connection?.status === "open";

  // Setup and start/stop meter when mic state changes
  useEffect(() => {
    if (micState.isOpen) {
      let retryCount = 0;
      const maxRetries = 10;
      
      // Wait for canvas to be available in the DOM
      const initMeter = () => {
        if (!canvas.current) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(initMeter, 50);
          } else {
            console.error('[ChatBox] Canvas failed to mount after', maxRetries, 'retries');
          }
          return;
        }

        // Check if canvas has valid dimensions
        const rect = canvas.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(initMeter, 50);
          } else {
            console.warn('[ChatBox] Canvas still has zero dimensions after retries, proceeding anyway');
            createMeter();
          }
          return;
        }

        createMeter();
      };

      const createMeter = () => {
        if (!meter.current) {
          meter.current = new AudioMeter(canvas.current, {
            clampBetween: { min: -60, max: 0 },
            smoothing: 0.8,
            fps: 30,
          });
          meter.current.start();
        } else {
          meter.current.start();
        }
        
        // CRITICAL: ALWAYS re-register callback when mic opens
        // This ensures audio data flows to the meter even when reusing an existing instance
        setMicOnMeter((level) => {
          // Update visual indicator - convert level (0-1) to activity scale
          setAudioActivity(level);
          
          // Also update canvas meter if in developer mode
          if (meter.current) {
            meter.current.update(level);
          }
        });
      };

      initMeter();
    } else {
      // Stop the meter when mic closes
      console.debug('[ChatBox] Stopping meter (mic closed)');
      meter.current?.stop();
      setAudioActivity(0); // Reset activity indicator
    }

    return () => {
      if (meter.current) {
        console.debug('[ChatBox] Cleanup: stopping meter');
        meter.current.stop();
      }
    };
  }, [micState.isOpen, setMicOnMeter]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [log]);

  useEffect(() => {
    if (!agentResponse) return;
    const msg = agentResponse.message;

    // Check if response contains music tracks (from webhook)
    if (msg?.rawMessage?.tracks) {
      console.log('[ChatBox] 🎵 Music results received:', msg.rawMessage.tracks);
      setMusicResults(msg.rawMessage.tracks);
      if (msg.rawMessage.query) {
        setLastQuery(msg.rawMessage.query);
      }
    }

    // Display agent responses
    if (msg?.type === "agent_response" && msg?.rawMessage?.agent_response) {
      const text = String(msg.rawMessage.agent_response);
      setLog((prev) => [...prev, { who: "agent", text }]);
    }

    // Display user transcripts
    if (msg?.type === "user_transcript" && msg?.rawMessage?.user_transcript) {
      const text = String(msg.rawMessage.user_transcript);
      setLog((prev) => [...prev, { who: "you", text }]);
      // Clear previous music results when user asks a new question
      setMusicResults(null);
    }
  }, [agentResponse]);

  const sendNow = useMemo(() => {
    if (typeof sendTextFromCtx === "function") return sendTextFromCtx;

    return async (text) => {
      try {
        connection?.agentConnRef?.current?.send(AgentMessage.userTextMessage(text));
        return true;
      } catch (e) {
        console.warn("No sendText available and no agentConnRef on connection.", e);
        return false;
      }
    };
  }, [sendTextFromCtx, connection]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    const text = message.trim();
    if (!text) return;

    // Optimistically add to log
    setLog((prev) => [...prev, { who: "you", text }]);
    setMessage("");

    // Send the message
    console.debug('[ChatBox] sendText:', text);
    const ok = await sendNow(text);
    if (!ok) {
      toast.error("Failed to send text", {
        description: "WebSocket connection may be closed",
      });
    }
  };

  const handleMicToggle = () => {
    console.log('[ChatBox] 🎤 handleMicToggle called', {
      currentMicState: micState.isOpen,
      mode,
    });
    
    // Resume playback on mic toggle (user gesture)
    resumePlayback().catch(() => {});
    toggleMic((isOpen) => {
      console.log('[ChatBox] Mic toggle callback, isOpen:', isOpen);
      isOpen ? meter.current?.start() : meter.current?.stop();
    });
  };

  const handleConversationModeToggle = () => {
    console.log('[ChatBox] 🔄 handleConversationModeToggle called', {
      currentMode: mode,
      micIsOpen: micState.isOpen,
    });
    
    if (mode === "chat") {
      // Entering conversation mode
      console.log('[ChatBox] Entering conversation mode');
      setMode("conversation");
      // Auto-start mic if not already open
      if (!micState.isOpen) {
        console.log('[ChatBox] Auto-starting mic for conversation mode');
        // First ensure audio playback is allowed (user gesture)
        resumePlayback().catch(() => {});
        toggleMic((isOpen) => {
          console.log('[ChatBox] Auto-start mic callback, isOpen:', isOpen);
          if (isOpen) meter.current?.start();
        });
      }
    } else {
      // Exiting conversation mode
      setMode("chat");
      // Stop mic when leaving conversation mode
      if (micState.isOpen) {
        toggleMic((isOpen) => {
          if (!isOpen) meter.current?.stop();
        });
      }
    }
  };

  // Connection status indicator component
  const getConnectionStatus = () => {
    const status = connection?.status || "disconnected";
    
    if (status === "open") {
      return {
        color: "bg-green-500",
        label: "Connected",
        ring: "ring-green-500/20"
      };
    } else if (status === "connecting") {
      return {
        color: "bg-yellow-500",
        label: "Connecting",
        ring: "ring-yellow-500/20"
      };
    } else {
      return {
        color: "bg-red-500",
        label: "Disconnected",
        ring: "ring-red-500/20"
      };
    }
  };

  const statusInfo = getConnectionStatus();

  // Determine Sparky state for conversation mode
  const getSparkyState = () => {
    if (micState.isOpen) return 'listening';
    // TODO: Add speaking state when audio player state is available
    // if (audioPlayer?.isPlaying) return 'speaking';
    return 'idle';
  };

  // Conversation Mode UI
  if (mode === "conversation") {
    return (
      <div className="w-full h-full flex flex-col bg-white">
        {/* Header - Walmart-inspired design */}
        <header className="relative bg-[#0053E2] shadow-md">
          <div className="mx-auto max-w-screen-2xl h-16 px-6 flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-12">
              <MusicSupervisorLogo />
              <div className="relative">
                <SimpleAgentConnect />
                {/* Connection status indicator - positioned in front of connect panel */}
                <div className="absolute -top-2 -right-2 flex items-center gap-2 group">
                  <span className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {statusInfo.label}
                  </span>
                  <div className={`w-3 h-3 rounded-full ${statusInfo.color} ring-4 ring-white/20`} />
                </div>
              </div>
            </div>

            {/* Right side: empty for now, debug menu will be here */}
            <div className="flex flex-col items-end gap-2">
            </div>
          </div>
        </header>

        {/* Voice info panel - positioned on far left */}
        <div className="fixed left-6 top-[88px] hidden lg:block" style={{ width: '280px' }}>
          <VoiceInfoPanel voiceId={selectedVoice?.name} headerOffset={88} />
        </div>

        {/* Central area for conversation mode */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-8">
          {/* Sparky conversation state indicator */}
          <SparkyConversation state={getSparkyState()} />

          {/* Voice name display */}
          <div className="text-blue-700 font-medium text-lg">
            {(() => {
              const displayName = selectedVoice?.name || "Default Voice";
              console.debug("[ChatBox] 📍 Conversation Mode Voice", { 
                place: "Conversation Mode Title", 
                voiceId: selectedVoice?.id, 
                displayName 
              });
              return displayName;
            })()}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    className={`p-4 rounded-full ${micState.isOpen ? "bg-red-500 text-white" : "bg-blue-100 text-blue-700"} hover:opacity-80 transition-opacity`}
                    aria-label={micState.isOpen ? "Stop microphone" : "Start microphone"}
                  >
                    {micState.isOpen ? <Mic size={24} /> : <MicOff size={24} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="">
                  <p>{micState.isOpen ? "Stop microphone" : "Start microphone"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleConversationModeToggle}
                    className="p-4 rounded-full bg-blue-100 text-blue-700 hover:opacity-80 transition-opacity"
                    aria-label="Exit conversation mode"
                  >
                    <X size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="">
                  <p>Exit conversation mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat Mode UI (default)
  return (
    <div className="w-full h-full flex flex-col bg-white relative">
      {/* Header - Walmart-inspired design */}
      <header className="relative bg-[#0053E2] shadow-md">
        <div className="mx-auto max-w-screen-2xl h-16 px-6 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-12">
            <SparkyLogo />
            <div className="relative">
              <SimpleAgentConnect />
              {/* Connection status indicator - positioned in front of connect panel */}
              <div className="absolute -top-2 -right-2 flex items-center gap-2 group">
                <span className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {statusInfo.label}
                </span>
                <div className={`w-3 h-3 rounded-full ${statusInfo.color} ring-4 ring-white/20`} />
              </div>
            </div>
          </div>

          {/* Right side: empty for now, debug menu will be here */}
          <div className="flex flex-col items-end gap-2">
          </div>
        </div>
      </header>

      {/* Helper message below header */}
      <div className="px-6 pt-2 pb-1">
        <div className="mx-auto max-w-screen-2xl flex justify-center">
          <span 
            className="text-xs text-blue-600 italic h-[18px]"
            style={{ visibility: connection?.status === "open" ? 'visible' : 'hidden' }}
          >
            Disconnect to change voice
          </span>
        </div>
      </div>

      {/* Audio activity indicator popup (only in chat mode) */}
      {micState.isOpen && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-white px-6 py-4 rounded-full shadow-lg border border-blue-200 flex items-center gap-4 z-50">
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full bg-red-500 transition-all duration-75"
              style={{ 
                opacity: 0.3 + (audioActivity * 0.7),
                transform: `scale(${1 + (audioActivity * 0.5)})`,
                boxShadow: audioActivity > 0.3 ? `0 0 ${10 + (audioActivity * 20)}px rgba(239, 68, 68, ${audioActivity * 0.8})` : 'none'
              }}
            />
            <span className="text-sm text-gray-700 font-medium">Recording</span>
          </div>
          {/* Audio level bars */}
          <div className="flex items-center gap-1 h-5">
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold, i) => (
              <div 
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  audioActivity >= threshold ? 'bg-blue-500' : 'bg-gray-200'
                }`}
                style={{ height: `${(i + 1) * 20}%` }}
              />
            ))}
          </div>
          
          {/* Canvas meter - only shown in developer mode */}
          {isDeveloperMode && (
            <div className="bg-blue-50 p-2 rounded-md ml-2">
              <canvas ref={canvas} width={150} height={30} className="w-[150px] h-[30px]" />
            </div>
          )}
        </div>
      )}

      {/* Voice info panel - positioned on far left */}
      <div className="fixed left-6 top-[88px] hidden lg:block" style={{ width: '280px' }}>
        <VoiceInfoPanel voiceId={selectedVoice?.name} headerOffset={88} />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {log.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              {!selectedVoice?.id && (
                <>
                  <img 
                    src={sunglassesGif} 
                    alt="Sparky with sunglasses" 
                    width={360}
                    height={360}
                    className="block pointer-events-none select-none object-contain"
                  />
                  <p className="text-4xl font-bold text-blue-600">Let's choose my voice!</p>
                </>
              )}
            </div>
          ) : (
            <div>
              {log.map((m, i) => <Bubble key={i} who={m.who} text={m.text} />)}
              
              {/* Show music results if available */}
              {musicResults && (
                <div className="mt-6">
                  <MusicResults tracks={musicResults} query={lastQuery} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-8 py-6">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {!canSend ? (
            <div className="relative flex items-center bg-blue-50 border border-blue-200 rounded-full shadow-sm">
              <div className="flex-1 py-4 px-6 text-center text-blue-500 text-sm font-bold">
                Select a Voice and Connect to Start Chatting!
              </div>
            </div>
          ) : (
            <div className="relative flex items-center bg-white border border-blue-200 rounded-full shadow-sm hover:shadow-md transition-shadow">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything"
                className="flex-1 py-4 px-6 bg-transparent border-none outline-none text-[#0053E2] placeholder-blue-400"
              />

              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button" 
                      className="pr-4 pl-2 text-blue-600 hover:text-blue-800"
                      onClick={handleConversationModeToggle}
                      aria-label="Conversation mode"
                    >
                      <AudioWaveform size={20} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="">
                    <p>Conversation mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
