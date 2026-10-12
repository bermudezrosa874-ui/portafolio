export const SECTIONS = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'recorrido', label: 'Recorrido' },
  { id: 'aprendizajes', label: 'Aprendizajes' },
  { id: 'linea-de-tiempo', label: 'Línea de tiempo' },
  { id: 'entrevistas', label: 'Entrevistas' },
  { id: 'recursos', label: 'Recursos' },
  { id: 'aportes', label: 'Aportes' },
  { id: 'galeria', label: 'Galería' },
  { id: 'bitacora', label: 'Bitácora' },
  { id: 'equipo', label: 'Equipo' },
  { id: 'referencias', label: 'Referencias' },
] as const

export const SECTION_IDS: string[] = SECTIONS.map((s) => s.id)

/**
 * Muestra la sección indicada (el portafolio enseña una a la vez). Solo cambia por una acción de la persona:
 * un clic en el sidebar o en un botón, nunca por desplazarse. El nombre se conserva por compatibilidad.
 */
export function scrollToSection(id: string) {
  history.replaceState(null, '', `#${id}`)
  window.dispatchEvent(new HashChangeEvent('hashchange'))
}
