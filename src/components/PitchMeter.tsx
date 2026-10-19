import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { MeterHandle } from '../game/listenForNote'

const RANGE = 60 // la barra muestra ±60 cents (más zoom = se nota cada movimiento)
const PERFECT = 10 // zona "perfecta": ±10 cents
const KEEP_LAST_MS = 220 // si la señal se pierde un instante, la aguja no desaparece de golpe
const SMOOTHING = 0.5 // 0 = muy suave, 1 = sin suavizado
const TEXT_EVERY_MS = 90 // el texto se refresca más lento para que sea legible

const TICKS = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50]
const pct = (cents: number) => ((cents + RANGE) / (2 * RANGE)) * 100

interface Props {
  tolerance: number
}

/**
 * Afinador visual. IMPORTANTE: se actualiza imperativamente (por ref) y no
 * con estado de React, porque recibe ~60 lecturas por segundo y pasarlas
 * por React hacía que la barra se sintiera con retraso.
 */
const PitchMeter = forwardRef<MeterHandle, Props>(function PitchMeter({ tolerance }, ref) {
  const needleRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const holdRef = useRef<HTMLDivElement>(null)
  const internal = useRef({ shown: 0, lastValidAt: 0, lastTextAt: 0 })

  useImperativeHandle(
    ref,
    () => ({
      update(reading) {
        const needle = needleRef.current
        const text = textRef.current
        const hold = holdRef.current
        if (!needle || !text || !hold) return

        const now = performance.now()
        const s = internal.current

        if (reading) {
          const target = Math.max(-RANGE, Math.min(RANGE, reading.cents))
          // Si venimos de un silencio, la aguja salta directo; si no, se suaviza.
          s.shown = now - s.lastValidAt > 400 ? target : s.shown + (target - s.shown) * SMOOTHING
          s.lastValidAt = now

          const abs = Math.abs(reading.cents)
          needle.style.left = `${pct(s.shown)}%`
          needle.style.opacity = '1'
          needle.className = `tuner-needle ${abs <= PERFECT ? 'perfect' : abs <= tolerance ? 'ok' : 'off'}`
          hold.style.width = `${reading.hold * 100}%`

          if (now - s.lastTextAt >= TEXT_EVERY_MS) {
            s.lastTextAt = now
            const sign = reading.cents > 0 ? '+' : ''
            const hint =
              abs <= tolerance ? '¡Afinado! Mantén la nota' : reading.cents > 0 ? 'Muy agudo, baja un poco ↓' : 'Muy grave, sube un poco ↑'
            text.textContent = `${reading.noteName} · ${sign}${Math.round(reading.cents)} cents — ${hint}`
          }
        } else if (now - s.lastValidAt > KEEP_LAST_MS) {
          needle.style.opacity = '0.15'
          hold.style.width = '0%'
          text.textContent = 'Esperando tu voz…'
        }
      },
    }),
    [tolerance],
  )

  return (
    <div className="tuner">
      <div className="tuner-scale">
        <div className="tuner-zone" style={{ width: `${Math.min(100, (tolerance / RANGE) * 100)}%` }} />
        <div className="tuner-perfect" style={{ width: `${(PERFECT / RANGE) * 100}%` }} />
        {TICKS.map((t) => (
          <div key={t} className={`tuner-tick ${t === 0 ? 'center' : ''}`} style={{ left: `${pct(t)}%` }} />
        ))}
        <div ref={needleRef} className="tuner-needle off" style={{ left: '50%', opacity: 0.15 }} />
      </div>
      <div className="tuner-labels">
        <span>♭ grave</span>
        <span>afinado</span>
        <span>agudo ♯</span>
      </div>
      <div className="tuner-hold" title="Sostén la nota hasta que se llene">
        <div ref={holdRef} className="tuner-hold-fill" />
      </div>
      <div ref={textRef} className="tuner-text">
        Esperando tu voz…
      </div>
    </div>
  )
})

export default PitchMeter
