// src/config/voices.ts
export type VoiceMeta = {
  displayName: string;
  origin: 'ElevenLabs' | 'Resemble' | 'OpenAI' | 'Custom' | 'Other';
  genderLean: 'female' | 'male' | 'neutral';
  description: string;        // short, stakeholder-friendly copy
  tags?: string[];            // optional: pacing, warmth, clarity, etc.
};

// Hard-coded voice metadata - key is the voice name from API
export const VOICES: Record<string, VoiceMeta> = {
  Anna: {
    displayName: 'Anna',
    origin: 'ElevenLabs',
    genderLean: 'female',
    description: 'Warm, friendly, approachable tone with crisp articulation and a grounded delivery.',
    tags: ['crisp', 'approachable', 'grounded'],
  },
  Ava: {
    displayName: 'Ava',
    origin: 'ElevenLabs',
    genderLean: 'female',
    description: 'Clean and modern with a light, steady tone; clear without added coloration.',
    tags: ['light', 'steady', 'clear'],
  },
  Cassidy: {
    displayName: 'Cassidy',
    origin: 'ElevenLabs',
    genderLean: 'female',
    description: 'Direct and to the point with clear enunciation; minimal softness.',
    tags: ['direct', 'concise', 'clear'],
  },
  Cliff: {
    displayName: 'Cliff',
    origin: 'Resemble',
    genderLean: 'male',
    description: 'Crisp, confident delivery with a deep, steady presence.',
    tags: ['deep', 'steady', 'confident'],
  },
  Grace: {
    displayName: 'Grace',
    origin: 'Resemble',
    genderLean: 'female',
    description: 'Light, smooth, and pleasant; softly bright without added color.',
    tags: ['smooth', 'pleasant'],
  },
  Lucy: {
    displayName: 'Lucy',
    origin: 'Resemble',
    genderLean: 'female',
    description: 'Youthful and upbeat; friendly and energetic with clear articulation.',
    tags: ['youthful', 'upbeat', 'friendly'],
  },
  Stacy: {
    displayName: 'Stacy',
    origin: 'ElevenLabs',
    genderLean: 'female',
    description: 'Conversational, warm, and grounded; natural and easy to listen to.',
    tags: ['conversational', 'warm', 'natural'],
  },
  Taylor: {
    displayName: 'Taylor',
    origin: 'Resemble',
    genderLean: 'neutral',
    description: 'Balanced and gender-ambiguous; energetic and engaged.',
    tags: ['balanced', 'engaged', 'energetic'],
  },
  Fred: {
    displayName: 'Fred',
    origin: 'ElevenLabs',
    genderLean: 'male',
    description: 'Steady and confident with a warm presence; animated delivery.',
    tags: ['animated', 'warm', 'steady'],
  },
  Hope: {
    displayName: 'Hope',
    origin: 'ElevenLabs',
    genderLean: 'female',
    description: 'Mid-low female voice with confident, steady clarity. Grounded and professional without feeling heavy.',
    tags: ['confident', 'steady', 'grounded', 'professional'],
  },
};
