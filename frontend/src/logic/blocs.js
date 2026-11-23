// Bloques de preguntas: el niño juega libre y las respuestas se cuentan en
// bloques de N; cada bloque completo es un resultado (el récord es el mejor).
// Funciones puras: la partida guarda el estado y llama a registrarRespuesta.

export const BLOC_PER_DEFECTE = 30

// El tamaño del modo si tiene uno propio; si no, el del curso; si no, 30.
export function tamanoBloc(curso, modo) {
  return modo.bloc ?? curso.config?.bloc ?? BLOC_PER_DEFECTE
}

export function estadoInicial() {
  return { actual: { puntos: 0, aciertos: 0, preguntas: 0 }, completats: [] }
}

// Suma una respuesta al bloque en curso. Si con ella el bloque llega a
// "tamano" preguntas, lo cierra: devuelve { estado, completat } con el bloque
// completado (o completat: null si aún no).
export function registrarRespuesta(estado, { esCorrecta, puntos }, tamano) {
  const actual = {
    puntos: estado.actual.puntos + (esCorrecta ? puntos : 0),
    aciertos: estado.actual.aciertos + (esCorrecta ? 1 : 0),
    preguntas: estado.actual.preguntas + 1,
  }
  if (actual.preguntas < tamano) return { estado: { ...estado, actual }, completat: null }
  return {
    estado: { actual: { puntos: 0, aciertos: 0, preguntas: 0 }, completats: [...estado.completats, actual] },
    completat: actual,
  }
}

// El mejor bloque: más puntos; si empatan, más aciertos; si no, el primero.
export function millorBloc(blocs) {
  return blocs.reduce(
    (millor, b) =>
      !millor || b.puntos > millor.puntos || (b.puntos === millor.puntos && b.aciertos > millor.aciertos) ? b : millor,
    null,
  )
}
