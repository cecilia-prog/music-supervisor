import { VOICES } from '../../config/voices';

type Props = { 
  voiceId?: string; 
  headerOffset?: number;
};

export default function VoiceInfoPanel({ voiceId, headerOffset = 80 }: Props) {
  const meta = voiceId ? VOICES[voiceId] : undefined;

  console.log('[VoiceInfoPanel] voiceId:', voiceId);
  console.log('[VoiceInfoPanel] meta:', meta);
  console.log('[VoiceInfoPanel] VOICES keys:', Object.keys(VOICES));

  // Don't render the panel if no voice is selected
  if (!voiceId || !meta) {
    return null;
  }

  return (
    <aside
      className="md:w-[300px] w-full rounded-2xl border border-slate-200 bg-white shadow-sm p-4"
      style={{ position: "sticky", top: headerOffset, zIndex: 10 }}
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden>ℹ️</span>
        <h2 className="text-base font-semibold text-slate-900">
          {meta.displayName}
        </h2>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="font-medium text-slate-500">Description:</dt>
          <dd className="text-slate-900">{meta.description}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Gender:</dt>
          <dd className="text-slate-900 capitalize">Leans {meta.genderLean}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Generated In:</dt>
          <dd className="text-slate-900">{meta.origin === 'Other' ? 'Resemble' : meta.origin}</dd>
        </div>
      </div>
    </aside>
  );
}
