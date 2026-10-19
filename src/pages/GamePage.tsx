import { Link, useParams } from 'react-router-dom'
import { getLevel } from '../api/endpoints'
import PitchMeter from '../components/PitchMeter'
import Stage from '../components/Stage'
import { useAsync } from '../hooks/useAsync'
import { useGame } from '../game/useGame'

export default function GamePage() {
  const { levelId = '' } = useParams()
  const { data: level, error, loading } = useAsync(() => getLevel(levelId), [levelId])
  const game = useGame(level)

  if (loading) return <p className="muted">Cargando nivel…</p>
  if (error || !level) return <p className="error">{error ?? 'Nivel no encontrado'}</p>

  const target = level.notes[game.currentIndex]
  const finished = game.phase === 'COMPLETED' || game.phase === 'FAILED'

  return (
    <section>
      <Link to={`/scales/${level.scale_id}`} className="muted">
        ← Niveles
      </Link>
      <h1>{level.name}</h1>

      <Stage
        notes={level.notes}
        phase={game.phase}
        currentIndex={game.currentIndex}
        playingIndex={game.playingIndex}
        records={game.records}
        failedAt={game.failedAt}
      />

      <div className="card status">
        {game.phase === 'IDLE' && (
          <>
            <p>Escucharás la escala y luego tendrás que cantarla nota por nota.</p>
            <p className="muted">Cantar la nota una octava arriba o abajo también vale.</p>
            <button className="btn" onClick={game.start}>
              🎤 Empezar
            </button>
          </>
        )}

        {game.phase === 'REQUESTING_MIC' && <p>Esperando permiso para usar el micrófono…</p>}

        {game.phase === 'PLAYING_SCALE' && <p>🔊 Escucha la escala…</p>}

        {game.phase === 'WAITING_FOR_NOTE' && target && (
          <>
            <p className="big">
              Canta: <strong>{target.note_name}</strong>
            </p>
            <PitchMeter ref={game.meterRef} tolerance={target.tolerance_cents} />
          </>
        )}

        {game.phase === 'MIC_ERROR' && (
          <>
            <p className="error">{game.micError}</p>
            <button className="btn" onClick={game.start}>
              Reintentar
            </button>
          </>
        )}

        {finished && (
          <>
            {game.phase === 'COMPLETED' ? (
              <p className="big success">¡Nivel completado!</p>
            ) : (
              <p className="big error">
                Fallaste en la nota {game.failedAt !== null ? level.notes[game.failedAt].note_name : ''}
              </p>
            )}

            {game.submission.status === 'sending' && <p className="muted">Guardando resultado…</p>}
            {game.submission.status === 'done' && (
              <p>
                Puntaje: <strong>{game.submission.data.score}</strong> · Precisión:{' '}
                <strong>{game.submission.data.accuracy.toFixed(0)}%</strong>
              </p>
            )}
            {game.submission.status === 'error' && <p className="error">{game.submission.message}</p>}

            <div className="actions">
              <button className="btn" onClick={game.start}>
                {game.phase === 'COMPLETED' ? 'Jugar otra vez' : 'Reintentar (suena la escala de nuevo)'}
              </button>
              <Link className="btn secondary" to={`/leaderboard/${level.id}`}>
                Ver ranking
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
