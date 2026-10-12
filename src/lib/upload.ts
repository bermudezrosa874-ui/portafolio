// El cliente de Supabase se importa solo cuando hace falta: así no pesa en la carga inicial.
const getSupabase = async () => (await import('./supabase')).supabase

export type Bucket = 'deliverables' | 'evidences' | 'members' | 'covers' | 'contributions'

/** URL pública de un archivo, armada sin el cliente (los buckets son públicos para lectura). */
export const publicUrl = (bucket: Bucket, path: string, downloadName?: string) =>
  `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodeURI(path)}${
    downloadName ? `?download=${encodeURIComponent(downloadName)}` : ''
  }`

/** Sube un archivo con barra de progreso real (supabase-js no expone el progreso). */
export async function uploadWithProgress(
  bucket: Bucket,
  path: string,
  file: Blob,
  contentType: string,
  onProgress: (fraction: number) => void,
): Promise<void> {
  const supabase = await getSupabase()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Debes iniciar sesión para subir archivos.')

  const base = import.meta.env.VITE_SUPABASE_URL as string
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${base}/storage/v1/object/${bucket}/${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', key)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1)
        resolve()
      } else {
        let msg = 'No se pudo subir el archivo.'
        try {
          msg = JSON.parse(xhr.responseText).message ?? msg
        } catch {
          /* respuesta sin JSON */
        }
        reject(new Error(msg))
      }
    }
    xhr.onerror = () => reject(new Error('Error de red al subir el archivo.'))
    xhr.send(file)
  })
}

export async function removeObject(bucket: Bucket, path: string): Promise<void> {
  const supabase = await getSupabase()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}
