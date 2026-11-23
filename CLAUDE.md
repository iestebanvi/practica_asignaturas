# practica_asignaturas — guía para orientarse

Web para que alumnos de primaria practiquen por curso y asignatura. React/Vite (frontend) + Express (backend) en un único contenedor desplegado en Railway.

## Cómo orientarse

- **No leas todos los documentos.** Busca el tema en el mapa de abajo y abre solo el fichero/apartado que indica.
- Si un tema no está en el mapa, búscalo con `grep` en `docs/` antes de abrir ficheros enteros.

## Estado del proyecto

- **Plan vigente**: `docs/planes/plan-contenido-dinamico-cursos.md` → apartado 6 (tabla de fases) y apartado 9 (decisiones).
- **Hechas y desplegadas** (2026-11-22/23): fases 0–5 y 7. Resumen de cada una en el plan (§12–§17).
  - Web por cursos (1r–6è; 2n–5è inactivos y vacíos), interfaz en catalán, pantalla completa.
  - Todo el contenido en Supabase y editable desde la consola del profesorado (`/profesorat`, contraseña `TEACHER_PASSWD`): preguntas, importar/exportar, cursos, asignaturas, modos, bancos, vista previa.
  - Alumnos con àlies + PIN por curso: bloques de preguntas, récords personales y del curso, "Per repassar" en la BD.
- **En curso**: plan de matemáticas de 5è y 6è (`docs/planes/plan-matematiques-5e-6e.md`, fases M1–M9): **M1–M6 hechas** (raíces, dificultad por modo, 6è al nivel del currículum con problemas nuevos y básicos en catalán, decimales, fracciones, operaciones combinadas); siguiente **M7 (porcentajes y proporcionalidad)**. Lo demás pendiente (checklist de pruebas, mantenimiento, ideas, riesgos) en `docs/pendiente.md`.
- **Despliegue**: push a `main` = producción (ver README). Antes, `make test`, `make test-backend` y `make test-e2e`; después, `make test-e2e-prod`.

## Mapa de temas

