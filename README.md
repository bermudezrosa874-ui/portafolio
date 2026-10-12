# Ábaco del Tiempo

Portafolio digital académico de **Historia de las Matemáticas** (Licenciatura en Matemáticas, UNAD), elaborado por
Rosalinda Bermudez Urbay como trabajo colaborativo. Tiene una carta de apertura animada, entregas por fases con visor de PDF y
Word, línea de tiempo, entrevistas (videos), recursos interactivos, aportes del equipo, galería, bitácora, equipo y referencias en
APA 7. Se edita desde un panel (`/admin`).

**Tecnología:** Vite + React + TypeScript + Tailwind · Supabase (base de datos, cuentas, archivos y una función de servidor) ·
Vercel (publicación).

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

> ⚠️ **Nunca** pongas la clave `service_role` ni la de la IA en este proyecto ni en GitHub. El sitio solo necesita la `anon`.
> El archivo `.env` ya está en `.gitignore`: no se sube.

Otros comandos: `npm run build` (compila), `npm run preview` (ve la versión compilada), `npm run typecheck`.

## 2. Base de datos (Supabase)

Las tablas, las reglas de seguridad (RLS), los buckets y los datos iniciales están en `supabase/migrations/`
(19 archivos, en orden). Si creas otro proyecto:

```bash
npx supabase login
npx supabase link --project-ref TU-REF       # el REF está en la URL de tu proyecto
npx supabase db push
```

Las migraciones 0008 en adelante agregan: roles y aportes del equipo, avisos y actividad, el máximo de 6 cuentas, crear y
eliminar cuentas, actividades por fase, recursos/entrevistas/entregas abiertos a los colaboradores, espacios únicos por fase y
el cierre de fases.

## 3. Publicarlo en internet (Vercel)

