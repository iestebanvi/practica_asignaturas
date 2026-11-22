# Practica Asignaturas

Web para que alumnos de primaria practiquen por curso, sin identificarse. La interfaz va en catalán y ocupa toda la pantalla. Navegación con URLs: `/<curs>/<assignatura>/<mode>`.
- **1r de primària** (`/1-primaria`): Matemàtiques → sumes, restes i hores. Interfaz en mayúsculas y celebración al acertar.
- **6è de primària** (`/6-primaria`): Matemàtiques (aritmètica, problemes, potències, perímetres i àrees…), Anglès (vocabulari, there is/are…) y Medi.

Al terminar la partida (botón "Finalitza") se muestra un resumen con los puntos. "Per repassar" guarda los fallos en el navegador (`localStorage`), por curso.

El árbol de cursos vive de momento en `frontend/src/logic/cursos.js`; el plan para pasarlo a una base de datos editable desde una consola del profesorado está en `docs/planes/plan-contenido-dinamico-cursos.md` (índice de la documentación en `CLAUDE.md`).

## Estructura

```
backend/    Express: sirve el build de React y expone la API (/api/...)
frontend/   React + Vite (con tests unitarios de la lógica en src/logic/*.test.js)
e2e/        Tests end-to-end con Playwright (flujo completo en el navegador)
Dockerfile  Build multi-stage: compila el frontend y lo sirve desde el backend en un único contenedor
```

## Desarrollo local (sin Docker)

Los puertos de desarrollo son **3100** (backend) y **5180** (frontend), a propósito fuera de los habituales 3000/5173. Cada carpeta tiene un `.env.example`; cópialo a `.env` (o ajusta los puertos ahí si los necesitas libres):

```
cp backend/.env.example backend/.env      # PORT=3100 (o el que prefieras)
cp frontend/.env.example frontend/.env    # VITE_API_PROXY_TARGET debe apuntar al PORT del backend; VITE_PORT cambia el del frontend
```

Instala dependencias en las 3 carpetas (raíz, backend y frontend) y arranca ambos servicios con un único comando desde la raíz:
```
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev         # backend en http://localhost:3100 + frontend en http://localhost:5180
```

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

Flujo completo en el navegador (end-to-end, Playwright):
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

El servicio de Railway (`practica-asignaturas`) no construye desde el `Dockerfile` directamente: despliega la imagen ya construida en `ghcr.io/iestebanvi/practica-asignaturas:latest`. El flujo de release es:

```
make railway-release   # build multi-arch (amd64+arm64) + push a GHCR + redeploy en Railway
```

También por separado:
```
make railway-build     # solo build + push a GHCR
make railway-deploy    # solo redeploy (usa la imagen :latest ya subida)
make railway-smoke     # comprobación rápida de /api/health en producción
```

URL de producción: https://practica-jungfrau.up.railway.app

> Railway puede regenerar el dominio `.up.railway.app` en algún momento (ya ha pasado una vez sin motivo aparente). Si `make railway-smoke` da error, comprueba la URL actual en el dashboard de Railway o con `railway status --json` y actualiza este README — `railway-smoke` ya la resuelve solo, no hace falta tocar el Makefile.

No requiere base de datos ni variables de entorno adicionales: Railway inyecta `PORT` y el servidor ya lo respeta. El paquete de GHCR es público, así que Railway no necesita ninguna credencial de registro para poder descargarlo.

## Créditos

- `frontend/public/diagrames/volcan.svg`: adaptado de ["Stratovolcano cross-section"](https://commons.wikimedia.org/wiki/File:Stratovolcano_cross-section.svg) de Woudloper (Wikimedia Commons), licencia CC BY-SA 3.0 / GFDL. Se le ha quitado la capa de etiquetas (A-H) del original para poder usarlo en las preguntas de "¿cómo se llama esta parte?" de la asignatura Medi.
