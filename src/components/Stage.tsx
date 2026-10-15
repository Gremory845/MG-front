import type { LevelNote } from '../api/types'
import type { GamePhase, NoteRecord } from '../game/useGame'
import { midiOf } from '../game/music'

interface Props {
  notes: LevelNote[]
  phase: GamePhase
  currentIndex: number
  playingIndex: number | null
  records: NoteRecord[]
  failedAt: number | null
}

/**
 * Escenario con figuras provisionales:
 *  - cada nota es una plataforma (más alta = nota más aguda)
 *  - el personaje es un círculo que salta de plataforma en plataforma
 * Cuando lleguen los sprites, solo hay que reemplazar los <div> de
 * ".player" y ".platform" por las imágenes.
 */
export default function Stage({ notes, phase, currentIndex, playingIndex, records, failedAt }: Props) {
  const hits = records.filter((r) => r.result === 'HIT').length
  const characterIndex = hits - 1 // -1 = plataforma de inicio

  const midis = notes.map((n) => midiOf(n.pitch_class, n.octave))
  const minMidi = Math.min(...midis)
  const heightOf = (i: number) => 28 + (midis[i] - minMidi) * 9

  const playerClass = (idx: number) => {
    if (failedAt !== null && idx === characterIndex) return 'player fall'
    if (phase === 'COMPLETED' && idx === notes.length - 1) return 'player win'
    return idx === -1 ? 'player' : 'player jump'
  }

  return (
    <div className="stage">
      {/* Plataforma de inicio */}
      <div className="slot">
        {characterIndex === -1 && <div className={playerClass(-1)} key="start" />}
        <div className="platform start" style={{ height: 28 }}>
          <span>Inicio</span>
        </div>
      </div>

      {notes.map((n, i) => {
        const classes = ['platform']
        if (i < hits) classes.push('done')
        if (phase === 'WAITING_FOR_NOTE' && i === currentIndex) classes.push('target')
        if (playingIndex === i) classes.push('playing')
        if (failedAt === i) classes.push('failed')

        return (
          <div className="slot" key={n.position}>
            {characterIndex === i && <div className={playerClass(i)} key={`p-${i}-${failedAt}`} />}
            <div className={classes.join(' ')} style={{ height: heightOf(i) }}>
              <span>{n.note_name}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
