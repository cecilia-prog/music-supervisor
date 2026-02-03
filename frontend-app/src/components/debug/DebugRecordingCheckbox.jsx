import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** @typedef {import('#lib/audio/AudioRecorder.js').RecorderState} RecorderState */

/** @param {{setWithDebugRecording: (withRecording: boolean) => void, recorderState: RecorderState }} props */
export default function DebugRecordingCheckbox({ setWithDebugRecording, recorderState }) {
  const disabled = recorderState === "recording" || recorderState === "playback";

  const label = () => {
    if (recorderState === "recording") return "Recording...";
    if (recorderState === "playback") return "Playing...";
    return "Record Input";
  };

  const textColor = () => {
    if (recorderState === "recording") return "text-red-300";
    if (recorderState === "playback") return "text-emerald-300";

    return "text-gray-400";
  };

  const checkboxColor = () => {
    if (recorderState === "recording") {
      return "data-[state=checked]:border-red-400 data-[state=checked]:bg-red-400 data-[state=checked]:text-white";
    }
    if (recorderState === "playback") {
      return "data-[state=checked]:border-emerald-400 data-[state=checked]:bg-emerald-400 data-[state=checked]:text-white";
    }

     return ""
  };

  return (
    <>
      <div className="flex items-center gap-2 justify-end">
        <Label className={"min-w-24 text-right font-normal text-xs flex justify-end " + textColor()}>{label()}</Label>
        <Checkbox onCheckedChange={setWithDebugRecording} className={checkboxColor()} disabled={disabled} />
      </div>
    </>
  );
}
