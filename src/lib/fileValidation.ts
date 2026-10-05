// Validación de archivos en el navegador: tipo REAL (firma de bytes) y tamaño. Nunca solo la extensión.

export const MB = 1024 * 1024
export const LIMITS = { document: 20 * MB, image: 8 * MB } as const

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
export type DocumentMime = 'application/pdf' | typeof DOCX_MIME
export type ImageMime = 'image/jpeg' | 'image/png' | 'image/webp'

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v)

async function head(file: Blob, n = 16): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, n).arrayBuffer())
}

/** Un .docx es un ZIP que contiene [Content_Types].xml y word/document.xml. */
async function looksLikeDocx(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return false
  const text = new TextDecoder('latin1').decode(bytes)
  return text.includes('[Content_Types].xml') && text.includes('word/')
}

export type Validated<M> = { ok: true; mime: M } | { ok: false; error: string }

export async function validateDocument(file: File): Promise<Validated<DocumentMime>> {
  if (file.size === 0) return { ok: false, error: 'El archivo está vacío.' }
  if (file.size > LIMITS.document) {
    return { ok: false, error: `El archivo pesa ${(file.size / MB).toFixed(1)} MB. El máximo es 20 MB.` }
  }
  const b = await head(file)
  if (startsWith(b, [0x25, 0x50, 0x44, 0x46, 0x2d])) return { ok: true, mime: 'application/pdf' } // %PDF-
  if (await looksLikeDocx(file)) return { ok: true, mime: DOCX_MIME }
  return { ok: false, error: 'Solo se permiten archivos PDF o Word (.docx). El contenido no coincide.' }
}

export async function validateImage(file: File): Promise<Validated<ImageMime>> {
  if (file.size === 0) return { ok: false, error: 'El archivo está vacío.' }
  if (file.size > LIMITS.image) {
    return { ok: false, error: `La imagen pesa ${(file.size / MB).toFixed(1)} MB. El máximo es 8 MB.` }
  }
  const b = await head(file, 12)
  if (startsWith(b, [0xff, 0xd8, 0xff])) return { ok: true, mime: 'image/jpeg' }
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ok: true, mime: 'image/png' }
  if (startsWith(b, [0x52, 0x49, 0x46, 0x46]) && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { ok: true, mime: 'image/webp' }
  }
  return { ok: false, error: 'Solo se permiten imágenes JPG, PNG o WebP.' }
}

export const extensionFor = (mime: string): string =>
  ({
    'application/pdf': 'pdf',
    [DOCX_MIME]: 'docx',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  })[mime] ?? 'bin'
