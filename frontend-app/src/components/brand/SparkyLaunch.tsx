import { useEffect, useState } from 'react';
import sparkyBouncyGif from '../../assets/sparky/launch/sparky-bouncy.gif';

const SESSION_KEY = 'sparkyLaunchShown';
const LAUNCH_DURATION_MS = 1400;

type Props = {
  onComplete?: () => void;
};

/**
 * Launch animation that plays once per session
 */
export default function SparkyLaunch({ onComplete }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if already shown this session
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      onComplete?.();
      return;
    }

    // Show the animation
    setIsVisible(true);
    sessionStorage.setItem(SESSION_KEY, '1');

    // Auto-hide after duration
    const timer = setTimeout(() => {
      handleComplete();
    }, LAUNCH_DURATION_MS);

    // Allow skip on click or key press
    const handleSkip = () => {
      clearTimeout(timer);
      handleComplete();
    };

    window.addEventListener('click', handleSkip);
    window.addEventListener('keydown', handleSkip);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleSkip);
      window.removeEventListener('keydown', handleSkip);
    };
  }, []);

  const handleComplete = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 300); // Fade out duration
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-white flex items-center justify-center transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ 
        pointerEvents: isFadingOut ? 'none' : 'auto',
        zIndex: 9999
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <img
          src={sparkyBouncyGif}
          alt="Sparky bouncing animation"
          className="w-[300px] h-auto"
        />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-900">
            Let's choose my voice!
          </p>
          <p className="text-sm text-gray-600">
            Select a voice and connect to continue
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Click or press any key to skip
          </p>
        </div>
      </div>
    </div>
  );
}
