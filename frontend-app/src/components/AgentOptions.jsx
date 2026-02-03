/** @typedef {import('#lib/agent/AgentConnInitOptions.js').AgentInitOptions} AgentOptions */
/** @typedef {import('#lib/agent/AgentConnInitOptions.js').LLMInitOptions} LLMOptions */

import FetchSelect from "./FetchSelect";
import AgentOptionsPopover from "./AgentOptionsPopover.jsx";
import AgentConnInitOptions from "#lib/agent/AgentConnInitOptions.js";

const COLLECTION_ID = "nDshWbfFJOnlqhmXDAfM";

/** @typedef {import('./debug/DebugAgentManager.js').SaveOption} SaveOption */

/** @param {{options: AgentConnInitOptions, onSave: (optionName: SaveOption, option: Object) => void}} props */
export default function AgentOptions({ options, onSave }) {
  /** @param {string} voiceId */
  const selectedVoiceId = (voiceId) => {
    onSave("voiceId", voiceId);
  };

  /** @param {import('#lib/agent/AgentConnInitOptions.js').LLMInitOptions} newOpts */
  const saveLlmOptions = (newOpts) => {
    onSave("llm", newOpts);
  };

  /** @param {import('#lib/agent/AgentConnInitOptions.js').AgentInitOptions} newOpts */
  const saveAgentOptions = (newOpts) => {
    onSave("agent", newOpts);
  };

  return (
    <>
      <div className="flex flex-col gap-2 col-span-2">
        <div className="text-xs text-gray-400">Agent Voice</div>
        <FetchSelect
          url="/api/collection/voices"
          name="Voice"
          defaultSelection={options.voiceId}
          onChange={selectedVoiceId}
          requestOptions={{
            method: "POST",
            body: { collectionId: COLLECTION_ID },
            headers: {
              "Content-Type": "application/json",
            },
          }}
        />
      </div>
      <div className="flex flex-col gap-2 col-span-2">
        <div className="text-xs text-gray-400">Override Options</div>
        <div className="flex gap-2">
          <AgentOptionsPopover options={options.agentOptions()} title="Agent" onSave={saveAgentOptions} />
          <AgentOptionsPopover options={options.llmOptions()} title="LLM" onSave={saveLlmOptions} />
        </div>
      </div>
    </>
  );
}
