import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import PasswordInput from '../components/PasswordInput'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const notice = (useLocation().state as { message?: string } | null)?.message
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(username.trim(), password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h1>Iniciar sesión</h1>
      {notice && <p className="success-box">{notice}</p>}
      <label>
        Nombre de usuario
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
      </label>
      <label>
        Contraseña
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>
        {busy ? 'Entrando…' : 'Entrar'}
      </button>
      <div className="form-links">
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
        <span className="muted">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </span>
      </div>
    </form>
  )
}
