# Base de datos (Supabase) + usuarios por nombre + PIN en practica_asignaturas

> Plan de implementación, pendiente de ejecutar. Documento de diseño, no refleja el estado actual del código.

## Contexto

`practica_asignaturas` nació como una app para que los dos hijos del usuario practicaran, sin base de datos a propósito ("no hace falta persistir ni comparar puntos entre sesiones"). Esa decisión se revierte ahora porque el proyecto cambia de alcance: la URL se va a compartir con amigos del colegio, así que hace falta identificar a cada niño y guardar su progreso de forma persistente (hoy todo vive en memoria de React o, como mucho, en `localStorage` de un único dispositivo). El objetivo final es poder ver en qué necesita reforzar cada niño y qué no ha practicado todavía.

Se usará **Supabase** (Postgres hosteado) como base de datos, replicando el patrón ya probado en el proyecto hermano `basquetstats`: `pg` con SQL crudo parametrizado (sin SDK de Supabase, sin ORM), migraciones SQL versionadas en el repo con un runner propio. Diferencia clave respecto a `basquetstats`: allí solo un admin autenticado escribe (por eso Railway no tiene credenciales de escritura, solo de lectura); aquí **cualquier niño escribe directamente** (alta de usuario, fallos, sesión), así que Railway necesita la `DATABASE_URL` de escritura normal.

### Decisiones acordadas con el usuario
1. **Identificación: nombre + PIN generado automáticamente.** La primera vez que alguien escribe un nombre nuevo, el backend genera un PIN numérico de 4 dígitos, lo guarda (con hash) en la BD y se lo muestra al niño UNA sola vez en pantalla ("apúntatelo"). Si el nombre ya existe en la BD, hay que introducir ese PIN para entrar como esa persona — esto evita que dos niños distintos con el mismo nombre se mezclen, y a la vez permite que el mismo niño recupere su progreso desde otro dispositivo si recuerda su PIN. El `{id, nombre}` resultante (nunca el PIN) se guarda en `localStorage` del navegador para no repetir el formulario cada vez.
2. **Cambiar de usuario**: sí, botón visible para dispositivos compartidos (olvida el usuario guardado y vuelve a pedir nombre/PIN, sin borrar datos de nadie).
3. **Estadística a construir ahora**: el ranking de fallos ("Para repasar"), migrado de `localStorage` a Postgres, ahora por usuario real.
4. **Historial de puntuación**: se guarda en BD cada sesión terminada (usuario, perfil, asignatura, modo, puntos, aciertos, fallos), aunque de momento no haya pantalla para verlo — sienta la base sin sobre-construir UI.
5. **Supabase**: proyecto nuevo y separado del de `basquetstats` (aislamiento total). Lo crea el usuario manualmente en el dashboard de Supabase y pasa la `DATABASE_URL`; no es algo que se pueda automatizar desde aquí.

## Modelo de datos

Migración inicial, `backend/src/db/migraciones/001_inicial.sql`:

