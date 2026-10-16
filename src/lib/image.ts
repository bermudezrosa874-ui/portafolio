// Compresión de imágenes en el navegador antes de subirlas: WebP, máx. 1920 px, más miniatura.
// Al volver a codificar la imagen también se descartan los metadatos (EXIF, ubicación).

export interface ProcessedImage {
  blob: Blob
  width: number
  height: number
  mime: 'image/webp' | 'image/jpeg'
  ext: 'webp' | 'jpg'
}

async function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality))
  const webp = await toBlob('image/webp')
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await toBlob('image/jpeg') // navegadores sin soporte de escritura WebP
  if (!jpeg) throw new Error('No se pudo procesar la imagen.')
  return jpeg
}

function drawScaled(bitmap: ImageBitmap, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Tu navegador no permite procesar imágenes.')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  return { canvas, width, height }
}

async function toProcessed(bitmap: ImageBitmap, maxSide: number, quality: number): Promise<ProcessedImage> {
  const { canvas, width, height } = drawScaled(bitmap, maxSide)
  const blob = await encode(canvas, quality)
  const webp = blob.type === 'image/webp'
  return { blob, width, height, mime: webp ? 'image/webp' : 'image/jpeg', ext: webp ? 'webp' : 'jpg' }
}

/** Imagen principal (≤ 1920 px) y miniatura (≤ 480 px). Respeta la orientación EXIF. */
export async function processWithThumb(file: File): Promise<{ main: ProcessedImage; thumb: ProcessedImage }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const main = await toProcessed(bitmap, 1920, 0.82)
    const thumb = await toProcessed(bitmap, 480, 0.75)
    return { main, thumb }
  } finally {
    bitmap.close()
  }
}

/** Solo la imagen principal (portadas y fotos de integrantes). */
export async function processSingle(file: File, maxSide = 1280): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    return await toProcessed(bitmap, maxSide, 0.82)
  } finally {
    bitmap.close()
  }
}

/** Foto de perfil: recorte cuadrado centrado (se muestra en círculo) comprimido a ≤ 300 KB. */
export const AVATAR_MAX_BYTES = 300 * 1024

export async function processAvatar(file: File): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const crop = Math.min(bitmap.width, bitmap.height)
    const sx = Math.floor((bitmap.width - crop) / 2)
    const sy = Math.floor((bitmap.height - crop) / 2)
    let last: Blob | null = null
    for (const side of [512, 384, 256, 192]) {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = Math.min(side, crop)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Tu navegador no permite procesar imágenes.')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(bitmap, sx, sy, crop, crop, 0, 0, canvas.width, canvas.height)
      for (const q of [0.85, 0.7, 0.55, 0.4]) {
        last = await encode(canvas, q)
        if (last.size <= AVATAR_MAX_BYTES) {
          const webp = last.type === 'image/webp'
          return { blob: last, width: canvas.width, height: canvas.height, mime: webp ? 'image/webp' : 'image/jpeg', ext: webp ? 'webp' : 'jpg' }
        }
      }
    }
    throw new Error('No se pudo reducir la foto a 300 KB. Prueba con otra imagen.')
  } finally {
    bitmap.close()
  }
}
