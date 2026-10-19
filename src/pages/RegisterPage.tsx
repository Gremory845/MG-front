import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import PasswordInput from '../components/PasswordInput'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await register(email, username.trim(), password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h1>Crear cuenta</h1>
      <label>
        Correo
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Nombre de usuario (3 a 30 caracteres)
        <input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={30} required />
      </label>
      <label>
        Contraseña (mínimo 8)
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" required />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>
        {busy ? 'Creando…' : 'Registrarme'}
      </button>
      <p className="muted">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </form>
  )
}
