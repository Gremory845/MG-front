import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { resetPassword } from '../api/endpoints'
import { ApiError } from '../api/client'
import PasswordInput from '../components/PasswordInput'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const resetToken = (useLocation().state as { resetToken?: string } | null)?.resetToken

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touchedConfirm, setTouchedConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)
  const [busy, setBusy] = useState(false)

  // Sin token (por ejemplo, tras recargar la página) hay que empezar de nuevo
  if (!resetToken) return <Navigate to="/forgot-password" replace />

  const mismatch = touchedConfirm && confirm !== '' && password !== confirm

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setTouchedConfirm(true)
      setError('Las contraseñas no coinciden')
      return
    }
    setBusy(true)
    try {
      await resetPassword(resetToken, password, confirm)
      navigate('/login', { replace: true, state: { message: 'Contraseña actualizada. Ya puedes iniciar sesión con la nueva.' } })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_RESET_TOKEN') setExpired(true)
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h1>Nueva contraseña</h1>
      <label>
        Nueva contraseña (mínimo 8)
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          autoComplete="new-password"
          required
          autoFocus
        />
      </label>
      <label>
        Confirmar contraseña
        <PasswordInput
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setTouchedConfirm(true)}
          minLength={8}
          autoComplete="new-password"
          required
        />
      </label>
      {mismatch && <p className="error">Las contraseñas no coinciden</p>}
      {error && !mismatch && <p className="error">{error}</p>}
      {expired && (
        <p className="muted">
          <Link to="/forgot-password">Volver a empezar</Link>
        </p>
      )}
      <button className="btn" disabled={busy || expired}>
        {busy ? 'Guardando…' : 'Restablecer contraseña'}
      </button>
    </form>
  )
}
