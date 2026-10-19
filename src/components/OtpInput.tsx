import { useRef } from 'react'
import type { ClipboardEvent, KeyboardEvent } from 'react'

export const OTP_LENGTH = 6
export const emptyCode = (): string[] => Array(OTP_LENGTH).fill('')

interface Props {
  digits: string[]
  onChange: (digits: string[]) => void
  disabled?: boolean
}

/** Código de 6 casillas: avanza solo, retrocede con borrar, y acepta pegar el código completo. */
export default function OtpInput({ digits, onChange, disabled }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const focus = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]
    el?.focus()
    el?.select()
  }

  // Escribe varios dígitos a partir de la casilla "start" (sirve para pegar y para el autocompletado del celular)
  const fillFrom = (start: number, text: string) => {
    const next = digits.slice()
    let i = start
    for (const ch of text) {
      if (i >= OTP_LENGTH) break
      next[i++] = ch
    }
    onChange(next)
    focus(i)
  }

  const handleChange = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, '')
    if (clean === '') {
      const next = digits.slice()
      next[i] = ''
      onChange(next)
      return
    }
    fillFrom(i, clean)
  }

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && digits[i] === '' && i > 0) {
      e.preventDefault()
      const next = digits.slice()
      next[i - 1] = ''
      onChange(next)
      focus(i - 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focus(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focus(i + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (text) {
      const next = emptyCode()
      for (let k = 0; k < text.length; k++) next[k] = text[k]
      onChange(next)
      focus(text.length)
    }
  }

  return (
    <div className="otp" role="group" aria-label="Código de 6 dígitos">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Dígito ${i + 1} de ${OTP_LENGTH}`}
          disabled={disabled}
          autoFocus={i === 0}
        />
      ))}
    </div>
  )
}
