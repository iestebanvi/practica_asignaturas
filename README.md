# Practica Asignaturas

Web para que mis hijos practiquen distintas asignaturas (no solo mates):
- **6 años (1º primaria)**: sumas, restas y horas.
- **11 años (6º primaria)**: elige primero la asignatura y luego el modo dentro de ella.
  - **Matemáticas**: aritmética (sumas/restas/multiplicaciones/divisiones) y problemas de su nivel.
  - **Inglés**: vocabulario (deberes reales del cole, con más asignaturas/modos pendientes de añadir).

Cada uno elige su perfil al entrar y eso determina el nivel/contenido. Al terminar la sesión (botón "Finalizar") se muestra un reporte con los puntos conseguidos; no se guarda histórico entre sesiones.

## Estructura

```
backend/    Express: sirve el build de React y expone la API (/api/...)
frontend/   React + Vite (con tests unitarios de la lógica en src/logic/*.test.js)
e2e/        Tests end-to-end con Playwright (flujo completo en el navegador)
Dockerfile  Build multi-stage: compila el frontend y lo sirve desde el backend en un único contenedor
```

## Desarrollo local (sin Docker)

Cada carpeta tiene un `.env.example`; cópialo a `.env` y ajusta los puertos si los necesitas libres (por ejemplo si ya tienes algo corriendo en el 3000):

```
cp backend/.env.example backend/.env      # PORT=3000 (o el que prefieras)
cp frontend/.env.example frontend/.env    # VITE_API_PROXY_TARGET debe apuntar al PORT del backend
```

Instala dependencias en las 3 carpetas (raíz, backend y frontend) y arranca ambos servicios con un único comando desde la raíz:
```
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev         # backend en su PORT + frontend en http://localhost:5173
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
docker run --rm -p 3000:3000 practica-asignaturas
```

Abrir http://localhost:3000

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
