# Contenido dinámico en BD + cursos + consola del profesorado + pantalla completa

> **Vigente (2026-11-22).** Fases 0 a 5 implementadas; fase 7 en curso (7a y 7b hechas); la 6 en espera. Las decisiones marcadas con ❓ están pendientes de confirmar.
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
| **7** | Alumnos: àlies + PIN, bloques de preguntas, rècords por modo (personales y del curso), "Per repassar" en BD; adiós `localStorage` (ver §17) | Puntuación persistente |

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

### Decidido (2026-11-22, segunda ronda)
- **Bloques de N preguntas** en vez de partidas de longitud fija: el niño juega libre (como ahora) y las preguntas se cuentan en bloques; cada bloque completo es un resultado y el récord es el **mejor bloque**. Un bloque incompleto (al pulsar "Finalitza") no cuenta. Ejemplo: 70 preguntas → bloques 1-30 y 31-60 cuentan, 61-70 no.
- **Tamaño del bloque configurable**: por curso (30 por defecto; menos para los pequeños, p.ej. 10 en 1r) y, opcionalmente, por modo (p.ej. Problemes más corto).
- **Récord en puntos** (motiva más), mostrando también los aciertos ("240 punts · 28/30"). Se acepta que en modos que mezclan tipos de distinto valor el máximo de un bloque varíe un poco.
- **Récord por modo**, mostrado agrupado por asignatura.
- **Récords personales + récords del curso** (los mejores àlies de cada modo), activados por defecto con una casilla por curso para desactivarlos, y moderación de àlies en la consola.
- Ver el diseño por subfases en el §17.

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
| **5d** | Cursos y asignaturas: crear/editar (nombre, icono, color, nivel, config), activo, orden | ✅ hecha |
| **5e** | Modos y bancos: crear/editar modos (tipos de ejercicio, banco), crear bancos | ✅ hecha |
| **5f** | Vista previa: "Prova aquest mode" aunque esté inactivo | ✅ hecha |

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

### 5d ✅ hecha (2026-11-22)
- **API** (con sesión): `POST /api/admin/cursos`, `POST /api/admin/cursos/:id/assignatures`, `PATCH|DELETE /api/admin/cursos/:id` y `/api/admin/assignatures/:id`, `POST …/:id/mou` con `{ direccio: 'amunt' | 'avall' }` (intercambia con el vecino y renumera el orden). Borrar: 409 `no_buit` si tiene hijos.
- **Validación** (`backend/src/validacion/estructura.js`): nombre (máx. 60), slug solo al crear (formato URL, único en su nivel —UNIQUE de la BD— y no reservado: `profesorat`/`api`/`assets` para cursos, `repassar` para asignaturas), icono (emoji, opcional), color `#rrggbb` con la **sombra calculada** (30 % más oscura), nivel `facil|medio|dificil`, config `{ majuscules, celebracio }`. Lo nuevo se crea **inactivo** y al final.
- **Consola**: "+ Nou curs" en el menú; nombres de curso y asignatura enlazan a su ficha editable (con ↑ Puja / ↓ Baixa / Esborra —deshabilitado y explicado si no está vacío—, aviso si está activo sin hijos activos, enlace a la web si es visible) y "+ Nova assignatura" en la ficha de curso. La web de alumnos muestra "Encara no hi ha exercicis en aquesta assignatura." si una asignatura no tiene modos.
- **e2e**: crean y borran su propio curso de prueba (`prova-e2e`); el resumen de la consola no fija el número de cursos (varía en paralelo).

