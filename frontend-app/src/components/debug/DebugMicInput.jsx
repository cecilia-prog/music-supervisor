import { useState, useRef, useEffect } from "react";
import AudioMeter from "#lib/audio/Meter.js";
import { Mic, MicOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import DebugRecordingCheckbox from "./DebugRecordingCheckbox.jsx";
import DebugAudioPlayer from "./DebugAudioPlayer.jsx";

import { useAgentMic } from "../../hooks/useAgent.js";

/** @typedef {import("../../AgentContext.jsx").MicState} MicState */
/** @typedef {import('#lib/audio/AudioRecorder.js').RecorderState} RecorderState */

function DebugMicInput() {
  const { micState, toggleMic, setMicOnMeter, setWithDebugRecording, setOnRecorderStateChange, debugPlayback } =
    useAgentMic();

  const [recorderState, setRecorderState] = useState(/**@type {RecorderState}*/ ("idle"));

  const meter = useRef(null);
  const canvas = useRef(null);

  useEffect(() => {
    setOnRecorderStateChange((state) => {
      setRecorderState(state);
    });
  }, [setOnRecorderStateChange]);

  // Initialize meter once canvas is available
  useEffect(() => {
    if (!canvas.current || meter.current) return;

    console.log('[DebugMicInput] 🎤 Creating AudioMeter instance');
    meter.current = new AudioMeter(canvas.current, {
      clampBetween: { min: -60, max: 0 },
      smoothing: 0.8,
      fps: 30,
    });

    // CRITICAL: Register callback AFTER meter is created
    console.log('[DebugMicInput] 🎤 Registering meter callback now that meter exists');
    setMicOnMeter((level) => {
      if (meter.current) {
        meter.current.update(level);
      } else {
        console.warn('[DebugMicInput] ⚠️ Meter callback called but meter.current is null');
      }
    });

    return () => {
      if (meter.current) {
        console.log('[DebugMicInput] 🎤 Cleanup: stopping meter');
        meter.current.stop();
      }
    };
  }, [setMicOnMeter]);

  const handleClick = () => {
    toggleMic((isOpen) => {
      console.log('[DebugMicInput] 🎤 Toggling mic, new state will be:', isOpen ? 'OPEN' : 'CLOSED');
      if (isOpen) {
        meter.current?.start();
        console.log('[DebugMicInput] 🎤 Meter started');
      } else {
        meter.current?.stop();
        console.log('[DebugMicInput] 🎤 Meter stopped');
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-[410px] flex items-center gap-4">
      <Button size="icon" className="px-2 py-1" variant={micState.isOpen ? "default" : "outline"} onClick={handleClick}>
        {micState.isOpen ? <Mic /> : <MicOff />}
      </Button>

      <div className="bg-neutral-100 p-2 rounded-md">
        <canvas ref={canvas} width={100} height={20} className="w-[100px] h-[20px]" />
      </div>

      <div className="min-w-10 min-h-10">
        {micState.withDebugRecording && (
          <DebugAudioPlayer debugPlayback={debugPlayback} recorderState={recorderState} />
        )}
      </div>

      <DebugRecordingCheckbox setWithDebugRecording={setWithDebugRecording} recorderState={recorderState} />
    </div>
  );
}

export default DebugMicInput;
