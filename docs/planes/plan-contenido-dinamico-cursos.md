# Contenido dinámico en BD + cursos + consola del profesorado + pantalla completa

> **Vigente (2026-11-22).** Fases 0 a 4 implementadas; el resto pendiente. Las decisiones marcadas con ❓ están pendientes de confirmar.
> Sustituye en parte a `docs/plan-base-datos-usuarios.md`: aquel plan identificaba a cada alumno con nombre + PIN; ahora los alumnos **no se identifican**, así que la parte de usuarios/PIN queda descartada. De aquel plan se reutiliza la parte técnica de la BD (Supabase + `pg` + migraciones propias).

## 1. Objetivo

Pasar de una web con todo el contenido en el código a una herramienta en tres capas:

1. **Datos** (Postgres): cursos, asignaturas, modos y preguntas.
2. **API** (Express): lectura pública para alumnos; escritura protegida para el profesorado.
3. **Presentación** (React): web de alumnos (sin login, por curso) y consola del profesorado (con contraseña).

Que un profesor (o tú) pueda crear un curso, añadirle asignaturas, crear modos y escribir/editar preguntas **sin tocar código ni redesplegar**.

## 2. ¿Empezar de cero o evolucionar?

**Recomendación: evolucionar, pero reescribiendo las capas exteriores.** No empezar de cero.

| Se conserva (es lo valioso y está testeado) | Se reescribe |
|---|---|
| Motor de ejercicios: `frontend/src/logic/*` (generadores, `comprobarRespuesta`, normalización de texto) | Navegación (`App.jsx` con `useState('pantalla')`) → rutas reales con URL |
| Componentes visuales: `Reloj`, `Figura`, `Volcan`, `Riu` | `perfiles.js` (árbol fijo Peque/Mayor) → árbol que llega de la API |
| `Practica.jsx` (adaptado: recibe el modo ya resuelto) | `Home`, `Asignatura`, `Modo` → pantallas por curso |
| ~75 tests de Vitest y 22 e2e (se adaptan) | Backend: rutas por JSON fijo → API sobre BD |
| Despliegue Railway/GHCR | CSS de layout (`max-width: 480px`) → layout a pantalla completa |

Empezar de cero obligaría a reescribir 9 generadores de potencias, geometría, *there be*, etc., que ya funcionan, sin ganar nada.

### La clave conceptual: dos tipos de contenido

No todo el contenido puede vivir en la BD, porque parte es **código**:

- **Contenido de banco** (problemas, vocabulario, preguntas de Medi, gramática): son datos puros → van a la BD y se editan desde la consola.
- **Contenido generado** (sumas, restas, horas, potencias, perímetros, sucesiones, *there be*…): lo produce un generador en JS → el generador sigue en el código, pero **qué generadores usa un modo, con qué dificultad y parámetros** se guarda en la BD y se configura desde la consola.

Así, en la consola un profesor crea un modo eligiendo *"tipo: banco de preguntas"* (y escribe las preguntas) o *"tipo: ejercicios generados"* (y marca qué generadores y nivel). Añadir un **generador nuevo** seguirá requiriendo código; añadir **contenido** no.

## 3. Modelo de datos (propuesta)

```sql
cursos        (id, slug, nombre, orden, activo, config JSONB)
              -- p.ej. '1-primaria', '6-primaria'; config: { soloMayusculas, celebracion, nivelDefecto }
asignaturas   (id, curso_id → cursos, slug, nombre, color, icono, orden, activo)
modos         (id, asignatura_id → asignaturas, slug, nombre, color, orden, activo,
               tipo TEXT CHECK (tipo IN ('banco','generado','mixto')),
               config JSONB)
              -- config generado: { generadores: ['suma','resta'], nivel: 'facil', params: {...} }
              -- config banco:    { formato: 'opcion_multiple'|'numerica'|'texto', direccionAleatoria, audio }
preguntas     (id, modo_id → modos, formato, enunciado, opciones JSONB, respuesta TEXT,
               alternativas JSONB, imagen_url, puntos, orden, activo, actualizado_en)
profesores    (id, email UNIQUE, nombre, password_hash, rol ('admin'|'profesor'), activo, creado_en)
profesor_cursos (profesor_id, curso_id)      -- ❓ solo si se quieren permisos por curso
sesiones_admin  (token_hash, profesor_id, caduca_en)
_migrations
```