```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  nombre_normalizado TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  pin_salt TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fallos (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  perfil_id TEXT NOT NULL,
  tipo_ejercicio TEXT NOT NULL,
  enunciado TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  veces INTEGER NOT NULL DEFAULT 1,
  ultima TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, perfil_id, tipo_ejercicio, enunciado)
);

CREATE TABLE IF NOT EXISTS sesiones (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  perfil_id TEXT NOT NULL,
  asignatura TEXT,
  modo TEXT,
  puntos INTEGER NOT NULL,
  aciertos INTEGER NOT NULL,
  fallos INTEGER NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- `pin_hash`/`pin_salt`: el PIN nunca se guarda en claro. Hash con `node:crypto` (`scryptSync(pin, salt, 64)` + `timingSafeEqual` al comparar) — sin dependencias nuevas.
- `respuesta` es `TEXT` para cubrir horas/vocabulario/gramática sin casos especiales.
- `asignatura`/`modo` nullable porque el perfil "pequeño" no tiene asignatura.
- `ON DELETE CASCADE` evita huérfanos si algún día se borra un usuario a mano desde Supabase.
- El upsert de fallos sigue siendo un único `INSERT ... ON CONFLICT (usuario_id, perfil_id, tipo_ejercicio, enunciado) DO UPDATE SET veces = fallos.veces + 1, ultima = now()` — atómico bajo concurrencia.

## Backend

**Archivos nuevos:**
- `backend/src/db/cliente.js` — `pg.Pool` con `connectionString: process.env.DATABASE_URL` y `ssl: { rejectUnauthorized: false }` **siempre activo** (no solo en producción como en basquetstats: aquí dev y prod apuntan al mismo Supabase, que exige TLS siempre).
- `backend/src/db/migraciones/001_inicial.sql` — el esquema de arriba.
- `backend/src/db/migrar.js` — runner que mantiene una tabla `_migrations` y aplica solo las `.sql` pendientes, envuelto en `pg_advisory_lock`/`unlock` para que dos instancias arrancando a la vez (solape durante un redeploy) no se pisen.
- `backend/src/utils/asyncHandler.js` — wrapper mínimo (`fn(req,res,next).catch(next)`) para que un `await pool.query(...)` que falla llegue al middleware de error en vez de colgar la request (Express 4 no captura rechazos de promesas automáticamente; hoy no hay ningún precedente de rutas async en el repo).
- `backend/src/utils/pin.js` — `generarPin()` (string de 4 dígitos, `000`-`9999` con padding), `hashPin(pin, salt)`, `verificarPin(pinIntroducido, hash, salt)` (usa `scryptSync` + `timingSafeEqual`).
- `backend/src/utils/limitadorIntentos.js` — limitador de fuerza bruta **en memoria** (`Map` por `nombre_normalizado`): tras 5 intentos fallidos de PIN, bloquea ese nombre 5 minutos. Un PIN de 4 dígitos (10.000 combinaciones) es trivialmente adivinable sin esto. Se acepta que al reiniciar el proceso (redeploy) el contador se resetea — proporcionado para una app de bajo riesgo con una sola instancia.
- `backend/src/routes/usuarios.js` — `POST /` con este contrato:
  - Nombre no visto antes → crea usuario, genera PIN, responde `201 {id, nombre, pin, nuevo: true}` (el PIN viaja UNA vez en esta respuesta, nunca más).
  - Nombre existente, sin `pin` en el body → `401 {error: 'pin_requerido'}`.
  - Nombre existente, `pin` incorrecto → `401 {error: 'pin_incorrecto'}` (y cuenta como intento fallido en el limitador).
  - Nombre existente, `pin` correcto → `200 {id, nombre}`.
  - Nombre bloqueado por demasiados intentos → `429 {error: 'demasiados_intentos'}`.
- `backend/src/routes/fallos.js` — `GET /?usuarioId&perfilId` (lista por `veces DESC`), `POST /` (upsert incrementando `veces`), `DELETE /?usuarioId&perfilId`.
- `backend/src/routes/sesiones.js` — `POST /` únicamente (sin `GET`: nadie lo consume todavía, YAGNI).
- `backend/src/app.js` — se extrae de `server.js` la creación/configuración de `app` (routers, estáticos, middleware de error final) sin arrancar el servidor, para poder testearla arrancándola en un puerto efímero.

**Archivos modificados:**
- `backend/src/server.js` — queda reducido a: importar `app` desde `app.js`, ejecutar `ejecutarMigraciones()` (fail-fast: si falla, `process.exit(1)`) y luego `app.listen(port)`.
- `backend/package.json` — añadir `pg` a `dependencies`; añadir `vitest` como devDependency + script `test`.

## Frontend

**Archivos nuevos:**
- `frontend/src/logic/usuarios.js` — `obtenerUsuarioGuardado()`, `identificarUsuario(nombre, pin?)` (POST `/api/usuarios`, interpreta `201/200/401/429` y lanza errores tipados para que la pantalla sepa qué mostrar), `guardarUsuario(usuario)` (solo `{id, nombre}`, nunca el PIN), `olvidarUsuario()`.
- `frontend/src/logic/sesiones.js` — `registrarSesion({usuarioId, perfilId, asignatura, modo, puntos, aciertos, fallos})` → POST `/api/sesiones`.
- `frontend/src/pages/Nombre.jsx` — flujo en 3 fases:
  1. **Pedir nombre** (único campo visible al principio).
  2. Si el backend responde `nuevo: true` → **pantalla "Tu PIN es 4821 — apúntatelo"**, bien visible, con un botón explícito "Ya lo tengo apuntado, continuar" (nada de avanzar solo; hay que confirmar que lo ha leído).
  3. Si el backend responde `pin_requerido` → **pedir PIN** (nuevo campo), con mensaje de error si falla (`pin_incorrecto` / `demasiados_intentos` con el aviso correspondiente).

**Archivos reescritos:**
- `frontend/src/logic/fallos.js` — mismas 3 funciones exportadas (`registrarFallo`, `obtenerFallos`, `vaciarFallos`), ahora async y con firma `(usuarioId, perfilId, ...)`, llamando a los endpoints nuevos en vez de `localStorage`.

**Archivos modificados:**
- `frontend/src/App.jsx` — nuevo estado `usuario` (inicializado desde `obtenerUsuarioGuardado()`); `pantalla` inicial es `'nombre'` si no hay usuario guardado, `'home'` si ya lo hay. Nuevos handlers `identificado(usuario)` y `cambiarUsuario()`. Se propaga `usuario` a `Practica` y `ParaRepasar`.
- `frontend/src/pages/Home.jsx` — muestra `Hola, {usuario.nombre}` + botón "Cambiar de usuario".
- `frontend/src/pages/ParaRepasar.jsx` — pasa a `useEffect` + estado de carga, recibe `usuario` además de `perfilId`.
- `frontend/src/pages/Practica.jsx` — recibe `usuario`; `registrarFallo(usuario.id, perfilId, ejercicio)`; `finalizar()` llama también a `registrarSesion(...)`. Ambas llamadas **sin `await`** (fire-and-forget con `.catch(() => {})`), igual que el `catch` silencioso que ya existe hoy para `localStorage` — no tiene sentido bloquear el flujo del juego con latencia de red.

## Tests

- **`frontend/src/logic/fallos.test.js`**: se sustituye por un test ligero que mockea `fetch` y comprueba método/URL/body de las 3 funciones (la lógica de negocio del upsert se cubre ahora en los tests de backend).
- **Backend — nuevo, con Vitest** (`backend/src/routes/usuarios.test.js`, `fallos.test.js`): arrancan `app` en un puerto efímero, usan el `fetch` global de Node (sin `supertest`). Envueltos en `describe.skipIf(!process.env.DATABASE_URL)`. Casos mínimos:
  - Nombre nuevo → `201` con `pin` presente y `nuevo: true`.
  - Mismo nombre sin PIN → `401 pin_requerido`.
  - Mismo nombre con PIN correcto → `200`, mismo `id` que al crearse.
  - Mismo nombre con PIN incorrecto → `401 pin_incorrecto`.
  - 5 intentos fallidos seguidos → el 6º da `429` aunque el PIN sea correcto (limitador activo).
  - Upsert de fallo (dos POST idénticos → `veces === 2`) y orden descendente en el GET.
- **e2e (`e2e/practica.spec.js`, 22 tests)**: no se toca ni un test. `e2e/global-setup.js` crea un usuario **con nombre único por ejecución** (p.ej. `Invitado E2E ${Date.now()}`, para que SIEMPRE sea un alta nueva y nunca tropiece con el flujo de PIN) contra `/api/usuarios` antes de la suite, y guarda su `{id, nombre}` en un `storageState` (`e2e/.auth/usuario-e2e.json`, en `.gitignore`); `playwright.config.js` lo referencia. Cada test arranca con un usuario válido en `localStorage`. Esto hace que los e2e necesiten una `DATABASE_URL` real alcanzable (antes eran autocontenidos) — se reutiliza el mismo Supabase de dev.

## Entorno e infraestructura

- `backend/.env.example` — añadir `DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`.
- **Pendiente del usuario** (no lo puedo hacer yo): crear el proyecto Supabase nuevo, poner la `DATABASE_URL` real en `backend/.env` (local) y como variable de entorno del servicio en Railway antes del primer deploy con esta versión.
- `Makefile` — nuevo target `migrate`; nuevo target `test-backend`; `docker-run` necesita `--env-file backend/.env` (el proceso ahora hace `process.exit(1)` sin `DATABASE_URL`).
- `README.md` — corregir "No requiere base de datos ni variables de entorno adicionales" (ya no es cierto).
- `Dockerfile` — sin cambios: `COPY backend/src ./src` ya arrastra `db/`, `utils/` y las rutas nuevas.

## Riesgos aceptados explícitamente

- **PIN de 4 dígitos sin recuperación propia**: si un niño olvida su PIN, no hay flujo de "recuperar PIN" (no hay email ni nada parecido); la salida es crear un nombre ligeramente distinto, o que el usuario (admin del proyecto) actualice `pin_hash` a mano desde el dashboard de Supabase si hace falta. Aceptable para el alcance de este proyecto.
- **Limitador de intentos en memoria**: se resetea en cada redeploy/reinicio del proceso. Para un hobby de baja escala es proporcionado; si algún día hay tráfico hostil real, habría que pasar el contador a la propia BD.
- **Doble "Finalizar"**: un doble clic antes de cambiar de pantalla podría insertar 2 filas en `sesiones` para la misma partida. Dato duplicado, no rompe nada; mejora opcional futura.
- **e2e ahora dependen de red/Supabase** para pasar en local (antes eran autocontenidos). No hay CI configurado hoy, así que esto no afecta a ningún pipeline existente.

## Verificación end-to-end

1. `cd backend && npm install` (instala `pg` y `vitest`), confirmar que `DATABASE_URL` está en `backend/.env` apuntando al Supabase nuevo.
2. `make migrate` (o arrancar el servidor una vez) y comprobar en el dashboard de Supabase que existen las tablas `usuarios`, `fallos`, `sesiones`, `_migrations`.
3. `make test-backend` — todos los casos de alta/PIN/fallos deben pasar contra Supabase real.
4. `make dev` y probar a mano en el navegador:
   - Primera visita → pantalla "¿Cómo te llamas?" → nombre nuevo → se muestra el PIN generado → confirmar → llega a Home mostrando el nombre.
   - Recargar la página → NO vuelve a pedir nada (usuario recordado en `localStorage`).
   - "Cambiar de usuario" → vuelve a pedir nombre; escribir el MISMO nombre de antes → pide PIN → con el PIN correcto entra como el mismo usuario; con uno incorrecto, error claro.
   - Jugar un modo con fallos de opción múltiple (p.ej. Vocabulario) y comprobar que aparecen en "Para repasar".
5. `cd frontend && npm test` (Vitest) — todo verde, incluido el nuevo test de contrato de `fallos.js`.
6. `make test-e2e` — las 22 pruebas existentes deben seguir pasando sin modificarlas.
7. Revisar en el dashboard de Supabase que aparece al menos una fila en `sesiones` tras terminar una partida de prueba.
8. Antes de desplegar: añadir `DATABASE_URL` como variable de entorno del servicio en Railway (acción de infraestructura — se confirmará explícitamente antes de ejecutarla), luego `make railway-release` y `make railway-smoke` como en despliegues anteriores.
