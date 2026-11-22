# Practica Asignaturas

Web para que alumnos de primaria practiquen por curso, sin identificarse. La interfaz va en catalán y ocupa toda la pantalla. Navegación con URLs: `/<curs>/<assignatura>/<mode>`.
- **1r de primària** (`/1-primaria`): Matemàtiques → sumes, restes i hores. Interfaz en mayúsculas y celebración al acertar.
- **6è de primària** (`/6-primaria`): Matemàtiques (aritmètica, problemes, potències, perímetres i àrees…), Anglès (vocabulari, there is/are…) y Medi.

Al terminar la partida (botón "Finalitza") se muestra un resumen con los puntos. "Per repassar" guarda los fallos en el navegador (`localStorage`), por curso.

Todo el contenido (cursos, asignaturas, modos y bancos de preguntas) está en una base de datos **Supabase** (Postgres) y la web lo lee de la API: cambiar algo en la BD se ve al recargar, sin tocar código. `make export-contenido` guarda una copia en `backend/datos/contenido.json` (commitéala de vez en cuando). El plan para hacerlo todo editable desde una consola del profesorado está en `docs/planes/plan-contenido-dinamico-cursos.md` (índice de la documentación en `CLAUDE.md`).

## Estructura

```
backend/    Express: sirve el build de React y expone la API (/api/...)
            src/db/      cliente, migraciones SQL (se aplican solas al arrancar), consultas
            scripts/     migrar y seed (solo en local)
frontend/   React + Vite (con tests unitarios de la lógica en src/logic/*.test.js)
e2e/        Tests end-to-end con Playwright (flujo completo en el navegador)
Dockerfile  Build multi-stage: compila el frontend y lo sirve desde el backend en un único contenedor
```

## Desarrollo local (sin Docker)

Los puertos de desarrollo son **3100** (backend) y **5180** (frontend), a propósito fuera de los habituales 3000/5173. Cada carpeta tiene un `.env.example`; cópialo a `.env` (o ajusta los puertos ahí si los necesitas libres):

```
cp backend/.env.example backend/.env      # PORT=3100, DATABASE_URL de Supabase (Session pooler) y TEACHER_PASSWD
cp frontend/.env.example frontend/.env    # VITE_API_PROXY_TARGET debe apuntar al PORT del backend; VITE_PORT cambia el del frontend
```

Instala dependencias en las 3 carpetas (raíz, backend y frontend) y arranca ambos servicios con un único comando desde la raíz:
```
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev         # backend en http://localhost:3100 + frontend en http://localhost:5180
```

**Base de datos:** dev y producción comparten el mismo proyecto Supabase (el plan gratuito solo permite 2 proyectos). Las migraciones se aplican solas al arrancar el backend; `make seed` carga `backend/datos/contenido.json` y solo crea lo que falta (no pisa ediciones); `make export-contenido` hace el camino inverso (copia de seguridad). Sin `DATABASE_URL` el backend no arranca.

También puedes arrancarlos por separado en dos terminales si lo prefieres:
```
cd backend && npm start          # usa el PORT de backend/.env
cd frontend && npm run dev       # proxy de /api -> VITE_API_PROXY_TARGET
```

## Tests

Lógica de ejercicios (unitarios, Vitest):
```
cd frontend
npm test
```

API contra Supabase (Vitest), en un esquema `test` que se borra y se recrea en cada ejecución, así que nunca toca los datos reales:
```
make test-backend
```

Flujo completo en el navegador (end-to-end, Playwright). Arranca su **propio** backend y frontend (puertos 3199/5199, no reutiliza `npm run dev`) contra el esquema `e2e` de la BD, que se recrea en cada ejecución desde `backend/datos/contenido.json`, y con una contraseña de consola de prueba: los tests pueden editar sin tocar los datos reales.
```
npm install
npx playwright install chromium   # solo la primera vez
npm run test:e2e                  # arranca backend+frontend solos si no están ya corriendo
```

## Construir y probar el contenedor

```
docker build -t practica-asignaturas .
docker run --rm -p 3100:3000 practica-asignaturas
```

Abrir http://localhost:3100

## Makefile

Todos los comandos anteriores (y el despliegue) también están disponibles como atajos:
```
make help    # ver todos los comandos disponibles
```

## Despliegue en Railway

El servicio de Railway (`practica-asignaturas`) está **conectado al repo de GitHub**: **cada push a `main` despliega**. Railway construye la imagen con el `Dockerfile` según `railway.json` (comprobación de salud en `/api/health`, reinicio si falla, región Ámsterdam, cerca del Supabase de Irlanda).

```
git push               # despliega
make railway-smoke     # comprobación rápida de /api/health en producción
make railway-logs      # logs del último despliegue
```

> ⚠️ No hay CI: un push a `main` va a producción sin pasar los tests, y las migraciones de BD se aplican al arrancar. Pasa `make test`, `make test-backend` y `make test-e2e` antes de hacer push.

URL de producción: https://practica-jungfrau.up.railway.app

> Railway puede regenerar el dominio `.up.railway.app` en algún momento (ya ha pasado sin motivo aparente). Si `make railway-smoke` da error, comprueba la URL actual en el dashboard de Railway o con `railway status --json`; `railway-smoke` ya la resuelve sola.

Variables del servicio en Railway: `DATABASE_URL` (la misma cadena del Session pooler de Supabase) y `TEACHER_PASSWD` (contraseña compartida de la consola del profesorado; sin ella la web funciona pero la consola queda desactivada). `PORT` la inyecta Railway.

## Créditos

- `frontend/public/diagrames/volcan.svg`: adaptado de ["Stratovolcano cross-section"](https://commons.wikimedia.org/wiki/File:Stratovolcano_cross-section.svg) de Woudloper (Wikimedia Commons), licencia CC BY-SA 3.0 / GFDL. Se le ha quitado la capa de etiquetas (A-H) del original para poder usarlo en las preguntas de "¿cómo se llama esta parte?" de la asignatura Medi.