- `activo` permite ocultar sin borrar (un profesor prepara un tema y lo publica cuando quiere).
- `slug` da URLs legibles: `/6-primaria/matematicas/potencies`.
- `formato` por pregunta cubre lo que hay hoy: opción múltiple (Medi, gramática), numérica (problemas), texto con sinónimos (vocabulario escrito).
- Vocabulario: cada palabra es una pregunta con `enunciado`=inglés, `respuesta`=catalán, `alternativas`=sinónimos; el modo decide si se pregunta con opciones o escrito y en qué dirección. Así *Vocabulario* y *Vocabulario escrito* comparten las mismas filas (como hoy comparten el JSON).

**Migración inicial de datos**: un script `seed` que vuelca los JSON actuales + el árbol de `perfiles.js` a la BD (Peque → curso "1r de primària", Mayor → "6è de primària"), para que el día del cambio la web se vea igual que ahora.

## 4. Backend

- `backend/src/db/` — `cliente.js` (`pg.Pool`, TLS), `migrar.js` (runner con `_migrations` + advisory lock), `migraciones/001_inicial.sql`, `seed.js`.
- `backend/src/app.js` separado de `server.js` (testeable).
- **API pública (alumnos, solo lectura, solo `activo = true`)**
  - `GET /api/cursos`
  - `GET /api/cursos/:curso` → curso con sus asignaturas y modos (árbol completo, una sola petición)
  - `GET /api/modos/:id/preguntas`
- **API de profesorado (`/api/admin/*`, requiere sesión)**
  - `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/yo`
  - CRUD de cursos, asignaturas, modos, preguntas (+ reordenar, activar/desactivar)
  - Importar/exportar preguntas de un modo en CSV/JSON (para pegar de golpe un listado de vocabulario)
  - `GET /api/admin/generadores` → lista de generadores disponibles en el código y sus parámetros, para rellenar el formulario
  - Gestión de profesores (solo rol `admin`)
- **Seguridad**
  - Contraseñas con `scrypt` de `node:crypto` (sin dependencias).
  - Sesión con cookie `httpOnly`, `Secure`, `SameSite=Strict`; token aleatorio guardado con hash en BD, caducidad (p.ej. 7 días).
  - Limitador de intentos de login (en memoria, por IP+email).
  - Validación de entrada en todas las rutas de escritura.
  - Primer admin creado por script/variable de entorno (`ADMIN_EMAIL`, `ADMIN_PASSWORD` solo en el primer arranque).

## 5. Frontend

### 5.1 Rutas (añadir `react-router-dom`)

```
/                                 → elegir curso
/:curso                           → asignaturas del curso
/:curso/:asignatura               → modos
/:curso/:asignatura/:modo         → práctica
/:curso/repasar                   → "Para repasar" (localStorage, por curso)
/profesorado                      → login
/profesorado/*                    → consola
```

Ventajas: el botón "atrás" del navegador funciona, y se puede guardar en favoritos el curso de cada niño (p.ej. el móvil de Nil abre directamente `/6-primaria`). ❓ Opcional: recordar el último curso en `localStorage` y entrar directamente.

### 5.2 Web de alumnos
- El árbol curso → asignaturas → modos llega de `GET /api/cursos/:curso` (sustituye a `perfiles.js`).
- `Practica.jsx` recibe el modo ya resuelto (tipo + config) y, si es de banco, pide `GET /api/modos/:id/preguntas`. El registro `GENERADORES` se queda igual.
- "Para repasar" sigue en `localStorage` (no hay alumnos identificados), con la clave por curso en vez de por perfil.
- El estilo "Peque" (mayúsculas, letra grande, celebración) pasa a ser `config` del curso.
- Los colores, ahora variables CSS fijas por modo, pasan a ser un campo `color` en la BD.

