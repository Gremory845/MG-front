import type { LevelNote } from '../api/types'

const NOTE_DURATION = 0.55
const NOTE_GAP = 0.12

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function beep(ctx: AudioContext, frequency: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.value = frequency

  const now = ctx.currentTime
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.25, now + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.001, now + NOTE_DURATION)

  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + NOTE_DURATION + 0.05)
}

/** Reproduce la escala nota por nota y avisa cuál suena (para resaltar la plataforma). */
export async function playScale(
  ctx: AudioContext,
  notes: LevelNote[],
  onNote: (index: number | null) => void,
  isCancelled: () => boolean,
): Promise<void> {
  for (let i = 0; i < notes.length; i++) {
    if (isCancelled()) return
    onNote(i)
    beep(ctx, notes[i].frequency)
    await sleep((NOTE_DURATION + NOTE_GAP) * 1000)
  }
  onNote(null)
}
