import { Link } from 'react-router-dom'
import { getScales } from '../api/endpoints'
import { useAsync } from '../hooks/useAsync'

export default function ScalesPage() {
  const { data, error, loading } = useAsync(getScales, [])

  return (
    <section>
      <h1>Elige una escala</h1>
      {loading && <p className="muted">Cargando…</p>}
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {data?.map((s) => (
          <Link key={s.id} to={`/scales/${s.id}`} className="card scale-card">
            <h2>{s.name}</h2>
            <p className="muted">Dificultad {s.difficulty}/10</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