### 5.3 Consola del profesorado
- Layout de administración: barra lateral (cursos → asignaturas → modos) + panel de edición.
- Formularios: crear/editar curso, asignatura, modo (eligiendo tipo y generadores), y **editor de preguntas** en tabla editable (añadir fila, duplicar, borrar, reordenar, activar/desactivar).
- **Vista previa**: botón "Probar este modo" que abre la práctica tal como la verán los alumnos, incluso si el modo aún está inactivo.
- Importar desde CSV/pegado de texto (el caso típico: te llega una hoja de vocabulario y la pegas).

### 5.4 Pantalla completa
- Quitar `max-width: 480px` y el centrado vertical del `body`.
- Layout con cabecera fija (curso actual, migas de pan, enlace a repasar) y contenido que ocupa todo el ancho.
- Selección de curso/asignatura/modo como **rejilla de tarjetas** (`grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`), que en móvil queda en 1-2 columnas y en PC/tablet en 4-6.
- Pantalla de práctica en dos zonas en pantallas anchas: ejercicio grande a la izquierda/centro, panel lateral con marcador y "Anterior". En móvil, apiladas como ahora.
- Tipografía y botones escalados con `clamp()` para que no se vean diminutos en una pantalla grande.

## 6. Fases propuestas

Cada fase es desplegable por sí sola y la web nunca deja de funcionar.

| Fase | Contenido | Resultado visible |
|---|---|---|
| **0** | `CLAUDE.md` con índice/mapa de docs; mover planes a `docs/planes/` | — |
| **1** | Pantalla completa + `react-router` + rutas por curso, **aún con datos en código** | La web ya ocupa toda la pantalla y tiene URLs |
| **2** | BD (Supabase), migraciones, seed desde los JSON actuales, API pública de lectura | Nada cambia a la vista, pero el contenido ya sale de la BD |
| **3** | Frontend lee el árbol y las preguntas de la API; se borran `perfiles.js` y los JSON | La web es 100 % dinámica |
| **4** | Login del profesorado + sesión + gestión de profesores | Consola protegida (vacía) |
| **5** | CRUD de cursos/asignaturas/modos/preguntas + vista previa + importación CSV | Los profesores ya pueden editar |
| **6** | Configuración de modos generados (generadores + nivel + parámetros) | También se configuran los modos de cálculo |
| **7** | Alumnos: àlies + PIN, partidas, rècords por modo, "Per repassar" en BD; adiós `localStorage` | Puntuación persistente |

Hacer la fase 1 antes de la BD da un resultado visible rápido y separa el riesgo "cambio visual" del riesgo "cambio de datos".

## 7. Tests
- Vitest del motor (`logic/*`): sin cambios salvo `perfiles.test.js`, que pasa a testear la resolución de modos desde el árbol de la API.
- Backend con Vitest contra una BD de pruebas (`describe.skipIf(!process.env.DATABASE_URL)`): API pública solo devuelve lo activo; rutas admin rechazan sin sesión; login, limitador, CRUD.
- e2e: se adaptan las 22 pruebas a las nuevas URLs y se añaden pruebas de la consola (login, crear modo de banco con 3 preguntas, verlo como alumno).

## 8. Infraestructura
- Proyecto Supabase nuevo (lo crea el usuario) → `DATABASE_URL` en `backend/.env` y en Railway.
- Variables nuevas: `DATABASE_URL`, `SESSION_SECRET` (si se firma la cookie), `ADMIN_EMAIL`/`ADMIN_PASSWORD` (solo primer arranque).
- ❓ Imágenes subidas por profesores: Supabase Storage (fase posterior; de momento `imagen_url` admite una URL).
- Copias de seguridad: Supabase hace backups diarios en el plan gratuito limitado; además, un `make export-contenido` que vuelque la BD a JSON en el repo de vez en cuando.

## 9. Decisiones

### Confirmadas (2026-11-22)
1. **Curso = nivel educativo** (1r, 2n… de primària), no año académico. No hay archivado anual.
2. **Profesorado: una contraseña compartida** de momento. Se simplifica la fase 4: sin tabla `profesores` ni roles; la contraseña va con hash en una variable de entorno (`ADMIN_PASSWORD_HASH`) y el login crea una sesión con cookie. Se deja el diseño preparado para pasar a cuentas individuales más adelante.
3. **Se empieza por la fase 1** (diseño de pantallas).
4. **Interfaz en catalán** (toda: botones, mensajes, títulos). El contenido de cada asignatura va en su idioma (inglés en Anglès, etc.).
5. **Supabase** como BD.
6. **Se elimina el `localStorage` actual** cuando llegue la fase de alumnos: "Per repassar" pasa a la BD, ligado al àlies.
7. **Puntuación: opción B** (ver apartado 11).

