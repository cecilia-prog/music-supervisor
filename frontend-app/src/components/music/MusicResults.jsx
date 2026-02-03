import { TrackCard } from './TrackCard';

/**
 * MusicResults component - displays a list of music search results
 */
export function MusicResults({ tracks, query }) {
  if (!tracks || tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎵</div>
        <p className="text-gray-500 text-lg">
          No tracks found{query ? ` for "${query}"` : ''}.
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Try a different search!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-blue-900">
          Found {tracks.length} track{tracks.length !== 1 ? 's' : ''}
          {query && <span className="text-blue-600 ml-2">for "{query}"</span>}
        </h2>
      </div>
      
      <div className="space-y-3">
        {tracks.map((item, i) => (
          <TrackCard 
            key={item.track?.id || i} 
            track={item.track} 
            score={item.score} 
          />
        ))}
      </div>
    </div>
  );
}
