import { Button } from "@/components/ui/button";
import { Zap, Loader2, Unplug } from "lucide-react";
import VoiceSelector from "./VoiceSelector";
import { useAgentConnection } from "../hooks/useAgent";
import { AgentConn } from "#lib/agent/Agent.js";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Bob's agent ID (hardcoded)
const BOB_AGENT_ID = "agent_3201k95g6mmwftmt77vy07y8h8aq";

/**
 * Simplified agent connection interface for end users
 * Shows only voice selector and connect/disconnect button
 */
export default function SimpleAgentConnect() {
  const { connection, selectAgent, disconnectAgent, selectedVoice, setSelectedVoice } = useAgentConnection();

  console.debug("[SimpleAgentConnect] 📍 Render", { 
    place: "SimpleAgentConnect", 
    voiceId: selectedVoice?.id, 
    displayName: selectedVoice?.name 
  });

  const isConnected = connection?.status === "open";
  const isConnecting = connection?.status === "connecting" || connection?.isLoading;

  const handleVoiceChange = (voiceId, voiceName) => {
    console.debug("[SimpleAgentConnect] 🔄 Voice Changed", { 
      place: "handleVoiceChange", 
      voiceId, 
      displayName: voiceName 
    });
    setSelectedVoice({ id: voiceId, name: voiceName });
  };

  const handleConnect = async () => {
    console.debug("[SimpleAgentConnect] Connect clicked", {
      agentId: BOB_AGENT_ID,
      voiceId: selectedVoice?.id,
      voiceName: selectedVoice?.name
    });

    if (!selectedVoice?.id) {
      console.error("[SimpleAgentConnect] No voice selected");
      toast.error("Please select a voice before connecting");
      return;
    }

    // Create agent options with selected voice
    const options = AgentConn.AgentConnOptions()
      .withVoice(selectedVoice.id)
      .withAgent({ firstMessage: "Hi! I'm Sparky. Let's decide my voice together! How can I help you today?" })
      .withLLM({ temperature: 0.7 });

    console.debug("[SimpleAgentConnect] Options created:", options);

    try {
      await selectAgent(BOB_AGENT_ID, options);
      console.log("[SimpleAgentConnect] Connection successful");
    } catch (err) {
      console.error("[SimpleAgentConnect] Connection error:", err);
      toast.error("Failed to connect to agent");
    }
  };

  const handleDisconnect = () => {
    disconnectAgent();
  };

  const handleToggle = () => {
    console.debug("[SimpleAgentConnect] Button toggled", {
      isConnected,
      isConnecting,
      agentId: BOB_AGENT_ID
    });
    
    if (isConnected) {
      handleDisconnect();
    } else {
      handleConnect();
    }
  };

  const getButtonLabel = () => {
    if (isConnecting) return "Connecting...";
    if (isConnected) return "Disconnect";
    return "Connect";
  };

  const getButtonIcon = () => {
    if (isConnecting) return <Loader2 className="animate-spin" size={16} />;
    if (isConnected) return <Unplug size={16} />;
    return <Zap size={16} />;
  };

  const isButtonDisabled = isConnecting || !selectedVoice?.id;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <VoiceSelector
                value={selectedVoice?.id || ""}
                onChange={handleVoiceChange}
                disabled={isConnected || isConnecting}
              />
            </div>
          </TooltipTrigger>
          {(isConnected || isConnecting) && (
            <TooltipContent className="">
              <p>Disconnect to change voice</p>
            </TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                onClick={handleToggle}
                disabled={isButtonDisabled}
                variant={isConnected ? "destructive" : "default"}
                size="default"
                className={`gap-2 rounded-full font-semibold shadow-sm ${
                  isConnected 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-[#FFC220] hover:bg-[#f0b500] text-gray-900'
                }`}
              >
                {getButtonIcon()}
                {getButtonLabel()}
              </Button>
            </span>
          </TooltipTrigger>
          {isConnected ? (
            <TooltipContent className="">
              <p>Disconnect to change voice</p>
            </TooltipContent>
          ) : !selectedVoice?.id ? (
            <TooltipContent className="">
              <p>Select a voice to connect</p>
            </TooltipContent>
          ) : null}
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
