export const SECTIONS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'recorrido', label: 'Recorrido' },
  { id: 'aprendizajes', label: 'Aprendizajes' },
  { id: 'linea-de-tiempo', label: 'Línea de tiempo' },
  { id: 'entrevistas', label: 'Entrevistas' },
  { id: 'recursos', label: 'Recursos' },
  { id: 'galeria', label: 'Galería' },
  { id: 'bitacora', label: 'Bitácora' },
  { id: 'equipo', label: 'Equipo' },
  { id: 'referencias', label: 'Referencias' },
] as const

export const SECTION_IDS: string[] = SECTIONS.map((s) => s.id)

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ block: 'start' })
  history.replaceState(null, '', `#${id}`)
}
