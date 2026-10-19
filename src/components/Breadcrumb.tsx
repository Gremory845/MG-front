import { Link } from 'react-router-dom'

interface Crumb {
  label: string
  to?: string
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumb">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="sep"> › </span>}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}
