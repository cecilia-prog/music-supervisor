import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFloating, offset, flip, shift, autoUpdate, Placement } from '@floating-ui/react';
import { VOICES } from '../../config/voices';

type Props = { voiceId: string; placement?: Placement };

export default function VoiceInfoPopover({ voiceId, placement = 'bottom' }: Props) {
  const meta = VOICES[voiceId];
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, placement: resolvedPlacement } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,                // default 'bottom'
    middleware: [
      offset(8),             // 8px away from button
      flip(),                // flip to bottom if no space
      shift({ padding: 8 }), // keep inside viewport
    ],
    whileElementsMounted: autoUpdate,
  });

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const referenceEl = refs.reference.current;
      const floatingEl = refs.floating.current;
      
      // Check if click is outside both the button and the popover
      if (
        referenceEl instanceof HTMLElement &&
        floatingEl instanceof HTMLElement &&
        !referenceEl.contains(target) &&
        !floatingEl.contains(target)
      ) {
        setOpen(false);
      }
    };
    
    // Use timeout to avoid closing immediately on the same click that opens
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, refs.reference, refs.floating]);

  if (!meta) return null;

  return (
    <div className="relative inline-block">
      <button
        ref={refs.setReference}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline decoration-dotted underline-offset-4 transition-colors"
        title="Voice details"
      >
        About this Voice
      </button>

      {open && createPortal(
        <div
          ref={refs.setFloating}
          style={{ ...floatingStyles, zIndex: 9999 }}
          role="dialog"
          aria-label="Voice details"
          className="w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
        >
          <div className="text-sm font-semibold text-slate-900">{meta.displayName}</div>
          <div className="mt-1 text-xs text-slate-600">{meta.description}</div>
          <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
            <dt className="text-slate-500">Origin</dt>
            <dd className="text-slate-800">{meta.origin}</dd>
            <dt className="text-slate-500">Gender lean</dt>
            <dd className="text-slate-800">{meta.genderLean}</dd>
          </dl>
          {!!meta.tags?.length && (
            <div className="mt-2 flex flex-wrap gap-1">
              {meta.tags.map(t => (
                <span key={t} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">{t}</span>
              ))}
            </div>
          )}
          <div className="mt-3 flex justify-between text-[11px] text-slate-500">
            <span>Placement: {resolvedPlacement}</span>
            <button
              type="button"
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