### 5e ✅ hecha (2026-11-22)
- **Catálogo de tipos en el servidor** (`backend/src/catalogo/tiposEjercicio.js`: tipo → formato de banco o null). Copia de la lista del frontend; `frontend/src/logic/tiposEjercicio.test.js` falla si dejan de coincidir (al añadir un generador nuevo hay que añadirlo en los dos sitios).
- **Modos** (`POST /api/admin/assignatures/:id/modes`, `PATCH|DELETE /api/admin/modes/:id`, `POST …/mou`): al menos un tipo, todos conocidos; si hay tipos de banco, banco obligatorio, existente y del formato que piden; no se mezclan tipos de formatos distintos; sin tipos de banco se guarda sin banco. El PATCH valida el modo entero (combinado con lo guardado). Borrar un modo no toca su banco.
- **Bancos** (`POST /api/admin/bancs`, `PATCH|DELETE /api/admin/bancs/:id`): formato y slug fijos al crear; solo se renombra; borrar solo sin preguntas y sin modos (409).
- **Consola**: "+ Nou mode" en la ficha de asignatura; ficha de modo editable (casillas agrupadas por tema, desplegable solo con bancos compatibles, aviso al mezclar formatos, Puja/Baixa/Esborra); "+ Nou banc" en el menú; en la ficha de banco, renombrar y borrar.
- **Nivel de los generadores**: sigue siendo por curso; la configuración fina por modo (antigua fase 6) queda pendiente de si hace falta.

### 5f ✅ hecha (2026-11-22) — fase 5 completa
- **Ruta** `/profesorat/prova/:modoId` (botón "Prova aquest mode ↗" en la ficha de modo, en otra pestaña): juega el modo aunque él, su asignatura o su curso estén inactivos. Lee de la API de la consola (con sesión; sin ella, al login). Sin cambios en el backend.
- Por defecto solo las preguntas activas; casilla "Inclou també les preguntes inactives". No apunta fallos en "Per repassar"; su resumen vuelve a la ficha del modo.
- **Refactor**: `PracticaModo` (en `Practica.jsx`) recibe un `entorno` (`rutaTorna`, `cargarPreguntas`, `registrarFallos`) y una `cabecera` opcional; para los alumnos se comporta igual que antes.

## 17. Fase 7 (alumnos y récords), dividida en subfases — propuesta

Aprobado el 2026-11-22. Decisiones: àlies **por curso**; bloque por defecto **10 en 1r, 15 en 2n, 30 de 3r a 6è** (configurable); sesión del alumno recordada **1 año** por dispositivo, **una por curso** (dos hermanos de cursos distintos pueden compartir dispositivo sin salir y entrar). Al escribir un àlies que no existe se pregunta antes de crearlo (evita àlies duplicados por errores de escritura).

### Modelo de datos (migración 003)
- `alumnes` (id, curso_id → cursos, àlies, àlies_normalizado, pin_hash, creado_en, ultimo_acceso), `UNIQUE (curso_id, àlies_normalizado)`: el àlies es único **dentro del curso** (sin mayúsculas ni acentos).
- `sesiones_alumnes` (token_hash, alumne_id, caduca_en): como las del profesorado, cookie HttpOnly propia; larga (1 año) para no pedir el PIN cada día; botón "Surt" para dispositivos compartidos.
- `blocs` (id, alumne_id, modo_id, puntos, aciertos, preguntas, creado_en): cada bloque completado. Récord personal = el bloque con más puntos (desempate: más aciertos, después el más antiguo). Récords del curso = el mejor bloque de cada àlies en ese modo, top 10.
- `fallos_alumnes` (alumne_id, modo/tipo, enunciado, respuesta, veces, ultima): "Per repassar" por àlies.
- Configuración: `cursos.config.bloc` (30 por defecto) y `cursos.config.recordsCurs` (true por defecto); `modos.bloc` (opcional, sustituye al del curso).
- Todo con RLS, como el resto.

### Subfases
| Subfase | Contenido |
|---|---|
| **7a** | **Àlies + PIN**: en la cabecera de cada curso "Entra amb el teu àlies" / "Hola, Nil · Surt". Àlies nuevo → el servidor genera un PIN de 4 cifras y lo muestra UNA vez ("apunta'l"); àlies existente → pide el PIN (límite de 5 intentos, como el login de la consola). Consola: sección "Àlies" por curso (ver, renombrar, resetear PIN —muestra el nuevo una vez—, borrar). |
| **7b** | **Bloques**: tamaño configurable en la ficha de curso y de modo; el marcador muestra "Bloc 2 · 12/30"; al completar un bloque se guarda (si hay àlies) y aparece un aviso breve ("Bloc completat: 240 punts · 28/30 · Nou rècord! 🏆") sin cortar el juego. Sin àlies, se ven los bloques pero no se guarda nada. |
| **7c** | **Récords**: en la página de cada asignatura, el récord del niño en cada modo (o "encara no hi has jugat"); en cada modo, "Rècords del curs" (top 10 àlies). Casilla por curso para desactivarlos. |
| **7d** | **"Per repassar" en la BD** por àlies (solo con àlies); se elimina el `localStorage`. |