### Pendiente ❓
- Detalles de la puntuación (ver apartado 11).

## 10. Riesgos
- **Generadores siguen en código**: un profesor no puede inventar un tipo de ejercicio nuevo, solo usar los existentes. Se mitiga haciendo que el tipo "banco" sea muy flexible.
- **Si cae la BD, cae la web** (hoy los JSON van dentro de la imagen). Mitigación opcional: caché en memoria del árbol de cursos en el backend.
- **Contenido editable por terceros**: un error de un profesor se ve al instante. Mitigación: `activo` + vista previa + (opcional) registro de cambios.
- **Medi con diagramas** (`Volcan`, `Riu`) son componentes SVG con partes interactivas: se registran como un generador más (`medi-imatge`) y no se editan desde la consola.

## 11. Puntuación de los alumnos

Hoy la puntuación solo existe durante la partida (se pierde al acabar) y "Para repasar" vive en `localStorage`, que se va a eliminar. Para que la puntuación **persista** hay que saber de quién es, lo que choca con "sin identificarse". Opciones:

| Opción | Cómo funciona | Pros | Contras |
|---|---|---|---|
| **A. Solo de partida** | Como ahora: puntos durante la sesión y resumen final | Cero fricción, nada que guardar | No hay histórico ni ranking |
| **B. Àlies opcional + PIN** *(recomendada)* | Se navega y se juega sin identificarse. Quien quiera guardar puntos escribe un àlies; la primera vez se genera un PIN de 4 dígitos ("apunta'l"). Con àlies + PIN recupera sus puntos en cualquier dispositivo | Persistente y multi-dispositivo; permite ranking por curso, histórico y "Per repassar" por alumno en la BD | Un poco de fricción (opcional); PIN olvidado = àlies nuevo o reset desde la consola |
| **C. Àlies sin PIN** | Solo un nombre | Muy simple | Cualquiera puede jugar como otro; nombres duplicados |

Con B, el modelo añadiría `alumnes (id, curs_id, alies, pin_hash, creat_en)`, `partides (alumne_id, mode_id, punts, encerts, errors, creat_en)` y `errors_repas (alumne_id, pregunta/enunciat, vegades)`. La consola permitiría ver, renombrar, resetear PIN y borrar àlies (moderación de nombres inapropiados). Al ser menores, se pide àlies, nunca nombre y apellidos.

### Decidido (2026-11-22)
- **Opción B** (àlies opcional + PIN).
- **Puntos por partida, sin acumular, por asignatura**: no hay un total que crece jugando; cada partida tiene su puntuación y lo que se guarda/muestra es el **rècord** (mejor partida). Objetivo: que el niño repita para superar su marca, no que sume por volumen.

### Pendiente ❓
- **Partidas comparables**: hoy el modo es libre (sin número fijo de preguntas), así que quien juega más rato saca más puntos y el rècord premiaría la duración, no el acierto. Propuesta: cuando el alumno está identificado, la partida tiene **un número fijo de preguntas** (p.ej. 10, configurable por modo desde la consola) y el modo libre queda para quien juega sin àlies.
- **Rècord por asignatura o por modo**: los modos de una asignatura dan puntos distintos (un problema vale 20, una suma 10). Propuesta: guardar el rècord **por modo** y mostrarlos agrupados por asignatura.
- **Ranking del curso** (los 10 mejores àlies por modo) sí/no.

## 12. Detalle de la fase 1 (diseño de pantallas) ✅ hecha

Sin BD todavía: los datos siguen en el código, pero ya con la estructura final.

