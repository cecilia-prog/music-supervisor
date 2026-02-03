import { useState, useEffect } from 'react';
import idleGif from '../../assets/sparky/Smiley-Idle.gif';
import listeningGif from '../../assets/sparky/Smiley-Listening.gif';
import empathyGif from '../../assets/sparky/Smiley-Empathy.gif';
import quizzicalGif from '../../assets/sparky/Smiley_Quizzical.gif';

type SparkyState = 'idle' | 'listening' | 'speaking';

type Props = {
  state: SparkyState;
};

// Array of GIFs to cycle through
const SMILEY_GIFS = [idleGif, listeningGif, empathyGif, quizzicalGif];

/**
 * Sparky conversation indicator
 * Automatically cycles through different GIFs every 3 seconds
 */
export default function SparkyConversation({ state }: Props) {
  const [currentGifIndex, setCurrentGifIndex] = useState(0);

  useEffect(() => {
    // Preload all GIFs
    SMILEY_GIFS.forEach(gif => {
      const img = new Image();
      img.src = gif;
    });

    // Cycle to next GIF every 3 seconds
    const interval = setInterval(() => {
      setCurrentGifIndex(prev => (prev + 1) % SMILEY_GIFS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sparky-frame flex flex-col items-center justify-center bg-transparent relative" style={{ background: 'transparent', width: 306, height: 306 }}>
      {SMILEY_GIFS.map((gif, index) => (
        <img
          key={index}
          src={gif}
          alt="Sparky"
          width={306}
          height={306}
          className="absolute top-0 left-0 block pointer-events-none select-none object-contain"
          style={{ 
            background: 'transparent',
            opacity: index === currentGifIndex ? 1 : 0
          }}
        />
      ))}
    </div>
  );
}
