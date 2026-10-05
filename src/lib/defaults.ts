import type { Member, SiteConfig } from '../types'

// Textos de respaldo: se muestran al instante y se reemplazan cuando llegan los datos de Supabase.

export const DEFAULT_CONFIG: SiteConfig = {
  id: 1,
  title: 'Ábaco del Tiempo',
  subtitle: 'Rutas del conocimiento matemático — Portafolio Digital Académico',
  motto: 'Aprender, crear y transformar el conocimiento',
  course: 'Historia de las Matemáticas',
  university: 'Universidad Nacional Abierta y a Distancia (UNAD)',
  center: 'Centro José Celestino Mutis, Bogotá',
  program: 'Licenciatura en Matemáticas',
  teacher: '[Por completar]',
  period: '[Por completar]',
  group_name: '[Por completar]',
  intro_text:
    'Este portafolio digital reúne los principales productos académicos desarrollados durante el proceso formativo. Cada recurso evidencia la evolución de nuestros aprendizajes mediante la investigación, la creatividad, el análisis y el uso de herramientas digitales.',
  purpose: '',
  general_objective: '',
  specific_objectives: [],
  timeline_text: '',
  timeline_learned: '[Por completar]',
  videos_intro: '',
  group_reflection: '',
  reflection_knowledge: '[Por completar]',
  reflection_skills: '[Por completar]',
  reflection_experience: '[Por completar]',
  team_text: '',
}

const base = {
  role: '[Por completar]',
  contribution: '[Por completar]',
  program: 'Licenciatura en Matemáticas',
  photo_path: null,
  user_id: null,
}

export const DEFAULT_MEMBERS: Member[] = [
  { ...base, id: 'm1', name: 'Rosalinda Bermúdez', topic: 'Arquímedes de Siracusa', position: 1 },
  { ...base, id: 'm2', name: 'Johana Lemus', topic: 'Egipto', position: 2 },
  { ...base, id: 'm3', name: 'Luis Fernando [apellido por completar]', topic: 'Tales de Mileto', position: 3 },
  { ...base, id: 'm4', name: 'Juan Stiven [apellido por completar]', topic: 'Zenón de Elea', position: 4 },
  { ...base, id: 'm5', name: '[Integrante 5 por completar]', topic: 'Mesopotamia', position: 5 },
]
