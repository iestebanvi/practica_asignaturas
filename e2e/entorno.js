// Entorno propio de los e2e: backend y frontend en puertos distintos de los
// de desarrollo (3100/5180), contra el esquema "e2e" de la BD (nunca los
// datos reales) y con una contraseña de consola de prueba.
export const PUERTO_BACKEND = 3199
export const PUERTO_FRONTEND = 5199
export const ESQUEMA_E2E = 'e2e'
export const PASSWORD_E2E = 'contrasenya-e2e'
