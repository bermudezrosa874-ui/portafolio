# Ábaco del Tiempo

Portafolio digital académico de **Historia de las Matemáticas** (Licenciatura en Matemáticas, UNAD).
Tiene una carta de apertura animada, entregas por fases con visor de PDF y Word, línea de tiempo, videos,
recursos interactivos, galería, bitácora, quiz, equipo y referencias en APA 7. Se edita desde un panel (`/admin`).

**Tecnología:** Vite + React + TypeScript + Tailwind · Supabase (base de datos, cuentas y archivos) · Vercel (publicación).

---

## 1. Ejecutarlo en tu computador

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
npm run dev              # abre http://localhost:5173
```

Edita `.env` con los datos de tu proyecto (Supabase → *Project Settings → API*):

| Variable | Qué es |
|---|---|
| `VITE_SUPABASE_URL` | La **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | La clave **anon** (pública) |
| `VITE_SITE_URL` | La dirección final del sitio, sin `/` al final (para las vistas previas al compartir) |

> ⚠️ **Nunca** pongas la clave `service_role` en este proyecto ni en GitHub. El sitio solo necesita la `anon`.
> El archivo `.env` ya está en `.gitignore`: no se sube.

Otros comandos: `npm run build` (compila), `npm run preview` (ve la versión compilada), `npm run typecheck`.

## 2. Base de datos (Supabase)

Las tablas, las reglas de seguridad (RLS), los buckets y los datos iniciales están en `supabase/migrations/`
(7 archivos, en orden). Ya están aplicados en tu proyecto. Si algún día creas otro proyecto:

```bash
npx supabase login
npx supabase link --project-ref TU-REF       # el REF está en la URL de tu proyecto
npx supabase db push
```

Si no usas la línea de comandos, abre *SQL Editor* en Supabase y ejecuta cada archivo de `supabase/migrations/`
**en orden** (0001 a 0007). Después crea tu cuenta (paso 5) y registra tu correo como administradora.

## 3. Publicarlo en internet (Vercel)

1. Crea cuentas gratis en [github.com](https://github.com) y [vercel.com](https://vercel.com) (en Vercel entra con GitHub).
2. En GitHub: **New repository** → nombre `abaco-del-tiempo` → **Create**. Déjalo vacío.
3. En la carpeta del proyecto, en la terminal:
   ```bash
   git remote add origin https://github.com/TU-USUARIO/abaco-del-tiempo.git
   git push -u origin main
   ```
   (GitHub te pedirá iniciar sesión la primera vez.)
4. En Vercel: **Add New → Project** → elige el repositorio → **Import**.
5. Antes de pulsar *Deploy*, abre **Environment Variables** y agrega las tres variables de la tabla de arriba
   (`VITE_SITE_URL` puede ser provisional; la corriges en el paso 6).
6. Pulsa **Deploy**. Cuando termine, Vercel te da una dirección (`https://algo.vercel.app`).
   Ve a *Settings → Environment Variables*, corrige `VITE_SITE_URL` con esa dirección y haz **Redeploy**.

### Después de publicar: configura Supabase (importante)

En Supabase → **Authentication → URL Configuration**:

- **Site URL:** tu dirección de Vercel.
- **Redirect URLs:** agrega `https://TU-DIRECCION.vercel.app/admin`

Sin esto, los enlaces de invitación y de recuperar contraseña no llevarán al lugar correcto.
Además, en **Authentication → Sign In / Providers**, deja **desactivado** «Allow new users to sign up»
(las cuentas se crean solo por invitación) y en **Email** pon el largo mínimo de contraseña en 10.

## 4. Invitar a tus compañeros

1. Entra a `/admin` → pestaña **Equipo** → sección «Cuentas de integrantes».
2. Escribe el correo del compañero, elige su ficha y pulsa **Registrar correo**.
3. En Supabase: **Authentication → Users → Invite user** y escribe **el mismo correo**.
4. La persona abre el enlace del correo (vale 24 horas si ajustaste *Email OTP expiration* a 86400), crea su contraseña
   y entra. Su cuenta queda enlazada sola con su ficha.

**Qué puede hacer cada rol**

