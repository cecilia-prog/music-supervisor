//@ts-check
import { AgentConn } from "#lib/agent/Agent.js";
import AgentConnInitOptions from "#lib/agent/AgentConnInitOptions.js";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAgentConnection, useAgentResponse } from "../../hooks/useAgent.js";
import { formatCamelCase } from "#lib/utils.js";

import FetchSelect from "../FetchSelect.jsx";
import AgentOptions from "../AgentOptions.jsx";

import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { RefreshCw, Unplug, Zap, Clock } from "lucide-react";

/** @typedef {'llm' | 'voiceId' | 'agent'} SaveOption */
/** @typedef {React.Dispatch<React.SetStateAction<AgentConnInitOptions>>} AgentInitOptionsSetter */
/** @typedef {import("#lib/agent/Agent.js").ConnectionStatus} ConnectionStatus */

const defaultOptions = AgentConn.AgentConnOptions()
  .withVoice("SAz9YHcvj6GT2YYXdXww") // default river for now
  .withAgent({ firstMessage: "Hi! I'm Sparky. Let's decide my voice together! How can I help you today?" })

  .withLLM({ temperature: 0.7 });

export default function DebugAgentManager() {
  const { agentResponse, agentError, conversationState } = useAgentResponse();

  /** @type {[AgentConnInitOptions, AgentInitOptionsSetter]} */
  const [agentOptions, setAgentOptions] = useState(defaultOptions);

  const { connection, selectAgent, disconnectAgent } = useAgentConnection();

  const handleAgentChange = (/** @type {string} */ agentId) => {
    console.debug("[DebugAgentManager] Selecting agent:", agentId);
    selectAgent(agentId, agentOptions).then(success => {
      console.debug("[DebugAgentManager] Agent selection result:", success);
    }).catch(err => {
      console.error("[DebugAgentManager] Agent selection error:", err);
    });
  };

  const reloadConnection = () => {
    if (!connection.selectedAgentId) {
      toast.error("No agent selected to reload connection. Please select an agent first.");
      return;
    }

    selectAgent(connection.selectedAgentId, agentOptions);
  };

  /** @param {SaveOption} optionName
   * @param {Object} option
   * */
  const onSaveOptions = (optionName, option) => {
    if (optionName === "llm") setAgentOptions((prev) => prev.withLLM(option));
    if (optionName === "voiceId") setAgentOptions((prev) => prev.withVoice(option));
    if (optionName === "agent") setAgentOptions((prev) => prev.withAgent(option));

    toast.success(`Saved ${optionName} options.`);
  };

  useEffect(() => {
    // todo // agent has a response
    //  console.log("Agent Response Updated:", agentResponse);
  }, [agentResponse]);

  useEffect(() => {
    // todo // agent has a response
    //   console.log("Conversation State Updated:", conversationState);
  }, [conversationState]);

  useEffect(() => {
    if (agentError) {
      toast.error(`Agent Error: ${agentError.message}`);
      console.log("Agent Error:", agentError);
    }
  }, [agentError]);

  const getConnStatusColor = () => {
    switch (connection.status) {
      case "open":
        return "bg-emerald-700 text-white";
      case "connecting":
        return "bg-amber-500 text-white";
      case "closing":
        return "bg-indigo-700 text-white";
      case "closed":
        return "bg-neutral-700 text-white";
      case "error":
        return "bg-rose-700 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getConvStatusColor = () => {
    switch (conversationState.sendStatus) {
      case "pendingMeta":
        return "bg-gray-400 text-white";
      case "ready":
        return "bg-cyan-700 text-white";
      case "sending":
        return "bg-amber-500 text-white";
      case "receiving":
        return "bg-indigo-500 text-white";
      case "error":
        return "bg-rose-700 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const conectButtonLabel = () => {
    if (connection.isLoading || connection.status === "connecting") return "Connecting";
    if (connection.status === "closed") return "Connect";
    if (connection.status === "error") return "Reconnect";
    if (connection.status === "open") return "Disconnect";
    return "Closing...";
  };

  const connectbuttonIcon = () => {
    if (connection.status === "closed") return <Zap />;
    if (connection.status === "error") return <RefreshCw />;
    if (connection.status === "open") return <Unplug />;
    else return <Clock />;
  };

  const disableConnectButton = () => {
    return (
      !connection.selectedAgentId ||
      connection.isLoading ||
      connection.status === "closing" ||
      connection.status === "connecting"
    );
  };

  const onClickConnectButton = () => {
    if (connection.status === "open") return disconnectAgent();
    if (connection.status === "closed" || connection.status === "error") {
      return reloadConnection();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-[690px]">
      <div className="grid grid-cols-5 gap-x-6 gap-y-2">
        <div className="text-xs text-gray-400 col-span-2">Agent Selection</div>
        <div className="text-xs text-gray-400">WS Connection</div>
        <div className="text-xs text-gray-400">Send Status</div>
        <div className="text-xs text-gray-400">Receive Status</div>

        <div className="col-span-2">
          <FetchSelect
            url="/api/conversational/agents"
            onChange={handleAgentChange}
            name="Agent"
            disabled={connection.isLoading}
          />
        </div>

        <div className="flex gap-2">
          <Badge variant="secondary" className={"h-4" + " " + getConnStatusColor()}>
            {formatCamelCase(connection.status)}
          </Badge>
        </div>

        <Badge variant="secondary" className={"h-4" + " " + getConvStatusColor()}>
          {formatCamelCase(conversationState.sendStatus)}
        </Badge>

        <Badge variant="secondary" className={"h-4" + " " + getConvStatusColor()}>
          {formatCamelCase(conversationState.receiveStatus)}
        </Badge>

        <AgentOptions options={agentOptions} onSave={onSaveOptions} />
        <div className="flex items-end -ml-2">
          <Button
            className=""
            size="default"
            variant="default"
            onClick={onClickConnectButton}
            disabled={disableConnectButton()}
          >
            {connectbuttonIcon()}
            {conectButtonLabel()}
          </Button>
        </div>
      </div>
    </div>
  );
}
