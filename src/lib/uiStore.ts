import { useSyncExternalStore } from 'react'
import { scrollToSection } from './sections'

// Estado de interfaz compartido entre secciones (acordeones de Aprendizajes y filtro por fase).

interface UiState {
  mainOpen: boolean
  openMoments: string[]
  openPhases: number[]
  /** Fase elegida desde un acceso rápido; Recursos, Videos, Galería y Bitácora la usarán como filtro. */
  phaseFilter: number | null
}

let state: UiState = { mainOpen: true, openMoments: [], openPhases: [], phaseFilter: null }
const listeners = new Set<() => void>()

function set(patch: Partial<UiState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useUi = () => useSyncExternalStore(subscribe, () => state)

const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export const ui = {
  toggleMain: () => set({ mainOpen: !state.mainOpen }),
  toggleMoment: (id: string) => set({ openMoments: toggleIn(state.openMoments, id) }),
  togglePhase: (id: number) => set({ openPhases: toggleIn(state.openPhases, id) }),

  /** Abre bloque principal, momento y fase, y se desplaza hasta la fase. */
  revealPhase(phaseId: number, momentId: string) {
    set({
      mainOpen: true,
      openMoments: state.openMoments.includes(momentId) ? state.openMoments : [...state.openMoments, momentId],
      openPhases: state.openPhases.includes(phaseId) ? state.openPhases : [...state.openPhases, phaseId],
    })
    scrollToSection('aprendizajes')
    window.setTimeout(() => {
      document.getElementById(`fase-${phaseId}`)?.scrollIntoView({ block: 'start' })
    }, 800)
  },

  /** Acceso rápido: fija el filtro de fase y va a la sección indicada. */
  goToSection(sectionId: string, phaseId: number | null) {
    set({ phaseFilter: phaseId })
    scrollToSection(sectionId)
  },
  setPhaseFilter: (phaseId: number | null) => set({ phaseFilter: phaseId }),
}
