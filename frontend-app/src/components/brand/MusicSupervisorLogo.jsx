/**
 * Music Supervisor Logo Component
 */
export default function MusicSupervisorLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
        <span className="text-white text-2xl">🎵</span>
      </div>
      <span className="text-white font-bold text-xl">Music Supervisor</span>
    </div>
  );
}
