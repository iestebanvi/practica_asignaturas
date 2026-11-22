# practica_asignaturas — guía para orientarse

Web para que alumnos de primaria practiquen por curso y asignatura. React/Vite (frontend) + Express (backend) en un único contenedor desplegado en Railway.

## Cómo orientarse

- **No leas todos los documentos.** Busca el tema en el mapa de abajo y abre solo el fichero/apartado que indica.
- Si un tema no está en el mapa, búscalo con `grep` en `docs/` antes de abrir ficheros enteros.

## Estado del proyecto

- **Plan vigente**: `docs/planes/plan-contenido-dinamico-cursos.md` → apartado 6 (tabla de fases) y apartado 9 (decisiones).
- Fases 0 y 1 **hechas y desplegadas** (2026-11-22).
- Fases 2 y 3 **hechas** (2026-11-22): todo el contenido sale de Supabase vía API; la web ya no tiene datos en el código. Copia del contenido en `backend/datos/contenido.json`.
- Siguiente: **fase 4** (login del profesorado con contraseña compartida). Pendiente cerrar los ❓ de puntuación (plan §11) antes de la fase 7.

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
| Detalle de la fase 3 (frontend sobre la API, caché, copia del contenido) | ídem §14 |
| Diseño técnico antiguo de BD + PIN (referencia, sustituido) | `docs/planes/plan-base-datos-usuarios.md` |
| Contenido fuente: vocabulario Unit 3 | `docs/ingles/vocabulario-unit3-palabras-nuevas.txt` |
| Contenido fuente: temario Medi "Canvis en el relleu" | `docs/medi/canvis-en-el-relleu-temari.txt` |
| Cómo arrancar, testear y desplegar | `README.md` y `Makefile` (`make help`) |
| Despliegue (push a `main` = producción) | `README.md` § Despliegue en Railway + `railway.json` |

### En el código
| Tema | Dónde |
|---|---|
| Carga de datos de la API (con caché) | `frontend/src/logic/api.js` + `frontend/src/hooks/useApi.js` + `frontend/src/components/AmbDades.jsx` |
| Búsquedas en el árbol de un curso | `frontend/src/logic/cursos.js` |
| Textos de la interfaz (catalán) | `frontend/src/textos.js` |
| Rutas | `frontend/src/App.jsx` |
| Generadores de ejercicios y comprobación | `frontend/src/logic/ejercicios.js` (+ un fichero por tipo) |
| Esquema de la BD | `backend/src/db/migraciones/*.sql` (runner: `backend/src/db/migrar.js`) |
| Consultas de lectura (árbol de curso, bancos) | `backend/src/db/contenido.js` |
| Copia del contenido (backup en git, fuente de `make seed` y de los tests) | `backend/datos/contenido.json` (`make export-contenido`) |
| Carga y exportación | `backend/src/db/sembrar.js`, `backend/src/db/exportar.js`, `backend/scripts/` |
| Rutas de la API | `backend/src/app.js` → `backend/src/routes/` |
| Tests de la API | `backend/test/api.test.js` (esquema `test`) |

## Convenciones de los documentos

- Planes en `docs/planes/`; resto de documentación en `docs/` (por asignatura en `docs/<asignatura>/` para material fuente).
- Documentos en castellano. La interfaz de la web va en catalán.
- Cada plan empieza con un aviso de estado (borrador / vigente / sustituido) y fecha.
- Decisiones pendientes marcadas con ❓; al cerrarlas, se pasan a "Confirmadas" con fecha.

## Mantenimiento de este índice

**Obligatorio**: al crear, mover o ampliar un documento (o un apartado relevante), actualiza el mapa de temas y, si cambia la fase, el apartado "Estado del proyecto".
