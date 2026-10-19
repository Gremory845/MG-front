import type { Category, Family } from './api/types'

// Textos y adornos de las tarjetas. Cuando lleguen los diseños, solo hay
// que cambiar los "icon" por imágenes.
export const CATEGORY_INFO: Record<Category, { label: string; short: string; icon: string; blurb: string }> = {
  MAJOR: { label: 'Escalas mayores', short: 'Mayores', icon: '', blurb: 'Sonido brillante y alegre' },
  MINOR: { label: 'Escalas menores', short: 'Menores', icon: '', blurb: 'Sonido más oscuro y emotivo' },
}

export const FAMILY_INFO: Record<Family, { label: string; icon: string; blurb: string }> = {
  NATURAL: { label: 'Naturales', icon: '', blurb: 'La forma base de la escala' },
  HARMONIC: { label: 'Armónicas', icon: '', blurb: 'Séptimo grado elevado: incluye un salto de segunda aumentada' },
  MELODIC: { label: 'Melódicas', icon: '', blurb: 'Sexto y séptimo grado elevados al subir' },
}

export const FAMILY_ORDER: Family[] = ['NATURAL', 'HARMONIC', 'MELODIC']

export const isCategory = (v: string): v is Category => v === 'MAJOR' || v === 'MINOR'
export const isFamily = (v: string): v is Family => v === 'NATURAL' || v === 'HARMONIC' || v === 'MELODIC'

// En la URL van en minúsculas: /c/minor/harmonic
export const toParam = (v: string) => v.toLowerCase()