1. **`perfiles.js` → `cursos.js`**: `CURSOS = { '1-primaria': { nom, config: { soloMayusculas, celebracio }, assignatures: {...} }, '6-primaria': {...} }`. Peque → 1r, Mayor → 6è. Peque pasa a tener también la capa de asignatura (Matemàtiques con Sumes/Restes/Hores). `obtenerModo(curso, asignatura, modo)` mantiene la búsqueda por `id`.
2. **`react-router-dom`** con las rutas del apartado 5.1 (sin `/profesorado` todavía). `App.jsx` pasa a ser un layout con cabecera + `<Outlet />`. El servidor Express ya devuelve `index.html` para cualquier ruta, así que el deep-linking funciona en Railway sin cambios.
3. **Layout a pantalla completa**: cabecera con nombre del curso y migas de pan; rejillas de tarjetas para cursos/asignaturas/modos; práctica en dos columnas en pantallas anchas (ejercicio + panel de marcador/"Anterior"); `clamp()` en tipografía. El estilo de 1r (mayúsculas, letra grande) se aplica por `config` del curso.
4. **Traducción al catalán** de toda la interfaz (títulos, botones, mensajes, resumen). Se agrupan los textos en un único módulo `textos.js` para no tenerlos dispersos.
5. **"Per repassar"**: se mantiene en `localStorage` (clave por curso en vez de por perfil) hasta la fase de alumnos; entonces pasa a la BD por àlies y se elimina el `localStorage`.
6. **Tests**: `perfiles.test.js` → `cursos.test.js`; e2e adaptados a las nuevas URLs y textos en catalán.

**Notas de implementación:** los colores de curso/asignatura/modo pasaron de clases CSS a campos `color`/`sombra` en `cursos.js` (se pintan con variables CSS `--fons`/`--sombra`), igual que vendrán de la BD. Slugs en catalán (`matematiques`, `angles`, `sumes-restes`…). Los textos de la interfaz están en `frontend/src/textos.js`; las instrucciones de *there be* y las etiquetas accesibles de los diagramas, traducidas en su propio fichero. Los enunciados del banco de problemas siguen en castellano (es contenido: se editará desde la consola). Se corrigieron 2 tests e2e intermitentes que ya existían antes.

## 13. Detalle de la fase 2 (BD + API de lectura) ✅ hecha

- **Tablas** (`backend/src/db/migraciones/001_inicial.sql`): `cursos`, `asignaturas`, `modos`, `bancos`, `preguntas` (+ `_migrations`). Cambio respecto al §3: las preguntas cuelgan de un **banco**, no de un modo, y cada modo apunta a un banco (`banco_id`). Así varios modos comparten preguntas (Vocabulari y Vocabulari escrit usan el mismo banco). Formatos de banco: `numerica`, `traduccio`, `opcio_multiple`. Los modos guardan `operaciones` (tipos de generador) tal cual estaban en `cursos.js`; la configuración más rica (nivel/parámetros por modo) queda para la fase 6.
- **RLS activado** en todas las tablas sin políticas: la API REST automática de Supabase no puede leerlas ni escribirlas; el backend conecta como propietario y no le afecta.
- **Migraciones**: se aplican solas al arrancar (con candado `pg_advisory_lock`); si fallan, el backend no arranca.
- **Seed** (`make seed`): vuelca `cursos.js` + los JSON. Solo crea lo que falta y no toca un banco que ya tenga preguntas, para no pisar en el futuro lo editado desde la consola. Cargado en producción el 2026-11-22 (2 cursos, 4 asignaturas, 16 modos, 4 bancos, 269 preguntas).
- **API**: `GET /api/cursos`, `GET /api/cursos/:curso` (árbol), `GET /api/bancos/:banco/preguntas`. Los endpoints antiguos (`/api/problemas`, `/api/vocabulario`, `/api/gramatica`, `/api/medi`) se mantienen leyendo de la BD y devuelven exactamente lo mismo que los JSON (lo comprueba un test); se retiran en la fase 3.
- **Dev = prod**: el plan gratuito de Supabase permite 2 proyectos (el otro es basquetstats), así que local y Railway usan la misma BD. Los tests usan el esquema `test` (variable `DB_SCHEMA`); a partir de la fase 5, lo que se cree para probar se deja inactivo.
- **Conexión**: Session pooler (IPv4) con TLS; el `search_path` se fija como parámetro de inicio de cada conexión.

## 14. Detalle de la fase 3 (frontend sobre la API) ✅ hecha

