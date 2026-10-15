const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** Diferencia en cents entre dos frecuencias (positivo = más agudo). */
export function centsBetween(freq: number, target: number): number {
  return 1200 * Math.log2(freq / target)
}

/**
 * Pliega los cents a [-600, 600]: así cantar la nota una octava arriba o
 * abajo también cuenta (útil porque las voces graves y agudas cubren
 * registros distintos).
 */
export function foldCents(cents: number): number {
  return cents - 1200 * Math.round(cents / 1200)
}

export interface DetectedPitch {
  pitchClass: number
  octave: number
  name: string
}

export function freqToPitch(freq: number): DetectedPitch {
  const midi = Math.round(69 + 12 * Math.log2(freq / 440))
  const pitchClass = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return { pitchClass, octave, name: `${NOTE_NAMES[pitchClass]}${octave}` }
}

export function midiOf(pitchClass: number, octave: number): number {
  return 12 * (octave + 1) + pitchClass
}
