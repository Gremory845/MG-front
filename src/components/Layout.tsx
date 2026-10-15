import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Layout() {
  const { status, logout } = useAuth()

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          🎵 Musical Game
        </Link>
        <nav>
          {status === 'authenticated' ? (
            <>
              <Link to="/">Escalas</Link>
              <button className="link-button" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Entrar</Link>
              <Link to="/register">Registrarse</Link>
            </>
          )}
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
