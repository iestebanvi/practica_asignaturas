# practica_asignaturas — guía para orientarse

Web para que alumnos de primaria practiquen por curso y asignatura. React/Vite (frontend) + Express (backend) en un único contenedor desplegado en Railway.

## Cómo orientarse

- **No leas todos los documentos.** Busca el tema en el mapa de abajo y abre solo el fichero/apartado que indica.
- Si un tema no está en el mapa, búscalo con `grep` en `docs/` antes de abrir ficheros enteros.

## Estado del proyecto

- **Plan vigente**: `docs/planes/plan-contenido-dinamico-cursos.md` → apartado 6 (tabla de fases) y apartado 9 (decisiones).
- Fases 0 y 1 **hechas y desplegadas** (2026-11-22).
- Fase 2 **hecha** (2026-11-22): Supabase con migraciones, seed ya cargado en `public`, API de lectura; el frontend aún usa `cursos.js` y los endpoints antiguos (ahora leídos de BD).
- Siguiente: **fase 3** (el frontend lee el árbol y las preguntas de la API; se retiran `cursos.js`, los JSON y los endpoints antiguos). Pendiente cerrar los ❓ de puntuación (plan §11) antes de la fase 7.

## Mapa de temas

| Tema | Dónde |
|---|---|
| Visión general, capas (BD / API / frontend) | `docs/planes/plan-contenido-dinamico-cursos.md` §1–2 |
| ¿Por qué evolucionar y no empezar de cero? | ídem §2 |
| Contenido de banco vs. contenido generado | ídem §2 ("La clave conceptual") |
| Modelo de datos (tablas) | ídem §3; alumnos/partidas en §11 |
| API pública y de profesorado, seguridad | ídem §4 |
| Rutas del frontend, consola, diseño a pantalla completa | ídem §5 |
| Fases y orden de trabajo | ídem §6 |
| Decisiones confirmadas y pendientes | ídem §9 |
| Puntuación (àlies + PIN, rècords) | ídem §11 |
| Detalle de la fase 1 | ídem §12 |
| Detalle de la fase 2 (tablas, bancos, seed, API, dev=prod) | ídem §13 |
| Diseño técnico antiguo de BD + PIN (referencia, sustituido) | `docs/planes/plan-base-datos-usuarios.md` |
| Contenido fuente: vocabulario Unit 3 | `docs/ingles/vocabulario-unit3-palabras-nuevas.txt` |
| Contenido fuente: temario Medi "Canvis en el relleu" | `docs/medi/canvis-en-el-relleu-temari.txt` |
| Cómo arrancar, testear y desplegar | `README.md` y `Makefile` (`make help`) |

### En el código
| Tema | Dónde |
|---|---|
| Árbol curso → asignatura → modo (fase 1, en código) | `frontend/src/logic/cursos.js` |
| Textos de la interfaz (catalán) | `frontend/src/textos.js` |
| Rutas | `frontend/src/App.jsx` |
| Generadores de ejercicios y comprobación | `frontend/src/logic/ejercicios.js` (+ un fichero por tipo) |
| Esquema de la BD | `backend/src/db/migraciones/*.sql` (runner: `backend/src/db/migrar.js`) |
| Consultas de lectura (árbol de curso, bancos) | `backend/src/db/contenido.js` |
| Carga inicial desde el código | `backend/src/db/sembrar.js` + `backend/scripts/datos-iniciales.js` |
| Rutas de la API | `backend/src/app.js` → `backend/src/routes/` (`legado.js` = endpoints antiguos hasta la fase 3) |
| Tests de la API | `backend/test/api.test.js` (esquema `test`) |
| JSON originales de los bancos (fuente del seed, hasta la fase 3) | `backend/src/data/*.json` |

## Convenciones de los documentos

- Planes en `docs/planes/`; resto de documentación en `docs/` (por asignatura en `docs/<asignatura>/` para material fuente).
- Documentos en castellano. La interfaz de la web va en catalán.
- Cada plan empieza con un aviso de estado (borrador / vigente / sustituido) y fecha.
- Decisiones pendientes marcadas con ❓; al cerrarlas, se pasan a "Confirmadas" con fecha.

## Mantenimiento de este índice

**Obligatorio**: al crear, mover o ampliar un documento (o un apartado relevante), actualiza el mapa de temas y, si cambia la fase, el apartado "Estado del proyecto".
