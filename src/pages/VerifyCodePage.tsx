import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { forgotPassword, verifyResetCode } from '../api/endpoints'
import OtpInput, { OTP_LENGTH, emptyCode } from '../components/OtpInput'

const RESEND_SECONDS = 60

// "joshua@test.com" -> "j*****@test.com"
function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email
  return `${user[0] ?? ''}${'*'.repeat(Math.max(user.length - 1, 1))}@${domain}`
}

export default function VerifyCodePage() {
  const navigate = useNavigate()
  const email = (useLocation().state as { email?: string } | null)?.email

  const [digits, setDigits] = useState<string[]>(emptyCode())
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)

  // Cuenta regresiva para poder pedir otro código
  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft])

  // Si se recargó la página no tenemos el correo: se empieza de nuevo
  if (!email) return <Navigate to="/forgot-password" replace />

  const code = digits.join('')
  const complete = code.length === OTP_LENGTH

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!complete) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const { reset_token } = await verifyResetCode(email, code)
      navigate('/reset-password', { state: { resetToken: reset_token }, replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setDigits(emptyCode())
    } finally {
      setBusy(false)
    }
  }

  const onResend = async () => {
    setError(null)
    setInfo(null)
    try {
      await forgotPassword(email)
      setDigits(emptyCode())
      setSecondsLeft(RESEND_SECONDS)
      setInfo('Te enviamos un código nuevo. El anterior ya no sirve.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el código')
    }
  }

  return (
    <form className="card form" onSubmit={onSubmit}>
      <h1>Revisa tu correo</h1>
      <p className="muted">
        Enviamos un código de 6 dígitos a <strong>{maskEmail(email)}</strong>. Vence en 10 minutos.
      </p>

      <OtpInput digits={digits} onChange={setDigits} disabled={busy} />

      {error && <p className="error center">{error}</p>}
      {info && <p className="success center">{info}</p>}

      <button className="btn" disabled={!complete || busy}>
        {busy ? 'Verificando…' : 'Continuar'}
      </button>

      <p className="muted center">
        {secondsLeft > 0 ? (
          <>Puedes pedir otro código en {secondsLeft} s</>
        ) : (
          <button type="button" className="link-button" onClick={onResend}>
            Reenviar código
          </button>
        )}
      </p>
      <p className="muted center">
        <Link to="/forgot-password">Usar otro correo</Link>
      </p>
    </form>
  )
}