### Riesgos aceptados
- **Los resultados de un bloque los calcula el navegador** y se envían al servidor: un niño muy espabilado podría falsearlos con las herramientas del navegador. El servidor valida límites (aciertos ≤ preguntas = tamaño del bloque, puntos ≤ máximo posible). Para niños de primaria y un proyecto así, aceptable.
- **PIN olvidado**: lo resetea un profesor desde la consola (no hay email).
- **Àlies inapropiados**: moderación desde la consola; los récords del curso se pueden desactivar por curso.

### 7a ✅ hecha (2026-11-22)
- **Migración 003**: `alumnes` (àlies único por curso sin mayúsculas ni acentos, `pin_hash` = sal + scrypt) y `sesiones_alumnes` (hash del token, 1 año). RLS.
- **API pública** `/api/alumnes`: `POST comprova` (¿existe?, sin crear nada), `POST crea` (genera el PIN, que solo sale en esa respuesta, y abre sesión), `POST entra` (àlies + PIN; 5 fallos por àlies → 15 min de bloqueo), `POST surt`, `GET jo?curs=`. Solo cursos activos. **Una cookie por curso** (`alumne_<id>`, `Path=/api/alumnes`, HttpOnly, SameSite=Strict): dos hermanos de cursos distintos comparten dispositivo sin salir y entrar.
- **Consola** (ficha de curso → "Àlies dels alumnes"): lista con fecha de creación y último acceso; canviar el nom (sin repetir en el curso), PIN nou (se muestra una vez; cierra las sesiones abiertas de ese àlies) y esborrar.
- **Web**: en la cabecera de cada curso, "👤 Entra amb el teu àlies" (diálogo en pasos: àlies → PIN, o "és un àlies nou, el vols crear?" → PIN grande "apunta'l") o "Hola, Nil! · Surt". El diálogo se pinta en `<body>` con un portal (el `backdrop-filter` de la cabecera encerraba el fondo fijo). La vista previa de la consola no muestra el àlies. Sin àlies se juega igual que antes.
- El limitador de intentos es ahora una fábrica (`crearLimitador`): uno para el login de la consola (por IP) y otro para los PIN (por curso + àlies).

### 7b ✅ hecha (2026-11-23)
- **Migración 004**: `modos.bloc` (opcional, 5–100) y tabla `blocs` (alumno, modo, puntos, aciertos, preguntas). Tamaño de bloque del curso en `cursos.config.bloc` (por defecto 30): fijado 1r = 10, 2n = 15, resto 30 (en la BD y en `contenido.json`).
- **Juego**: lógica pura en `frontend/src/logic/blocs.js` (tamaño = modo › curso › 30; cerrar bloque; mejor bloque). Marcador "Bloc N · k/T"; al completar un bloque, aviso de 6 s: con àlies se guarda y dice "Nou rècord! 🏆" o "El teu rècord: X punts"; sin àlies invita a entrar; en la vista previa, "no es guarda". El resumen lista los bloques de la partida (y avisa si el último quedó incompleto).
- **API** `POST /api/alumnes/blocs` (con sesión de alumno del curso): modo del curso y activo; preguntas = tamaño del bloque; 0 ≤ aciertos ≤ preguntas; 0 ≤ puntos ≤ 20 × preguntas; sin aciertos no hay puntos. Devuelve `{ nouRecord, millor }` (el primer bloque siempre es récord; desempate por aciertos y después por antigüedad).
- **Consola**: "Preguntes per bloc" en la ficha de curso y, opcional, en la de modo.
- `make test-e2e-prod` (`playwright.prod.config.js`): e2e contra producción; los que cambian datos se saltan solos.
