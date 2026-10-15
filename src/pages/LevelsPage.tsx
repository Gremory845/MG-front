import { Link, useParams } from 'react-router-dom'
import { getScaleLevels } from '../api/endpoints'
import { useAsync } from '../hooks/useAsync'

export default function LevelsPage() {
  const { scaleId = '' } = useParams()
  const { data, error, loading } = useAsync(() => getScaleLevels(scaleId), [scaleId])

  return (
    <section>
      <Link to="/" className="muted">
        ← Escalas
      </Link>
      <h1>{data?.scale_name ?? 'Niveles'}</h1>
      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="error">{error}</p>}
      <div className="list">
        {data?.levels.map((l) => (
          <div key={l.id} className="card row">
            <div>
              <h2>{l.name || `Nivel ${l.level_number}`}</h2>
              <p className="muted">Precisión mínima: {l.required_accuracy}%</p>
            </div>
            <div className="actions">
              <Link className="btn" to={`/play/${l.id}`}>
                Jugar
              </Link>
              <Link className="btn secondary" to={`/leaderboard/${l.id}`}>
                Ranking
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
