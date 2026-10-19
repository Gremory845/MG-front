import { useCallback, useEffect, useRef, useState } from 'react'
import { submitAttempt } from '../api/endpoints'
import type { AttemptResult, LevelDetail, NoteAttemptPayload } from '../api/types'
import { listenForNote } from './listenForNote'
import type { MeterHandle } from './listenForNote'
import { freqToPitch } from './music'
import { loadPiano, preloadPiano } from './piano'
import { playScale } from './scalePlayer'

// Máquina de estados del juego (en vez de veinte booleanos).
export type GamePhase =
  | 'IDLE'
  | 'REQUESTING_MIC'
  | 'PLAYING_SCALE'
  | 'WAITING_FOR_NOTE'
  | 'COMPLETED'
  | 'FAILED'
  | 'MIC_ERROR'

export interface NoteRecord {
  position: number
  result: 'HIT' | 'MISS'
  detectedFrequency?: number
}

export type Submission =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'done'; data: AttemptResult }
  | { status: 'error'; message: string }

interface AudioResources {
  ctx: AudioContext
  stream: MediaStream
  analyser: AnalyserNode
}

function describeMicError(e: unknown): string {
  if (e instanceof DOMException) {
    if (e.name === 'NotAllowedError' || e.name === 'SecurityError')
      return 'Necesitamos permiso para usar tu micrófono. Habilítalo en el candado de la barra de direcciones y vuelve a intentar.'
    if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError')
      return 'No encontramos ningún micrófono conectado.'
    if (e.name === 'NotReadableError') return 'Tu micrófono está siendo usado por otra aplicación.'
  }
  return 'No se pudo acceder al micrófono.'
}

export function useGame(level: LevelDetail | undefined) {
  const [phase, setPhase] = useState<GamePhase>('IDLE')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const meterRef = useRef<MeterHandle>(null) // el medidor se actualiza sin pasar por el estado de React
  const [records, setRecords] = useState<NoteRecord[]>([])
  const [failedAt, setFailedAt] = useState<number | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [submission, setSubmission] = useState<Submission>({ status: 'idle' })

  const audioRef = useRef<AudioResources | null>(null)
  const runRef = useRef(0) // id del intento en curso; subirlo cancela loops anteriores

  const start = useCallback(async () => {
    if (!level) return
    const runId = ++runRef.current
    const cancelled = () => runRef.current !== runId

    setRecords([])
    setFailedAt(null)
    setCurrentIndex(0)
    meterRef.current?.update(null)
    setMicError(null)
    setSubmission({ status: 'idle' })

    // 1) Micrófono + AudioContext (se crean una sola vez, con un clic del usuario)
    if (!audioRef.current) {
      setPhase('REQUESTING_MIC')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: false, // no suena nada mientras escuchamos, no hace falta
            noiseSuppression: true, // reducción de ruido del navegador (carros, motos, ventiladores)
            autoGainControl: false, // mantiene el volumen real, sin amplificar el ruido de fondo
          },
        })
        const ctx = new AudioContext()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 2048 // ventana de ~43 ms (antes 85 ms): la afinación responde el doble de rápido

        // Filtro pasa-banda a la voz: corta el retumbar de motores (<90 Hz) y el siseo agudo (>1800 Hz)
        const highpass = ctx.createBiquadFilter()
        highpass.type = 'highpass'
        highpass.frequency.value = 90
        highpass.Q.value = 0.7
        const lowpass = ctx.createBiquadFilter()
        lowpass.type = 'lowpass'
        lowpass.frequency.value = 1800
        lowpass.Q.value = 0.7
        ctx.createMediaStreamSource(stream).connect(highpass).connect(lowpass).connect(analyser)
        audioRef.current = { ctx, stream, analyser }
      } catch (e) {
        setMicError(describeMicError(e))
        setPhase('MIC_ERROR')
        return
      }
    }
    const { ctx, analyser } = audioRef.current
    if (ctx.state === 'suspended') await ctx.resume()
    if (cancelled()) return

    // 2) Suena la escala
    setPhase('PLAYING_SCALE')
    const piano = await loadPiano(ctx) // null si no cargó: se usa el sonido de respaldo
    if (cancelled()) return
    await playScale(ctx, level.notes, piano, setPlayingIndex, cancelled)
    setPlayingIndex(null)
    if (cancelled()) return

    // 3) El jugador canta nota por nota
    const startedAt = performance.now()
    const done: NoteRecord[] = []

    const finish = async (completed: boolean) => {
      // Las notas no alcanzadas se reportan como MISS: el backend exige todas las posiciones.
      const notes: NoteAttemptPayload[] = level.notes.map((n) => {
        const rec = done.find((r) => r.position === n.position)
        if (!rec) return { position: n.position, result: 'MISS' }
        if (rec.detectedFrequency === undefined) return { position: n.position, result: rec.result }
        const p = freqToPitch(rec.detectedFrequency)
        return {
          position: n.position,
          result: rec.result,
          detected_frequency: rec.detectedFrequency,
          detected_pitch_class: p.pitchClass,
          detected_octave: p.octave,
        }
      })

      setSubmission({ status: 'sending' })
      try {
        const data = await submitAttempt({
          level_id: level.id,
          completed,
          duration_ms: Math.round(performance.now() - startedAt),
          notes,
        })
        setSubmission({ status: 'done', data })
      } catch (e) {
        setSubmission({ status: 'error', message: e instanceof Error ? e.message : 'No se pudo guardar el intento' })
      }
    }

    for (let i = 0; i < level.notes.length; i++) {
      setCurrentIndex(i)
      setPhase('WAITING_FOR_NOTE')
      meterRef.current?.update(null)

      const outcome = await listenForNote(analyser, ctx.sampleRate, level.notes[i], cancelled, (r) => meterRef.current?.update(r))
      if (cancelled()) return

      done.push({ position: level.notes[i].position, result: outcome.result, detectedFrequency: outcome.freq })
      setRecords([...done])

      if (outcome.result === 'MISS') {
        meterRef.current?.update(null)
        setFailedAt(i)
        setPhase('FAILED')
        await finish(false)
        return
      }
    }

    meterRef.current?.update(null)
    setPhase('COMPLETED')
    await finish(true)
  }, [level])

  // Descarga las muestras de piano apenas se abre el nivel, para que suenen al instante.
  useEffect(() => {
    preloadPiano().catch(() => {})
  }, [])

  // Limpieza al salir de la pantalla: cancela loops y libera micrófono/audio.
  useEffect(() => {
    return () => {
      runRef.current++
      const res = audioRef.current
      if (res) {
        res.stream.getTracks().forEach((t) => t.stop())
        void res.ctx.close()
        audioRef.current = null
      }
    }
  }, [])

  return { phase, currentIndex, playingIndex, meterRef, records, failedAt, micError, submission, start }
}
