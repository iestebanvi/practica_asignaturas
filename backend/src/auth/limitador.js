// Límite de intentos de login por IP, en memoria: tras MAX_FALLOS fallos
// seguidos, esa IP queda bloqueada BLOQUEO_MS. Un acierto borra el contador.
// Se reinicia con cada despliegue; suficiente para una sola instancia.
export const MAX_FALLOS = 5
export const BLOQUEO_MS = 15 * 60 * 1000

const intentos = new Map()

// Milisegundos que le quedan de bloqueo a esa IP (0 si no está bloqueada).
export function bloqueoRestante(ip) {
  const registro = intentos.get(ip)
  if (!registro?.bloqueadoHasta) return 0
  const restante = registro.bloqueadoHasta - Date.now()
  if (restante <= 0) {
    intentos.delete(ip)
    return 0
  }
  return restante
}

export function registrarFallo(ip) {
  const registro = intentos.get(ip) ?? { fallos: 0, bloqueadoHasta: 0 }
  registro.fallos++
  if (registro.fallos >= MAX_FALLOS) registro.bloqueadoHasta = Date.now() + BLOQUEO_MS
  intentos.set(ip, registro)
}

export function registrarAcierto(ip) {
  intentos.delete(ip)
}

// Solo para los tests.
export function reiniciarLimitador() {
  intentos.clear()
}
