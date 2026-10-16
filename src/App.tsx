import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Nav } from './components/layout/Nav'
import { SIDEBAR_PAD } from './components/layout/Sidebar'
import { Footer } from './components/layout/Footer'
import { BackToTop } from './components/layout/BackToTop'
import { Hero } from './features/home/Hero'
import { useSession } from './hooks/useAuth'
import { IDLE_FLAG, useIdleLogout } from './hooks/useIdleLogout'
import { useToast } from './components/ui/Toast'
import { readFlag, removeFlag } from './lib/safeStorage'
import { ARRIVED_TYPE } from './lib/authHash'
import { SECTION_IDS } from './lib/sections'

// Todo lo que está debajo de la portada se descarga después de pintarla.
const About = lazy(() => import('./features/about/About').then((m) => ({ default: m.About })))
const RouteMap = lazy(() => import('./features/route-map/RouteMap').then((m) => ({ default: m.RouteMap })))
const Learning = lazy(() => import('./features/learning/Learning').then((m) => ({ default: m.Learning })))
const Timeline = lazy(() => import('./features/timeline/Timeline').then((m) => ({ default: m.Timeline })))
const Videos = lazy(() => import('./features/videos/Videos').then((m) => ({ default: m.Videos })))
const Resources = lazy(() => import('./features/resources/Resources').then((m) => ({ default: m.Resources })))
const Contributions = lazy(() => import('./features/contributions/Contributions').then((m) => ({ default: m.Contributions })))
const Gallery = lazy(() => import('./features/gallery/Gallery').then((m) => ({ default: m.Gallery })))
const Journal = lazy(() => import('./features/journal/Journal').then((m) => ({ default: m.Journal })))
const GroupReflection = lazy(() => import('./features/reflection/GroupReflection').then((m) => ({ default: m.GroupReflection })))
const Team = lazy(() => import('./features/team/Team').then((m) => ({ default: m.Team })))
const References = lazy(() => import('./features/references/References').then((m) => ({ default: m.References })))
const Intro = lazy(() => import('./features/intro/Intro'))
const AdminPage = lazy(() => import('./features/admin/AdminPage'))

const readSection = () => {
  const h = window.location.hash.slice(1)
  return SECTION_IDS.includes(h) ? h : 'inicio'
}

function SectionView({ id }: { id: string }) {
  switch (id) {
    case 'sobre':
      return <About />
    case 'recorrido':
      return <RouteMap />
    case 'aprendizajes':
      return <Learning />
    case 'linea-de-tiempo':
      return <Timeline />
    case 'entrevistas':
      return <Videos />
    case 'recursos':
      return <Resources />
    case 'aportes':
      return <Contributions />
    case 'galeria':
      return <Gallery />
    case 'bitacora':
      return (
        <>
          <Journal />
          <GroupReflection />
        </>
      )
    case 'equipo':
      return <Team />
    case 'referencias':
      return <References />
    default:
      return <Hero />
  }
}

const IDLE_MINUTES = 60

function Portfolio() {
  // La carta de apertura sale cada vez que se entra al portafolio (ya no se recuerda que se vio).
  const [showIntro, setShowIntro] = useState(true)
  // Se muestra una sola sección. Solo cambia cuando la persona hace clic (sidebar o botones).
  const [section, setSection] = useState(readSection)
  const toast = useToast()

  // Si la sesión se cerró por inactividad, se avisa una sola vez al volver al portafolio.
  useEffect(() => {
    if (readFlag(IDLE_FLAG) !== '1') return
    removeFlag(IDLE_FLAG)
    toast('info', 'Tu sesión se cerró por inactividad. Inicia sesión de nuevo cuando quieras.')
  }, [toast])

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1)
      if (!SECTION_IDS.includes(h)) return
      setSection(h)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // La portada estática del HTML se oculta apenas carga la aplicación, sea cual sea la sección inicial.
  useLayoutEffect(() => {
    const s = document.getElementById('prerender')
    if (s) s.style.visibility = 'hidden'
  }, [])

  return (
    <>
      {showIntro && (
        <Suspense fallback={<div className="fixed inset-0 z-[100] bg-abyss" />}>
          <Intro onDone={() => setShowIntro(false)} />
        </Suspense>
      )}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded focus:bg-[#f5b942] focus:px-4 focus:py-2 focus:text-abyss"
      >
        Saltar al contenido
      </a>
      <Nav active={section} />
      <div className={SIDEBAR_PAD}>
        <main id="contenido" className="min-h-[75vh] pt-8">
          <motion.div key={section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Suspense fallback={<div aria-hidden style={{ minHeight: '60vh' }} />}>
              <SectionView id={section} />
            </Suspense>
          </motion.div>
        </main>
        <Footer />
      </div>
      <BackToTop />
    </>
  )
}

export default function App() {
  const { session } = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Cierra la sesión tras 1 hora sin actividad (solo si hay sesión).
  useIdleLogout(!!session, IDLE_MINUTES)

  // Quien llega desde el enlace de invitación o de recuperación va directo a crear su contraseña.
  useEffect(() => {
    if (ARRIVED_TYPE && pathname !== '/admin' && pathname !== '/colaborador') navigate('/admin', { replace: true })
  }, [pathname, navigate])

  return (
    <Routes>
      <Route path="/" element={<Portfolio />} />
      {/* Mismo panel con dos direcciones: AdminPage lleva a cada quien a la suya según su rol. */}
      {['/admin', '/colaborador'].map((path) => (
        <Route
          key={path}
          path={path}
          element={
            <Suspense fallback={null}>
              <AdminPage />
            </Suspense>
          }
        />
      ))}
      <Route path="*" element={<Portfolio />} />
    </Routes>
  )
}
