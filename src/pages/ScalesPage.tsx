import { Link, Navigate, useParams } from 'react-router-dom'
import { getScales } from '../api/endpoints'
import Breadcrumb from '../components/Breadcrumb'
import { CATEGORY_INFO, FAMILY_INFO, isCategory, isFamily, toParam } from '../catalog'
import { useAsync } from '../hooks/useAsync'

export default function ScalesPage() {
  const { category: rawCategory = '', family: rawFamily = '' } = useParams()
  const category = rawCategory.toUpperCase()
  const family = rawFamily.toUpperCase()
  const { data, error, loading } = useAsync(getScales, [])

  if (!isCategory(category) || !isFamily(family)) return <Navigate to="/" replace />

  const scales = data?.filter((s) => s.category === category && s.family === family)

  return (
    <section>
      <Breadcrumb
        items={[
          { label: 'Escalas', to: '/' },
          { label: CATEGORY_INFO[category].short, to: `/c/${toParam(category)}` },
          { label: FAMILY_INFO[family].label },
        ]}
      />
      <h1>
        {CATEGORY_INFO[category].short} {FAMILY_INFO[family].label.toLowerCase()}
      </h1>
      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {scales?.map((s) => (
          <Link key={s.id} to={`/scales/${s.id}`} className="card scale-card">
            <h2>{s.name}</h2>
            <p className="muted">Dificultad {s.difficulty}/10</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
