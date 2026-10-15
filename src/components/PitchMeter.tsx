import type { LiveReading } from '../game/listenForNote'

interface Props {
  reading: LiveReading | null
  tolerance: number
}

/** Barra de afinación: el punto se mueve según los cents de diferencia con la nota objetivo. */
export default function PitchMeter({ reading, tolerance }: Props) {
  const range = 100 // la barra muestra ±100 cents
  const cents = reading ? Math.max(-range, Math.min(range, reading.cents)) : 0
  const left = ((cents + range) / (2 * range)) * 100
  const inTune = reading !== null && Math.abs(reading.cents) <= tolerance
  const zoneWidth = (tolerance / range) * 100

  return (
    <div className="meter">
      <div className="meter-bar">
        <div className="meter-zone" style={{ width: `${zoneWidth}%` }} />
        {reading && <div className={`meter-dot ${inTune ? 'ok' : ''}`} style={{ left: `${left}%` }} />}
      </div>
      <div className="meter-text">
        {reading
          ? `Detectado: ${reading.noteName} (${reading.cents > 0 ? '+' : ''}${Math.round(reading.cents)} cents)`
          : 'Esperando tu voz…'}
      </div>
    </div>
  )
}
