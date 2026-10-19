export type Category = 'MAJOR' | 'MINOR'
export type Family = 'NATURAL' | 'HARMONIC' | 'MELODIC'

export interface Scale {
  id: string
  name: string
  difficulty: number
  category: Category
  family: Family
}

export interface LevelSummary {
  id: string
  level_number: number
  name: string
  required_accuracy: number
}

export interface ScaleLevels {
  scale_id: string
  scale_name: string
  category: Category
  family: Family
  levels: LevelSummary[]
}

export interface LevelNote {
  position: number
  pitch_class: number
  octave: number
  note_name: string
  frequency: number
  tolerance_cents: number
}

export interface LevelDetail {
  id: string
  scale_id: string
  level_number: number
  name: string
  required_accuracy: number
  notes: LevelNote[]
}

export interface NoteAttemptPayload {
  position: number
  result: 'HIT' | 'MISS'
  detected_pitch_class?: number
  detected_octave?: number
  detected_frequency?: number
}

export interface SubmitAttemptPayload {
  level_id: string
  completed: boolean
  duration_ms?: number
  notes: NoteAttemptPayload[]
}

export interface AttemptResult {
  id: string
  score: number
  accuracy: number
  mistakes: number
  completed: boolean
}

export interface LeaderboardEntry {
  user_id: string
  username: string
  best_score: number
  best_accuracy: number
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}
