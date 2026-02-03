import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLLECTION_ID = "nDshWbfFJOnlqhmXDAfM";

/**
 * Simplified voice selector for user-facing interface
 * @param {Object} props
 * @param {string} props.value - Selected voice ID
 * @param {(voiceId: string, voiceName: string) => void} props.onChange - Callback when voice changes
 * @param {boolean} [props.disabled] - Whether the selector is disabled
 */
export default function VoiceSelector({ value, onChange, disabled = false }) {
  const [voices, setVoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleChange = (voiceId) => {
    const voice = voices.find(v => 
      (v.voice_id || v.voiceId || v.id) === voiceId
    );
    const voiceName = voice?.name || voice?.voice_name || voiceId;
    onChange(voiceId, voiceName);
  };

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setIsLoading(true);
        console.debug("[VoiceSelector] Fetching voices...");
        console.debug("[VoiceSelector] Collection ID:", COLLECTION_ID);
        
        const response = await fetch("/api/collection/voices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ collectionId: COLLECTION_ID }),
        });

        console.debug("[VoiceSelector] Response status:", response.status);
        console.debug("[VoiceSelector] Response headers:", response.headers);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[VoiceSelector] Error response text:", errorText);
          throw new Error(`Failed to fetch voices: ${response.statusText}`);
        }

        const data = await response.json();
        console.debug("[VoiceSelector] Full response data:", JSON.stringify(data, null, 2));
        console.debug("[VoiceSelector] Response keys:", Object.keys(data));
        
        // Check different possible response structures
        let voicesList = [];
        if (data.voices) {
          voicesList = data.voices;
          console.debug("[VoiceSelector] Found voices in data.voices");
        } else if (data.data) {
          voicesList = data.data;
          console.debug("[VoiceSelector] Found voices in data.data");
        } else if (Array.isArray(data)) {
          voicesList = data;
          console.debug("[VoiceSelector] Response is array");
        } else {
          console.warn("[VoiceSelector] Unknown response structure");
        }
        
        console.debug("[VoiceSelector] Voices list length:", voicesList.length);
        console.debug("[VoiceSelector] Voices list:", voicesList);
        
        if (voicesList.length > 0) {
          console.debug("[VoiceSelector] First voice:", voicesList[0]);
          console.debug("[VoiceSelector] First voice keys:", Object.keys(voicesList[0]));
        }
        
        setVoices(voicesList);
        setError(null);
      } catch (err) {
        console.error("[VoiceSelector] Error fetching voices:", err);
        console.error("[VoiceSelector] Error stack:", err.stack);
        setError(err.message);
      } finally {
        setIsLoading(false);
        console.debug("[VoiceSelector] Fetch complete. Voices count:", voices.length);
      }
    };

    fetchVoices();
  }, []);

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[180px] rounded-full border-2 border-[#002e99] bg-[#002e99] text-white font-medium [&_svg]:text-white [&_svg]:opacity-100 [&>span]:text-white [&>span]:opacity-100 [&>span]:font-medium">
          <SelectValue placeholder="Loading voices..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[180px] rounded-full border-2 border-[#002e99] bg-[#002e99] text-white font-medium [&_svg]:text-white [&_svg]:opacity-100 [&>span]:text-white [&>span]:opacity-100 [&>span]:font-medium">
          <SelectValue placeholder="Error loading voices" />
        </SelectTrigger>
      </Select>
    );
  }

  console.debug("[VoiceSelector] Render - current value:", value);
  console.debug("[VoiceSelector] Render - voices count:", voices.length);
  
  if (!voices || voices.length === 0) {
    console.warn("[VoiceSelector] No voices available for rendering");
    return (
      <Select disabled value={value}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="No voices available" />
        </SelectTrigger>
      </Select>
    );
  }

  // Find the current voice to display its name
  const currentVoice = voices.find(v => (v.voice_id || v.voiceId || v.id) === value);
  const currentVoiceName = currentVoice?.name || currentVoice?.voice_name || null;
  
  console.debug("[VoiceSelector] 📍 Render", { 
    place: "VoiceSelector", 
    voiceId: value, 
    displayName: currentVoiceName,
    voicesCount: voices.length,
    currentVoice: currentVoice
  });

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className="w-[180px] rounded-full border-2 border-[#002e99] bg-[#002e99] text-white hover:bg-[#002577] font-medium [&_svg]:text-white [&_svg]:opacity-100 [&>span]:text-white [&>span]:opacity-100 [&>span]:font-medium">
        <SelectValue placeholder="Select voice" />
      </SelectTrigger>
      <SelectContent 
        className=""
        position="popper"
        side="bottom"
        sideOffset={8}
        collisionPadding={20}
        avoidCollisions={true}
      >
        {voices.map((voice) => {
          const voiceId = voice.voice_id || voice.voiceId || voice.id;
          const voiceName = voice.name || voice.voice_name;
          
          // Skip voices without a valid name
          if (!voiceName) {
            console.warn("[VoiceSelector] Voice missing name:", voice);
            return null;
          }
          
          return (
            <SelectItem key={voiceId} value={voiceId} className="">
              {voiceName}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
