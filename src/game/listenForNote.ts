import { PitchDetector } from 'pitchy'
import type { LevelNote } from '../api/types'
import { centsBetween, foldCents, freqToPitch } from './music'

// ---------------------------------------------------------------------
// Parámetros de "feeling" del juego: aquí se afina la dificultad y la
// sensibilidad al ruido.
// ---------------------------------------------------------------------
const GRACE_MS = 700 // tiempo para cambiar de nota sin que cuente como error
const HOLD_MS = 450 // cuánto hay que sostener la nota correcta
const WRONG_MS = 1000 // cuánto sostener una nota incorrecta para fallar
const TIMEOUT_MS = 9000 // sin acertar en este tiempo = fallo

// Filtros contra ruido (carros, motos, etc.)
const CLARITY_MIN = 0.85 // confianza mínima del detector (sube = más estricto)
const RMS_MIN = 0.005 // volumen mínimo (sube = ignora sonidos más suaves)
const STABLE_FRAMES = 4 // el tono debe mantenerse estable este número de lecturas seguidas...
const STABLE_CENTS = 80 // ...sin variar más de estos cents entre lecturas
const FREQ_MIN = 70
const FREQ_MAX = 1100

export interface LiveReading {
  freq: number
  cents: number
  noteName: string
  /** Progreso de "sostener la nota" de 0 a 1 (1 = acierto). */
  hold: number
}

/** El medidor se actualiza directo en el DOM, sin pasar por el estado de React. */
export interface MeterHandle {
  update: (reading: LiveReading | null) => void
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

    // Filtro de estabilidad: el ruido (motores, bocinas) salta de tono
    // en tono; una voz sostenida se mantiene.
    let lastPitch: number | null = null
    let stableCount = 0

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
      const rawValid = rms >= RMS_MIN && clarity >= CLARITY_MIN && pitch >= FREQ_MIN && pitch <= FREQ_MAX

      if (rawValid) {
        if (lastPitch !== null && Math.abs(1200 * Math.log2(pitch / lastPitch)) < STABLE_CENTS) {
          stableCount++
        } else {
          stableCount = 1
        }
        lastPitch = pitch
      } else {
        lastPitch = null
        stableCount = 0
      }

      const valid = rawValid && stableCount >= STABLE_FRAMES

      if (valid) {
        const cents = foldCents(centsBetween(pitch, note.frequency))
        lastFreq = pitch
        const inTolerance = Math.abs(cents) <= note.tolerance_cents

        // Primero actualizamos los timers para poder mostrar el progreso de "sostener"
        if (elapsed >= GRACE_MS) {
          if (inTolerance) {
            wrongStart = null
            holdStart ??= now
          } else {
            holdStart = null
            wrongStart ??= now
          }
        }

        const hold = holdStart !== null ? Math.min(1, (now - holdStart) / HOLD_MS) : 0
        onReading({ freq: pitch, cents, noteName: freqToPitch(pitch).name, hold })

        if (holdStart !== null && now - holdStart >= HOLD_MS) {
          resolve({ result: 'HIT', freq: pitch })
          return
        }
        if (wrongStart !== null && now - wrongStart >= WRONG_MS) {
          resolve({ result: 'MISS', freq: pitch })
          return
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
