import { Play, Timer, Circle, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** @typedef {import('#lib/audio/AudioRecorder.js').RecorderState} RecorderState */

/** @param {{debugPlayback: (action: 'play' | 'stop') => void, recorderState: RecorderState }} props */
export default function DebugAudioPlayer({ debugPlayback, recorderState }) {
  const buttonClasses = {
    done: "border-emerald-500 hover:bg-emerald-100",
    idle: "border-gray-500 hover:bg-gray-100",
    recording: "border-red-500 hover:bg-red-100",
    playback: "border-emerald-500 hover:bg-emerald-100",
  };

  const action = recorderState === "playback" ? "stop" : "play";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          className={"px-2 py-1 " + buttonClasses[recorderState]}
          variant="outline"
          onClick={() => recorderState === 'idle' ? null : debugPlayback(action)}
          disabled={recorderState === 'recording'}
        >
          {recorderState === "done" && <Play className="fill-emerald-500 stroke-emerald-500" />}
          {recorderState === "playback" && <Pause className="fill-emerald-500 stroke-emerald-500" />}
          {recorderState === "idle" && <Timer className="stroke-gray-500" />}
          {recorderState === "recording" && <Circle className="stroke-red-500 fill-red-300" />}
        </Button>
      </TooltipTrigger>

      <TooltipContent className="">
        {recorderState === "done" && "Play Recorded Audio"}
        {recorderState === "playback" && "Playing..."}
        {recorderState === "idle" && "Automatically records up to 10s when you open the mic."}
        {recorderState === "recording" && "Recording..."}
      </TooltipContent>
    </Tooltip>
  );
}
