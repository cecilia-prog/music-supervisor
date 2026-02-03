/**
 * Format duration from seconds to MM:SS
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format year with era context
 */
export function formatYear(year) {
  if (year >= 2000) return `${year} (2000s)`;
  if (year >= 1990) return `${year} (90s)`;
  if (year >= 1980) return `${year} (80s)`;
  if (year >= 1970) return `${year} (70s)`;
  if (year >= 1960) return `${year} (60s)`;
  return year.toString();
}

/**
 * Get mood emoji
 */
export function getMoodEmoji(mood) {
  const moodMap = {
    'peaceful': '🧘',
    'energetic': '⚡',
    'melancholic': '🌧️',
    'epic': '🎭',
    'rebellious': '🤘',
    'dark': '🌑',
    'groovy': '🕺',
    'emotional': '💔',
    'empowering': '💪',
    'uplifting': '☀️',
    'motivational': '🔥',
    'nostalgic': '📼',
    'dreamy': '✨',
    'hopeful': '🌅',
    'comforting': '🤗',
    'sorrowful': '😢',
    'contemplative': '🤔',
    'thoughtful': '💭',
  };
  
  return moodMap[mood.toLowerCase()] || '🎵';
}

/**
 * Get genre emoji
 */
export function getGenreEmoji(genre) {
  const genreMap = {
    'rock': '🎸',
    'pop': '🎤',
    'soul': '🎹',
    'funk': '🎺',
    'reggae': '🌴',
    'hip hop': '🎧',
    'folk': '🪕',
    'country': '🤠',
    'grunge': '🎸',
    'alternative': '🎵',
    'new wave': '🎹',
  };
  
  return genreMap[genre.toLowerCase()] || '🎵';
}
