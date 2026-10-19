import { Link, useParams } from 'react-router-dom'
import { getScaleLevels } from '../api/endpoints'
import Breadcrumb from '../components/Breadcrumb'
import { CATEGORY_INFO, FAMILY_INFO, toParam } from '../catalog'
import { useAsync } from '../hooks/useAsync'

export default function LevelsPage() {
  const { scaleId = '' } = useParams()
  const { data, error, loading } = useAsync(() => getScaleLevels(scaleId), [scaleId])

  return (
    <section>
      {data ? (
        <Breadcrumb
          items={[
            { label: 'Escalas', to: '/' },
            { label: CATEGORY_INFO[data.category].short, to: `/c/${toParam(data.category)}` },
            { label: FAMILY_INFO[data.family].label, to: `/c/${toParam(data.category)}/${toParam(data.family)}` },
            { label: data.scale_name },
          ]}
        />
      ) : (
        <Breadcrumb items={[{ label: 'Escalas', to: '/' }]} />
      )}
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
