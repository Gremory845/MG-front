import { Link, useParams } from 'react-router-dom'
import { getLeaderboard, getLevel } from '../api/endpoints'
import { useAsync } from '../hooks/useAsync'

export default function LeaderboardPage() {
  const { levelId = '' } = useParams()
  const level = useAsync(() => getLevel(levelId), [levelId])
  const board = useAsync(() => getLeaderboard(levelId), [levelId])

  return (
    <section>
      {level.data && (
        <Link to={`/scales/${level.data.scale_id}`} className="muted">
          ← Niveles
        </Link>
      )}
      <h1>Ranking · {level.data?.name ?? ''}</h1>
      {board.loading && <p className="muted">Cargando…</p>}
      {board.error && <p className="error">{board.error}</p>}
      {board.data && board.data.length === 0 && <p className="muted">Todavía nadie completó este nivel. ¡Sé el primero!</p>}
      {board.data && board.data.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>Puntaje</th>
              <th>Precisión</th>
            </tr>
          </thead>
          <tbody>
            {board.data.map((e, i) => (
              <tr key={e.user_id}>
                <td>{i + 1}</td>
                <td>{e.username}</td>
                <td>{e.best_score}</td>
                <td>{e.best_accuracy.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
