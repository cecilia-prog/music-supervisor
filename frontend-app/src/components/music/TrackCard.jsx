import { formatDuration, getMoodEmoji, getGenreEmoji } from './musicHelpers';

/**
 * TrackCard component - displays a single music track with details
 */
export function TrackCard({ track, score }) {
  if (!track) return null;

  const tags = track.tags ? track.tags.split(',').map(t => t.trim()) : [];

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title and Artist */}
          <h3 className="text-lg font-semibold text-blue-900 truncate">
            {track.title}
          </h3>
          <p className="text-blue-600 text-sm mt-1 truncate">
            by {track.artist}
          </p>
          
          {/* Album and Year */}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
            <span className="truncate">📀 {track.album}</span>
            <span>•</span>
            <span>{track.year}</span>
            <span>•</span>
            <span>{formatDuration(track.duration)}</span>
          </div>
          
          {/* Genre and Mood badges */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium inline-flex items-center gap-1">
              <span>{getGenreEmoji(track.genre)}</span>
              {track.genre}
            </span>
            <span className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium inline-flex items-center gap-1">
              <span>{getMoodEmoji(track.mood)}</span>
              {track.mood}
            </span>
          </div>
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {tags.map((tag, i) => (
                <span 
                  key={i} 
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Score indicator */}
        {score !== undefined && (
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-bold text-blue-600">
              {score.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              relevance
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
