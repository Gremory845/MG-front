import { Link } from 'react-router-dom'
import { getScales } from '../api/endpoints'
import type { Category } from '../api/types'
import { CATEGORY_INFO, toParam } from '../catalog'
import { useAsync } from '../hooks/useAsync'

export default function CategoriesPage() {
  const { data, error } = useAsync(getScales, [])

  return (
    <section>
      <h1>¿Qué quieres practicar?</h1>
      {error && <p className="error">{error}</p>}
      <div className="category-grid">
        {(Object.keys(CATEGORY_INFO) as Category[]).map((c) => {
          const info = CATEGORY_INFO[c]
          const count = data?.filter((s) => s.category === c).length
          return (
            <Link key={c} to={`/c/${toParam(c)}`} className="card scale-card category-card">
              <span className="icon">{info.icon}</span>
              <h2>{info.label}</h2>
              <p className="muted">{info.blurb}</p>
              {count !== undefined && <p className="muted small">{count} escalas</p>}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
