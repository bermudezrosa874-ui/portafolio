// Debe ser el PRIMER import: guarda el hash de la URL antes de que Supabase lo borre.
import './lib/authHash'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource-variable/inter'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import './styles/index.css'
import App from './App'
import { initialTheme } from './hooks/useTheme'
import { ConfirmProvider } from './components/ui/Confirm'
import { ToastProvider } from './components/ui/Toast'

// En /admin no hay portada: la estática del HTML se quita para que no quede visible detrás del panel.
if (window.location.pathname.startsWith('/admin')) document.getElementById('prerender')?.remove()

// Si el HTML trae la portada ya pintada, React la reemplaza sin animarla (para que no parpadee).
;(window as unknown as { __prerendered?: boolean }).__prerendered = !!document.getElementById('prerender')

// Aplica el tema antes del primer render para evitar el parpadeo.
document.documentElement.dataset.theme = initialTheme()

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
