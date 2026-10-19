import type { LevelNote } from '../api/types'
import { playPianoNote } from './piano'

const NOTE_STEP = 0.8 // segundos entre el inicio de una nota y la siguiente
const NOTE_HOLD = 0.85 // cuánto suena cada nota antes de apagarse

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Sonido de respaldo (si las muestras de piano no cargaron)
function beep(ctx: AudioContext, frequency: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.value = frequency

  const now = ctx.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.25, now + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.65)
}

/** Reproduce la escala nota por nota (con piano) y avisa cuál suena para resaltar la plataforma. */
export async function playScale(
  ctx: AudioContext,
  notes: LevelNote[],
  piano: AudioBuffer[] | null,
  onNote: (index: number | null) => void,
  isCancelled: () => boolean,
): Promise<void> {
  for (let i = 0; i < notes.length; i++) {
    if (isCancelled()) return
    onNote(i)
    if (piano) playPianoNote(ctx, piano, notes[i].frequency, NOTE_HOLD)
    else beep(ctx, notes[i].frequency)
    await sleep(NOTE_STEP * 1000)
  }
  // dejamos que suene la cola de la última nota
  await sleep(400)
  onNote(null)
}
