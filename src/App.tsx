import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Nav } from './components/layout/Nav'
import { Footer } from './components/layout/Footer'
import { BackToTop } from './components/layout/BackToTop'
import { Hero } from './features/home/Hero'
import { useSession } from './hooks/useAuth'
import { useIdleLogout } from './hooks/useIdleLogout'
import { ARRIVED_TYPE } from './lib/authHash'
import { useScrollSpy } from './hooks/useScrollSpy'
import { useTheme } from './hooks/useTheme'
import { INTRO_KEY, readFlag, removeFlag } from './lib/safeStorage'
import { SECTION_IDS } from './lib/sections'

// Todo lo que está debajo de la portada se descarga después de pintarla.
const About = lazy(() => import('./features/about/About').then((m) => ({ default: m.About })))
const RouteMap = lazy(() => import('./features/route-map/RouteMap').then((m) => ({ default: m.RouteMap })))
const Learning = lazy(() => import('./features/learning/Learning').then((m) => ({ default: m.Learning })))
const Timeline = lazy(() => import('./features/timeline/Timeline').then((m) => ({ default: m.Timeline })))
const Videos = lazy(() => import('./features/videos/Videos').then((m) => ({ default: m.Videos })))
const Resources = lazy(() => import('./features/resources/Resources').then((m) => ({ default: m.Resources })))
const Gallery = lazy(() => import('./features/gallery/Gallery').then((m) => ({ default: m.Gallery })))
const Journal = lazy(() => import('./features/journal/Journal').then((m) => ({ default: m.Journal })))
const GroupReflection = lazy(() => import('./features/reflection/GroupReflection').then((m) => ({ default: m.GroupReflection })))
const Team = lazy(() => import('./features/team/Team').then((m) => ({ default: m.Team })))
const References = lazy(() => import('./features/references/References').then((m) => ({ default: m.References })))
const Intro = lazy(() => import('./features/intro/Intro'))
const AdminPage = lazy(() => import('./features/admin/AdminPage'))

function Portfolio() {
  const [showIntro, setShowIntro] = useState(() => readFlag(INTRO_KEY) !== '1')
  const { theme, toggle } = useTheme()
  const active = useScrollSpy(SECTION_IDS)

  const replayIntro = () => {
    removeFlag(INTRO_KEY)
    window.scrollTo({ top: 0 })
    setShowIntro(true)
  }

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
      <Nav active={active} theme={theme} onToggleTheme={toggle} />
      <main id="contenido">
        <Hero />
        <Suspense fallback={<div aria-hidden style={{ minHeight: '300vh' }} />}>
          <About />
          <RouteMap />
          <Learning />
          <Timeline />
          <Videos />
          <Resources />
          <Gallery />
          <Journal />
          <GroupReflection />
          <Team />
          <References />
        </Suspense>
      </main>
      <Footer onReplayIntro={replayIntro} />
      <BackToTop />
    </>
  )
}

export default function App() {
  const { session } = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Cierra la sesión tras 30 minutos sin actividad (solo si hay sesión).
  useIdleLogout(!!session)

  // Quien llega desde el enlace de invitación o de recuperación va directo a crear su contraseña.
  useEffect(() => {
    if (ARRIVED_TYPE && pathname !== '/admin') navigate('/admin', { replace: true })
  }, [pathname, navigate])

  return (
    <Routes>
      <Route path="/" element={<Portfolio />} />
      <Route
        path="/admin"
        element={
          <Suspense fallback={null}>
            <AdminPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Portfolio />} />
    </Routes>
  )
}