| | Visitante | Integrante | Administradora |
|---|---|---|---|
| Ver el portafolio publicado | ✅ | ✅ | ✅ |
| Escribir sus propias reflexiones | ❌ | ✅ (solo las suyas) | ✅ (las de todos) |
| Subir evidencias | ❌ | ✅ (como borrador, las apruebas tú) | ✅ |
| Editar todo lo demás | ❌ | ❌ | ✅ |

Para quitarle el acceso a alguien, bórralo en Supabase → *Authentication → Users*.

## 5. Usar el panel (`/admin`)

Entra desde el pie de página («Modo edición») o escribiendo `/admin`. La sesión se cierra sola tras 30 minutos sin actividad.

| Pestaña | Para qué sirve |
|---|---|
| Datos generales | Textos de portada, curso, docente, periodo, objetivos y reflexiones |
| Fases y entregas | Fechas, estado y descripción de cada fase; **subir o reemplazar el PDF/Word** de la entrega |
| Línea de tiempo y recursos | Pega el enlace de la línea de tiempo y de cada recurso interactivo |
| Videos | Pega el enlace (YouTube, Vimeo, Drive…); se detecta la plataforma. **Activa los subtítulos en el video original** |
| Galería | Sube imágenes (varias a la vez); cada una pide título y descripción. Aprueba las de tus compañeros |
| Bitácora | Escribe o corrige reflexiones de cualquiera |
| Equipo | Fichas, fotos y cuentas de integrantes |
| Quiz | Preguntas del mini-quiz |
| Referencias | Formulario guiado en APA 7 o referencia ya hecha (cursiva con `*asteriscos*`) |

Todo lo nuevo nace como **Borrador**: no se ve en el sitio hasta que lo pongas en **Publicado**.
Los enlaces solo se incrustan si son de los sitios permitidos (YouTube, Vimeo, Google Drive/Docs, Genially, Canva, Prezi, Padlet,
Wordwall, Liveworksheets, Mentimeter, TimelineJS y OneDrive); los demás se abren en una pestaña nueva.

## 6. Seguridad en una frase

La seguridad real está en la base de datos (RLS): aunque alguien abra el código del sitio, no puede escribir nada sin su rol.
`vercel.json` agrega cabeceras de seguridad y la lista blanca de iframes. Los archivos se validan por su contenido real
(no por la extensión) y los buckets limitan tipo y tamaño (PDF/Word 20 MB; imágenes 8 MB).

## 7. Revisar en tu celular (Chrome de Android)

Cuando esté publicado, abre la dirección en Chrome de tu celular y comprueba:

1. La carta se abre al tocar el sello y la portada se ve completa.
2. El menú de hamburguesa abre y lleva a cada sección.
3. En Aprendizajes, abre una fase con documento y toca **Ver documento** (PDF y Word se ajustan al ancho).
4. En Galería, toca una imagen y desliza para pasar a la siguiente.
5. En Bitácora, toca una tarjeta y se voltea.
6. Entra a `/admin` e inicia sesión: el teclado no debe tapar los campos.

## 8. Si algo falla

| Síntoma | Qué hacer |
|---|---|
| La pantalla sale en blanco con «Faltan VITE_SUPABASE_URL…» | Falta el `.env` (local) o las variables en Vercel |
| Al subir un archivo dice «Debes iniciar sesión» | La sesión caducó: vuelve a entrar |
| «No tienes permiso» al guardar | Tu cuenta no es administradora o no está enlazada a su ficha |
| El enlace de invitación no sirve | Venció o ya se usó: invita de nuevo desde Supabase |
| Un recurso no se ve incrustado | Algunos sitios lo prohíben; usa «Abrir en pestaña nueva» |
| No llegan los correos de invitación | Supabase gratis limita los correos por hora; espera o revisa la carpeta de spam |

## 9. Estructura

```
src/features/    secciones del portafolio, la carta de apertura y el panel (admin/)
src/components/  piezas reutilizables (acordeón, modal, formularios…)
src/lib/         conexión a Supabase, enlaces incrustables, APA, validación de archivos
supabase/migrations/   tablas, seguridad y datos iniciales
vercel.json      cabeceras de seguridad
```