1. Sube el código a GitHub (`git push`).
2. En [vercel.com](https://vercel.com): **Add New → Project** → elige el repositorio → **Import**.
3. Antes de pulsar *Deploy*, abre **Environment Variables** y agrega las tres variables de la tabla de arriba
   (`VITE_SITE_URL` puede ser provisional; la corriges después).
4. Pulsa **Deploy**. Cuando termine, Vercel te da una dirección (`https://algo.vercel.app`).
   Ve a *Settings → Environment Variables*, corrige `VITE_SITE_URL` con esa dirección y haz **Redeploy**.

En Supabase → **Authentication → Sign In / Providers**, deja **desactivado** «Allow new users to sign up»: las cuentas las crea Rosa
desde el panel. (Además, la base rechaza cualquier registro con un correo no autorizado o cuando ya hay 6 cuentas.)

## 4. Cuentas y roles

| | Docente (sin cuenta) | Colaborador | Administradora (Rosa) |
|---|---|---|---|
| Ver lo publicado del portafolio | ✅ solo lectura | ✅ | ✅ |
| Subir aportes, documentos, recursos, videos y línea de tiempo | ❌ | ✅ (cada espacio, una sola vez) | ✅ |
| Editar o eliminar lo que subió | — | ✅ solo lo suyo | ✅ todo |
| Escribir reflexiones | ❌ | ✅ solo las suyas | ✅ las de todos |
| Publicar u ocultar aportes, crear y eliminar cuentas, reabrir fases | ❌ | ❌ | ✅ |

- El **docente** no necesita cuenta: entra al portafolio y lo ve en modo lectura. La base de datos impide que un visitante escriba.
- Hay **máximo 6 cuentas**.
- **Crear la cuenta de un compañero:** panel → **Colaboradores** → botón **Crear cuenta** en su fila. Se escribe un correo (puede
  ser cualquiera) y una contraseña; la cuenta queda lista, sin confirmar nada. Rosa entrega esos datos.
- **No hay «Olvidé mi contraseña».** Cada persona puede cambiarla desde su perfil (pide la actual y la nueva). Si alguien la
  olvida, Rosa elimina su cuenta (sección «Cuentas») y la crea de nuevo.
- La sesión se cierra sola tras **1 hora** sin actividad.

## 5. Usar el panel (`/admin`)

Se entra con **Iniciar sesión** (al final del menú lateral del portafolio). El menú lateral cambia según el rol.

**Rosa:** Resumen (cifras, avisos de nuevos aportes y actividad) · Mis fases y aportes · Archivos del equipo (filtros por integrante,
estado y fase; botón **Publicar**) · Colaboradores (roles, crear y eliminar cuentas) · Datos generales · Fases y entregas ·
Línea de tiempo y recursos · Videos · Galería · Bitácora · Equipo · Referencias · Mi cuenta.

**Colaboradores:** Inicio · Fases y entregas · Mis fases · Línea de tiempo y recursos · Entrevistas · Mis aportes · Subir recurso ·
Mi perfil.

## 6. Reglas del contenido por fase

- Cada fase tiene **un solo** documento de entrega, **un solo** recurso digital y **un solo** video o entrevista; la línea de tiempo
  es **una sola** para todo el portafolio. Cuando alguien ocupa un espacio, nadie más puede subir otro igual (quien lo subió o Rosa
  pueden cambiarlo).
- Dentro de cada fase, quien sube ve **«¿Qué hiciste en esta fase?»** con lo que falta. Si ya hay algo subido pregunta **«¿Hiciste
  algo más?»**; con **«No, la fase está completa»** la fase se cierra y deja de aceptar subidas (solo Rosa puede reabrirla).
- Cualquier integrante puede agregar **actividades con fecha** a una fase.
- Quien visita solo ve lo que existe: los bloques vacíos no aparecen.

## 7. Revisión automática con IA (opcional)

Cuando un colaborador sube un **aporte**, una función del servidor (`supabase/functions/review-contribution`) lo analiza con
DeepSeek: si está bien lo publica solo; si no, queda pendiente con el motivo para que Rosa decida. Está pensada para gastar muy
poco (modelo barato, solo un extracto del texto, una revisión por contenido).

Para activarla en un proyecto nuevo:

```bash
npx supabase secrets set DEEPSEEK_API_KEY=tu-clave        # la clave vive solo en Supabase, nunca en el código
npx supabase functions deploy review-contribution --use-api
```

Límites: lee el texto de PDF, Word y PowerPoint; las imágenes, los videos y los enlaces se juzgan solo por su título y descripción.
Si la IA falla o se acaba el saldo, nada se publica solo: queda pendiente para Rosa.

## 8. Seguridad en una frase

La seguridad real está en la base de datos (RLS y disparadores): aunque alguien abra el código del sitio, no puede escribir nada sin
su rol, ni editar lo ajeno, ni ocupar un espacio ya usado. `vercel.json` agrega cabeceras de seguridad y la lista blanca de iframes.
Los archivos se validan por su contenido real (no por la extensión) y los buckets limitan tipo y tamaño.

## 9. Si algo falla

| Síntoma | Qué hacer |
|---|---|
| La pantalla sale en blanco con «Faltan VITE_SUPABASE_URL…» | Falta el `.env` (local) o las variables en Vercel |
| Al subir un archivo dice «Debes iniciar sesión» | La sesión caducó: vuelve a entrar |
| «No tienes permiso» al guardar | La cuenta no tiene ese rol o el espacio ya está ocupado |
| «Esta fase está completa» | Rosa puede reabrirla desde la propia fase en Aprendizajes |
| Un aporte queda «Pendiente» con un motivo | La revisión automática no lo aprobó: corrígelo o pídele a Rosa que lo publique |
| Un recurso no se ve incrustado | Algunos sitios lo prohíben; usa «Abrir en pestaña nueva» |

## 10. Estructura

```
src/features/    secciones del portafolio, la carta de apertura y los paneles (admin/, contributions/)
src/components/  piezas reutilizables (menú lateral, modal, formularios…)
src/lib/         conexión a Supabase, enlaces incrustables, APA, validación de archivos
supabase/migrations/   tablas, seguridad y datos iniciales
supabase/functions/    revisión automática de aportes (IA)
vercel.json      cabeceras de seguridad
```