- **Carga**: `frontend/src/logic/api.js` (`obtenerCursos`, `obtenerCurso`, `obtenerPreguntas`) con caché en memoria durante la visita (los errores no se cachean); hook `useApi` + componente `AmbDades` para "Carregant…", error con "Torna-ho a provar" y "no trobat" (404).
- **Preguntas en forma genérica** (`enunciado`, `respuesta`, `opciones`, `alternativas`): `vocabulario.js` dejó `ingles`/`catalan`; los problemas convierten la respuesta a número. Sin capa de traducción del formato antiguo.
- **Protección**: los tipos de ejercicio desconocidos de un modo se ignoran (`operacionesConocidas`); si no queda ninguno válido, el modo muestra "Aquest mode encara no està disponible." (importante cuando el árbol lo edite un profesor).
- **Retirado**: datos de `cursos.js` (queda solo con búsquedas), los JSON de `backend/src/data/`, los endpoints `/api/problemas|vocabulario|gramatica|medi` y `legado.js`.
- **Copia del contenido**: `backend/datos/contenido.json` (`make export-contenido`), fuente de `make seed` y de los tests del backend (que comprueban que sembrar + exportar es un viaje de ida y vuelta exacto). La fuente de verdad es la BD.
- **e2e**: leen las respuestas correctas de la API y esperan a que el modo haya cargado antes de responder (`irAModo`); nuevos tests de tipo desconocido, API caída con reintento y curso inexistente.

## 15. Detalle de la fase 4 (acceso a la consola) ✅ hecha

- **Contraseña compartida** en la variable `TEACHER_PASSWD` (backend/.env y Railway), comparada en tiempo constante (hashes SHA-256 + `timingSafeEqual`). Sin la variable, `/api/admin/*` responde 503 y la web de alumnos sigue funcionando.
- **Sesiones** en `sesiones_profesorado` (migración 002): solo el hash SHA-256 del token, caducidad fija de 7 días; las caducadas se limpian en cada login. Cookie `sessio_professorat`: HttpOnly, SameSite=Strict (también protege de CSRF), `Path=/api/admin`, Secure en producción.
- **Rutas**: `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/sessio`; todo lo demás bajo `/api/admin` exige sesión (401). Los editores de la fase 5 cuelgan de ahí.
- **Límite de intentos**: 5 fallos por IP → bloqueo de 15 min (429), en memoria; un acierto reinicia el contador. `trust proxy` activado para usar la IP real tras el proxy de Railway.
- **Slugs reservados**: la BD impide cursos llamados `profesorat` o `api`.
- **Frontend**: `/profesorat` (login) y `/profesorat/consola/*` (esqueleto con "Tanca la sessió"); enlace discreto "Professorat" en el pie de inicio. Ojo con el ranking de rutas: `/profesorat/*` perdía contra `/:curso/:asignatura/:modo`, por eso la consola va en `/profesorat/consola/*`.
- **Tests**: backend con contraseña de prueba propia (`vitest.config.js`); e2e leen `TEACHER_PASSWD` de `backend/.env` solo en local y se saltan contra producción.

## 16. Fase 5 (editores de la consola), dividida en subfases

Acordado el 2026-11-22. Cada subfase se despliega por separado.

| Subfase | Contenido | Estado |
|---|---|---|
| **5a** | e2e en su propio esquema (`e2e`) para que los editores no escriban en la BD real. Consola de solo lectura: árbol lateral curso → asignatura → modo y bancos (incluido lo inactivo), ficha de modo y de banco | ✅ hecha |
| **5b** | Editar preguntas de un banco (formulario según formato, validaciones), añadir, activar/desactivar, borrar con confirmación | ✅ hecha |
| **5c** | Importar preguntas pegando texto/CSV con vista previa de errores; exportar banco a CSV y copia completa en JSON | ✅ hecha |
| **5d** | Cursos y asignaturas: crear/editar (nombre, icono, color, nivel, config), activo, orden | siguiente |
| **5e** | Modos y bancos: crear/editar modos (tipos de ejercicio, banco), crear bancos | pendiente |
| **5f** | Vista previa: "Prova aquest mode" aunque esté inactivo | pendiente |