| Tema | Dónde |
|---|---|
| **Qué queda pendiente / próximos pasos** | `docs/pendiente.md` |
| Visión general, capas (BD / API / frontend) | `docs/planes/plan-contenido-dinamico-cursos.md` §1–2 |
| ¿Por qué evolucionar y no empezar de cero? | ídem §2 |
| Contenido de banco vs. contenido generado | ídem §2 ("La clave conceptual") |
| Modelo de datos (tablas) | ídem §3; alumnos/partidas en §11 |
| API pública y de profesorado, seguridad | ídem §4 |
| Rutas del frontend, consola, diseño a pantalla completa | ídem §5 |
| Fases y orden de trabajo | ídem §6 |
| Decisiones confirmadas y pendientes | ídem §9 |
| Puntuación: decisiones (bloques, récords por modo, del curso) | ídem §11 |
| Fase 7: modelo de datos y subfases 7a–7d | ídem §17 |
| Detalle de la fase 1 | ídem §12 |
| Detalle de la fase 2 (tablas, bancos, seed, API, dev=prod) | ídem §13 |
| Detalle de la fase 3 (frontend sobre la API, caché, copia del contenido) | ídem §14 |
| Detalle de la fase 4 (login, sesiones, límite de intentos) | ídem §15 |
| Fase 5: subfases 5a–5f y decisiones (borrar, slugs, ediciones simultáneas) | ídem §16 |
| Diseño técnico antiguo de BD + PIN (referencia, sustituido) | `docs/planes/plan-base-datos-usuarios.md` |
| Matemáticas: currículum oficial (XTEC) vs. ejercicios de la web | `docs/matematiques/comparativa-curriculum.md` |
| Problemas de 6è (nuevos) y traducción de los básicos: fuentes y tabla de revisión | `docs/matematiques/problemes-6e.json`, `problemes-basics-ca.json`, `problemes-revisio.md` |
| Plan de matemáticas de 5è y 6è (reparto de bloques, parámetros por modo, fases M1–M9) | `docs/planes/plan-matematiques-5e-6e.md` (vigente; M1–M6 hechas: decimales §10, fracciones §11, combinadas §12) |
| Contenido fuente: vocabulario Unit 3 | `docs/ingles/vocabulario-unit3-palabras-nuevas.txt` |
| Contenido fuente: temario Medi "Canvis en el relleu" | `docs/medi/canvis-en-el-relleu-temari.txt` |
| Cómo arrancar, testear y desplegar | `README.md` y `Makefile` (`make help`; `make test-e2e-prod` = e2e contra producción) |
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
| Rutas de la API | `backend/src/app.js` → `backend/src/routes/` (`admin.js` = consola, protegida) |
| Autenticación del profesorado | `backend/src/auth/` (contraseña, sesiones, límite de intentos) |
| Consola del profesorado (frontend) | `frontend/src/pages/profesorat/` + `frontend/src/logic/admin.js` |
| Lecturas de la consola (incluye lo inactivo) | `backend/src/db/admin.js` |
| Crear/editar/borrar preguntas y su validación | `backend/src/db/preguntas.js` + `backend/src/validacion/preguntas.js` |
| Cursos y asignaturas: validación, slugs reservados, sombra, orden | `backend/src/validacion/estructura.js` + `backend/src/db/estructura.js`; fichas en `frontend/src/pages/profesorat/FitxaCurs.jsx` y `FitxaAssignatura.jsx` |
| Importar/exportar preguntas (formato `;`, CSV) | `backend/src/validacion/importar.js` + `backend/src/db/importar.js`; panel en `frontend/src/pages/profesorat/PanelImportar.jsx` |
| Nombres legibles de tipos de ejercicio, formatos y grupos del formulario | `frontend/src/logic/tiposEjercicio.js` |
| Catálogo de tipos para validar en el servidor (¡sincronizado con el frontend por test!) | `backend/src/catalogo/tiposEjercicio.js` |
| Decimales: tipos, lectura de respuestas con coma y formato | `frontend/src/logic/decimals.js` + `parseNumero`/`numerosIguals`/`formatDecimal` en `frontend/src/logic/common.js`; plan M4 en `docs/planes/plan-matematiques-5e-6e.md` §10 |
| Fracciones: tipos, comprobación de equivalentes, dibujo y entrada de dos casillas | `frontend/src/logic/fraccions.js`; `components/TextFraccions.jsx`, `FraccioDibuix.jsx`, `EntradaFraccio.jsx`; plan M5 en `docs/planes/plan-matematiques-5e-6e.md` §11 |
| Operaciones combinadas: plantillas, evaluador con prioridad y la "trampa" | `frontend/src/logic/combinades.js`; plan M6 en `docs/planes/plan-matematiques-5e-6e.md` §12 |
| Parámetros de dificultad por modo (definición única; consola y validación) | `backend/src/catalogo/parametres.js`; formulario `frontend/src/pages/profesorat/CampsParams.jsx`; generadores en `frontend/src/logic/` (`PARAMETRES_ACCEPTATS`) |
| Àlies de alumnos: API pública, PIN, sesiones por curso | `backend/src/routes/alumnes.js` + `backend/src/db/alumnes.js` + `backend/src/validacion/alies.js`; frontend `frontend/src/logic/alumne.js`, `components/AliesCapcalera.jsx`, `components/DialegAlies.jsx`; consola `pages/profesorat/LlistaAlies.jsx` |
| Récords: consultas y pantalla | `backend/src/db/records.js`; `GET /api/alumnes/records` y `/records-curs`; `frontend/src/logic/records.js`, `pages/RecordsCurs.jsx` |
| "Per repassar" (fallos por àlies) y migración desde el navegador | `backend/src/db/fallos.js` + rutas `/api/alumnes/fallos` en `backend/src/routes/alumnes.js`; `frontend/src/logic/fallos.js`, `pages/ParaRepasar.jsx` |
| Bloques de preguntas (lógica pura) y su guardado | `frontend/src/logic/blocs.js`; `POST /api/alumnes/blocs` en `backend/src/routes/alumnes.js` |
| Vista previa de un modo (pantalla de práctica reutilizable con "entorno") | `frontend/src/pages/profesorat/VistaPrevia.jsx` + `PracticaModo` en `frontend/src/pages/Practica.jsx` |
| Modos y bancos: validación y operaciones | `backend/src/validacion/modos.js` + `backend/src/db/modos.js`; `frontend/src/pages/profesorat/FormModo.jsx`, `NouBanc.jsx` |
| Entorno de los e2e (esquema `e2e`, puertos 3199/5199, contraseña de prueba) | `e2e/entorno.js` + `playwright.config.js` + `backend/scripts/preparar-e2e.js` |
| Tests de la API | `backend/test/*.test.js` (esquema `test`, en serie; helper `preparar.js`) |

## Convenciones de los documentos

- Planes en `docs/planes/`; resto de documentación en `docs/` (por asignatura en `docs/<asignatura>/` para material fuente).
- Documentos en castellano. La interfaz de la web va en catalán.
- Cada plan empieza con un aviso de estado (borrador / vigente / sustituido) y fecha.
- Decisiones pendientes marcadas con ❓; al cerrarlas, se pasan a "Confirmadas" con fecha.

## Mantenimiento de este índice

**Obligatorio**: al crear, mover o ampliar un documento (o un apartado relevante), actualiza el mapa de temas y, si cambia la fase, el apartado "Estado del proyecto".
