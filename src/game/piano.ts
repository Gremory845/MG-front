// Piano de muestras reales: "Salamander Grand Piano V3" de Alexander Holm
// (licencia CC BY 3.0). Ver public/piano/CREDITS.txt.
//
// Hay una muestra cada 3 semitonos (La3 a Fa#5). Para una nota intermedia se
// toma la muestra más cercana y se ajusta su velocidad, así la nota suena
// EXACTA. Es clave en un juego de afinación: "freq" es la frecuencia real
// medida de cada muestra (algunas están hasta 4 cents fuera de La=440), y
// se compensa al reproducirla.

interface Sample {
  file: string
  freq: number
}

const SAMPLES: Sample[] = [
  { file: 'A3', freq: 220.11 },
  { file: 'C4', freq: 261.81 },
  { file: 'Ds4', freq: 311.41 },
  { file: 'Fs4', freq: 369.21 },
  { file: 'A4', freq: 440.06 },
  { file: 'C5', freq: 524.47 },
  { file: 'Ds5', freq: 623.03 },
  { file: 'Fs5', freq: 740.74 },
]

const FADE_SECONDS = 0.3

let rawPromise: Promise<ArrayBuffer[]> | null = null

/** Descarga los archivos (se puede llamar antes de tener AudioContext). */
export function preloadPiano(): Promise<ArrayBuffer[]> {
  if (!rawPromise) {
    rawPromise = Promise.all(
      SAMPLES.map(async (s) => {
        const res = await fetch(`/piano/${s.file}.mp3`)
        if (!res.ok) throw new Error(`No se pudo cargar la muestra ${s.file}`)
        return res.arrayBuffer()
      }),
    ).catch((e) => {
      rawPromise = null // permite reintentar en el siguiente intento
      throw e
    })
  }
  return rawPromise
}

const decoded = new WeakMap<AudioContext, Promise<AudioBuffer[]>>()

/** Decodifica las muestras para este AudioContext. Devuelve null si no se pudo (se usará el sonido de respaldo). */
export async function loadPiano(ctx: AudioContext): Promise<AudioBuffer[] | null> {
  try {
    let pending = decoded.get(ctx)
    if (!pending) {
      // slice(0): decodeAudioData "consume" el buffer, y lo necesitamos para otros contextos
      pending = preloadPiano().then((raws) => Promise.all(raws.map((raw) => ctx.decodeAudioData(raw.slice(0)))))
      decoded.set(ctx, pending)
    }
    return await pending
  } catch {
    decoded.delete(ctx)
    return null
  }
}

export function playPianoNote(ctx: AudioContext, buffers: AudioBuffer[], frequency: number, holdSeconds: number) {
  let best = 0
  for (let i = 1; i < SAMPLES.length; i++) {
    if (Math.abs(Math.log2(frequency / SAMPLES[i].freq)) < Math.abs(Math.log2(frequency / SAMPLES[best].freq))) best = i
  }

  const source = ctx.createBufferSource()
  source.buffer = buffers[best]
  source.playbackRate.value = frequency / SAMPLES[best].freq

  const gain = ctx.createGain()
  const t = ctx.currentTime
  gain.gain.setValueAtTime(0.9, t)
  gain.gain.setValueAtTime(0.9, t + holdSeconds)
  gain.gain.linearRampToValueAtTime(0, t + holdSeconds + FADE_SECONDS)

  source.connect(gain).connect(ctx.destination)
  source.start(t)
  source.stop(t + holdSeconds + FADE_SECONDS + 0.05)
}