**Decisiones:**
1. Las preguntas se pueden borrar (con confirmación). Cursos, asignaturas, modos y bancos solo se borran si están vacíos; si no, se desactivan.
2. El slug (la URL) se fija al crear y no se edita; el nombre visible sí.
3. Ediciones simultáneas: gana el último que guarda (sin bloqueo de momento).
4. Los cambios son inmediatos en la web real (dev = prod); lo que se prepara se deja inactivo hasta que esté listo.

### 5a ✅ hecha (2026-11-22)
- **e2e aislados**: Playwright arranca su propio backend (puerto 3199, `DB_SCHEMA=e2e`, contraseña de prueba) y frontend (5199); antes, `backend/scripts/preparar-e2e.js` recrea el esquema `e2e` desde `contenido.json` (se niega a tocar `public`). Ya no se reutiliza `npm run dev`.
- **API**: `GET /api/admin/contingut` (árbol con ids de la BD y lo inactivo + resumen de bancos con preguntas activas/total) y `GET /api/admin/bancs/:id` (todas las preguntas y los modos que usan el banco). Ids como entero (`::int`).
- **Consola**: árbol lateral (inactivo en gris con etiqueta), resumen, ficha de modo (adreça, estat, color, tipus d'exercici con nombre legible, banc) y ficha de banc (tabla de preguntas). En móvil la ficha va antes que el árbol.

### Cursos 2n–5è (2026-11-22)
Creados inactivos y sin asignaturas (en la BD y en `contenido.json`), entre 1r y 6è. Un curso activo sin asignaturas muestra "Encara no hi ha assignatures en aquest curs.".

### 5b ✅ hecha (2026-11-22)
- **API**: `POST /api/admin/bancs/:id/preguntes`, `PATCH /api/admin/preguntes/:id` (parcial; se valida la pregunta entera; solo enunciado/respuesta/opciones/activo), `DELETE /api/admin/preguntes/:id`. Errores de validación: 400 `{ error: 'validacio', camps: { campo: mensaje en catalán } }`.
- **Validación** (`backend/src/validacion/preguntas.js`): enunciado y respuesta no vacíos (máx. 1000/300); numérica = número (coma o punto, se guarda con punto); opción múltiple = 2–6 opciones sin vacías ni repetidas y la correcta entre ellas. Las nuevas van al final del banco.
- **Consola**: buscador (sin acentos), "+ Afegeix pregunta", y por fila Edita / Activa-Desactiva / Esborra (confirmación en la fila). Formulario según formato; en opción múltiple la correcta se marca con un círculo. Aviso si una traducción lleva "/" (no saldrá en "Vocabulari escrit"). Los contadores del menú se actualizan al guardar.
- **e2e**: el esquema `e2e` tiene 3 bancos de prueba propios (`e2e-traduccio`, `e2e-numerica`, `e2e-opcions`) sin modo asociado; los tests de edición trabajan solo con ellos y en serie, para no interferir con los de alumnos.

### 5c ✅ hecha (2026-11-22)
- **Formato** (una pregunta por línea, separador `;` o tabulador; comillas de CSV respetadas; cabecera y BOM ignorados): traducció `anglès;català`; numèrica `enunciat;resposta` (la respuesta es el último campo); opció múltiple `enunciat;correcta;incorrecta…`.
- **Importar** (`POST /api/admin/bancs/:id/importa` con `{ texto, importar?, inactivas? }`): sin `importar` devuelve la vista previa (ok / error con el mensaje de la validación de 5b / repetida, comparando enunciados sin mayúsculas ni acentos, también dentro del propio texto). Con `importar` guarda solo las correctas en una transacción, al final del banco, opcionalmente inactivas. Máx. 1000 líneas; JSON hasta 1 MB.
- **Exportar**: `GET /api/admin/bancs/:id/csv` (mismo formato, con cabecera y BOM; en opción múltiple la correcta primero; incluye inactivas; ida y vuelta comprobada en tests) y `GET /api/admin/export` (copia completa, formato de `contenido.json`).
- **Consola**: botones "Importa" y "Descarrega CSV" en la ficha de banco (panel con texto o fichero, "Revisa", "Importa N preguntes"; si cambia el texto hay que revisar de nuevo) y "Descarrega còpia completa (JSON)" en el resumen.
- **e2e**: banco de prueba propio `e2e-importar` (separado de los de edición, que corren en paralelo).
