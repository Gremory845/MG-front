import { Link, Navigate, useParams } from 'react-router-dom'
import { getScales } from '../api/endpoints'
import Breadcrumb from '../components/Breadcrumb'
import { CATEGORY_INFO, FAMILY_INFO, FAMILY_ORDER, isCategory, toParam } from '../catalog'
import { useAsync } from '../hooks/useAsync'

export default function FamiliesPage() {
  const { category: raw = '' } = useParams()
  const category = raw.toUpperCase()
  const { data, error, loading } = useAsync(getScales, [])

  if (!isCategory(category)) return <Navigate to="/" replace />

  const info = CATEGORY_INFO[category]
  const families = FAMILY_ORDER.filter((f) => data?.some((s) => s.category === category && s.family === f))

  return (
    <section>
      <Breadcrumb items={[{ label: 'Escalas', to: '/' }, { label: info.short }]} />
      <h1>{info.label}</h1>
      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="error">{error}</p>}
      <div className="category-grid">
        {families.map((f) => {
          const fam = FAMILY_INFO[f]
          const count = data?.filter((s) => s.category === category && s.family === f).length ?? 0
          return (
            <Link key={f} to={`/c/${toParam(category)}/${toParam(f)}`} className="card scale-card category-card">
              <span className="icon">{fam.icon}</span>
              <h2>{fam.label}</h2>
              <p className="muted">{fam.blurb}</p>
              <p className="muted small">{count} escalas</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
