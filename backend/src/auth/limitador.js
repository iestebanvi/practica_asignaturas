// Límite de intentos fallidos, en memoria: tras MAX_FALLOS fallos seguidos
// con la misma clave, esa clave queda bloqueada BLOQUEO_MS. Un acierto borra
// el contador. Se reinicia con cada despliegue; suficiente para una sola
// instancia. Hay un limitador por uso: login de la consola (clave = IP) y PIN
// de los àlies (clave = curso + àlies).
export const MAX_FALLOS = 5
export const BLOQUEO_MS = 15 * 60 * 1000

export function crearLimitador() {
  const intentos = new Map()
  return {
    // Milisegundos que le quedan de bloqueo a esa clave (0 si no está bloqueada).
    bloqueoRestante(clave) {
      const registro = intentos.get(clave)
      if (!registro?.bloqueadoHasta) return 0
      const restante = registro.bloqueadoHasta - Date.now()
      if (restante <= 0) {
        intentos.delete(clave)
        return 0
      }
      return restante
    },
    registrarFallo(clave) {
      const registro = intentos.get(clave) ?? { fallos: 0, bloqueadoHasta: 0 }
      registro.fallos++
      if (registro.fallos >= MAX_FALLOS) registro.bloqueadoHasta = Date.now() + BLOQUEO_MS
      intentos.set(clave, registro)
    },
    registrarAcierto(clave) {
      intentos.delete(clave)
    },
    // Solo para los tests.
    reiniciar() {
      intentos.clear()
    },
  }
}

// Limitador del login de la consola (por IP).
const consola = crearLimitador()
export const bloqueoRestante = consola.bloqueoRestante
export const registrarFallo = consola.registrarFallo
export const registrarAcierto = consola.registrarAcierto
export const reiniciarLimitador = consola.reiniciar
