import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword } from '../api/endpoints'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const cleanEmail = email.trim()
      await forgotPassword(cleanEmail)
      navigate('/forgot-password/verify', { state: { email: cleanEmail } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h1>¿Olvidaste tu contraseña?</h1>
      <p className="muted">Escribe el correo asociado a tu cuenta y te enviaremos un código de 6 dígitos.</p>
      <label>
        Correo
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={busy}>
        {busy ? 'Enviando…' : 'Enviar código'}
      </button>
      <p className="muted">
        <Link to="/login">← Volver a iniciar sesión</Link>
      </p>
    </form>
  )
}
