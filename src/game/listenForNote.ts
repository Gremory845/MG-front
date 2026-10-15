import { PitchDetector } from 'pitchy'
import type { LevelNote } from '../api/types'
import { centsBetween, foldCents, freqToPitch } from './music'

// Parámetros de "feeling" del juego: aquí se afina la dificultad.
const GRACE_MS = 700 // tiempo para cambiar de nota sin que cuente como error
const HOLD_MS = 450 // cuánto hay que sostener la nota correcta
const WRONG_MS = 1000 // cuánto sostener una nota incorrecta para fallar
const TIMEOUT_MS = 9000 // sin acertar en este tiempo = fallo
const CLARITY_MIN = 0.92 // confianza mínima del detector
const RMS_MIN = 0.012 // volumen mínimo (ignora silencio y ruido de fondo)
const FREQ_MIN = 70
const FREQ_MAX = 1100

export interface LiveReading {
  freq: number
  cents: number
  noteName: string
}

export interface ListenOutcome {
  result: 'HIT' | 'MISS'
  freq?: number
}

export function listenForNote(
  analyser: AnalyserNode,
  sampleRate: number,
  note: LevelNote,
  isCancelled: () => boolean,
  onReading: (reading: LiveReading | null) => void,
): Promise<ListenOutcome> {
  return new Promise((resolve) => {
    const detector = PitchDetector.forFloat32Array(analyser.fftSize)
    const input = new Float32Array(detector.inputLength)
    const startedAt = performance.now()

    let holdStart: number | null = null
    let wrongStart: number | null = null
    let lastFreq: number | undefined

    const tick = () => {
      if (isCancelled()) {
        resolve({ result: 'MISS' })
        return
      }

      const now = performance.now()
      const elapsed = now - startedAt

      analyser.getFloatTimeDomainData(input)
      let sum = 0
      for (let i = 0; i < input.length; i++) sum += input[i] * input[i]
      const rms = Math.sqrt(sum / input.length)

      const [pitch, clarity] = detector.findPitch(input, sampleRate)
      const valid = rms >= RMS_MIN && clarity >= CLARITY_MIN && pitch >= FREQ_MIN && pitch <= FREQ_MAX

      if (valid) {
        const cents = foldCents(centsBetween(pitch, note.frequency))
        lastFreq = pitch
        onReading({ freq: pitch, cents, noteName: freqToPitch(pitch).name })

        if (elapsed >= GRACE_MS) {
          if (Math.abs(cents) <= note.tolerance_cents) {
            wrongStart = null
            holdStart ??= now
            if (now - holdStart >= HOLD_MS) {
              resolve({ result: 'HIT', freq: pitch })
              return
            }
          } else {
            holdStart = null
            wrongStart ??= now
            if (now - wrongStart >= WRONG_MS) {
              resolve({ result: 'MISS', freq: pitch })
              return
            }
          }
        }
      } else {
        onReading(null)
        holdStart = null
        wrongStart = null
      }

      if (elapsed >= TIMEOUT_MS) {
        resolve({ result: 'MISS', freq: lastFreq })
        return
      }
      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  })
}
