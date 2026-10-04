import { useEffect, useRef, useState } from 'react'
import { generarEjercicioParaPerfil, comprobarRespuesta } from '../logic/ejercicios.js'
import { PERFILES, ASIGNATURAS_MAYOR, obtenerModo } from '../logic/perfiles.js'
import { registrarFallo } from '../logic/fallos.js'
import { pronunciar } from '../logic/audio.js'
import Reloj from '../components/Reloj.jsx'

const CELEBRACIONES = ['🎉', '🌟', '🦄', '🐉', '🚀', '🥳', '🌈', '🐬']
const TIPOS_SIN_ENUNCIADO = ['problema', 'hora']
const TIPOS_OPCION_MULTIPLE = ['hora', 'vocabulario', 'gramatica']
const TIPOS_ESCRITOS = ['vocabulario-escrito']
const TIPOS_ENUNCIADO_TEXTO = ['vocabulario', 'gramatica', 'vocabulario-escrito']
const TIPOS_CON_REGISTRO_FALLOS = [...TIPOS_OPCION_MULTIPLE, ...TIPOS_ESCRITOS]
const ENDPOINTS_BANCO = {
  problema: '/api/problemas',
  vocabulario: '/api/vocabulario',
  'vocabulario-escrito': '/api/vocabulario',
  gramatica: '/api/gramatica',
}

function elegirCelebracion() {
  return CELEBRACIONES[Math.floor(Math.random() * CELEBRACIONES.length)]
}

export default function Practica({ perfilId, asignatura, modo, onFinalizar, onVolver }) {
  const perfilBase = PERFILES[perfilId]
  const esPeque = perfilId === 'pequeno'
  const modoActual = obtenerModo(perfilId, asignatura, modo)
  const operaciones = modoActual ? modoActual.operaciones : perfilBase.operaciones
  const nivel = perfilBase.nivel
  const asignaturaActual = perfilId === 'mayor' ? ASIGNATURAS_MAYOR[asignatura] : null
  const nombreMostrado = asignaturaActual
    ? `${asignaturaActual.nombre} · ${modoActual.nombre}`
    : modoActual
      ? `${perfilBase.nombre} · ${modoActual.nombre}`
      : perfilBase.nombre
  const tipoBanco = operaciones.find((op) => op in ENDPOINTS_BANCO)
  const necesitaBanco = Boolean(tipoBanco)
  const clasePantalla = `pantalla practica${esPeque ? ' peque' : ''}`

  const [banco, setBanco] = useState([])
  const [bancoListo, setBancoListo] = useState(!necesitaBanco)
  const [bancoError, setBancoError] = useState(false)
  const [ejercicio, setEjercicio] = useState(() =>
    necesitaBanco ? null : generarEjercicioParaPerfil({ operaciones, nivel }, []),
  )
  const [respuesta, setRespuesta] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [ultimoIntento, setUltimoIntento] = useState(null)
  const [celebracion, setCelebracion] = useState(null)
  const [puntos, setPuntos] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const [fallos, setFallos] = useState(0)
  const inputRef = useRef(null)

  function cargarBanco() {
    setBancoError(false)
    fetch(ENDPOINTS_BANCO[tipoBanco])
      .then((res) => res.json())
      .then((data) => {
        setBanco(data)
        setBancoListo(true)
      })
      .catch(() => setBancoError(true))
  }

  useEffect(() => {
    if (necesitaBanco) cargarBanco()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (bancoListo && banco.length > 0 && ejercicio === null) {
      setEjercicio(generarEjercicioParaPerfil({ operaciones, nivel }, banco))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bancoListo])

  useEffect(() => {
    if (!TIPOS_OPCION_MULTIPLE.includes(ejercicio?.tipo)) inputRef.current?.focus()
  }, [ejercicio])

  function procesarRespuesta(respuestaDada) {
    if (feedback !== null || !ejercicio) return

    const esCorrecta = comprobarRespuesta(ejercicio, respuestaDada)
    setUltimoIntento({
      tipo: ejercicio.tipo,
      enunciado: ejercicio.enunciado,
      respuestaCorrecta: ejercicio.respuesta,
      respuestaDada,
      esCorrecta,
    })

    if (esCorrecta) {
      setPuntos((p) => p + ejercicio.puntos)
      setAciertos((a) => a + 1)
      setFeedback('correcto')
      if (esPeque) setCelebracion(elegirCelebracion())
    } else {
      setFallos((f) => f + 1)
      setFeedback('incorrecto')
      if (TIPOS_CON_REGISTRO_FALLOS.includes(ejercicio.tipo)) {
        registrarFallo(perfilId, ejercicio)
      }
    }

    setTimeout(() => {
      setEjercicio(generarEjercicioParaPerfil({ operaciones, nivel }, banco))
      setRespuesta('')
      setFeedback(null)
      setCelebracion(null)
    }, 900)
  }

  function comprobar(evento) {
    evento.preventDefault()
    if (respuesta === '') return
    procesarRespuesta(respuesta)
  }

  function finalizar() {
    onFinalizar({ puntos, aciertos, fallos })
  }

  if (bancoError) {
    return (
      <div className={clasePantalla}>
        <p>No se han podido cargar los datos.</p>
        <button onClick={cargarBanco}>Reintentar</button>
        {onVolver && (
          <button className="finalizar" onClick={onVolver}>
            ← Volver
          </button>
        )}
      </div>
    )
  }

  if (necesitaBanco && bancoListo && banco.length === 0) {
    return (
      <div className={clasePantalla}>
        <p>Todavía no hay ejercicios de {modoActual.nombre.toLowerCase()}. ¡Vuelve pronto!</p>
        {onVolver && (
          <button className="finalizar" onClick={onVolver}>
            ← Volver
          </button>
        )}
      </div>
    )
  }

  if (!ejercicio) {
    return (
      <div className={clasePantalla}>
        <p>Cargando…</p>
      </div>
    )
  }

  const esProblema = ejercicio.tipo === 'problema'
  const esHora = ejercicio.tipo === 'hora'
  const esOpcionMultiple = TIPOS_OPCION_MULTIPLE.includes(ejercicio.tipo)
  const esEscrito = TIPOS_ESCRITOS.includes(ejercicio.tipo)
  const esEnunciadoTexto = TIPOS_ENUNCIADO_TEXTO.includes(ejercicio.tipo)
  const sinEnunciado = TIPOS_SIN_ENUNCIADO.includes(ultimoIntento?.tipo)
  // El audio solo suena cuando el inglés ya es visible: siempre en el enunciado
  // mostrado, o tras responder (para no chivar la respuesta en modo escrito).
  const puedeEscucharAhora =
    ejercicio.ingles && (ejercicio.enunciado === ejercicio.ingles || feedback !== null)

  return (
    <div className={clasePantalla}>
      <div className="marcador">
        <span>{nombreMostrado}</span>
        <span className="puntos">⭐ {puntos}</span>
      </div>

      {ultimoIntento && (
        <p className={`anterior ${ultimoIntento.esCorrecta ? 'correcto' : 'incorrecto'}`}>
          {ultimoIntento.esCorrecta
            ? sinEnunciado
              ? 'Anterior: ✓ correcto'
              : `Anterior: ${ultimoIntento.enunciado} = ${ultimoIntento.respuestaCorrecta} ✓`
            : sinEnunciado
              ? `Anterior: ✗ tu respuesta (${ultimoIntento.respuestaDada}) — la correcta era ${ultimoIntento.respuestaCorrecta}`
              : `Anterior: ${ultimoIntento.enunciado} = ${ultimoIntento.respuestaCorrecta} ✗ (pusiste ${ultimoIntento.respuestaDada})`}
        </p>
      )}

      {esHora && <Reloj hora={ejercicio.hora} minuto={ejercicio.minuto} />}
      {esEnunciadoTexto && <p className="enunciado enunciado-texto">{ejercicio.enunciado}</p>}

      {puedeEscucharAhora && (
        <button type="button" className="boton-audio" onClick={() => pronunciar(ejercicio.ingles)}>
          🔊 Escuchar
        </button>
      )}

      {esEscrito && (
        <p className="instruccion">
          Escribe la palabra en {ejercicio.direccion === 'ingles' ? 'inglés' : 'catalán'}:
        </p>
      )}

      {esOpcionMultiple ? (
        <div className="opciones">
          {ejercicio.opciones.map((opcion) => (
            <button key={opcion} onClick={() => procesarRespuesta(opcion)} disabled={feedback !== null}>
              {opcion}
            </button>
          ))}
        </div>
      ) : esEscrito ? (
        <form onSubmit={comprobar} className="ejercicio">
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            className={feedback === 'correcto' ? 'correcta' : feedback === 'incorrecto' ? 'incorrecta' : ''}
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            disabled={feedback !== null}
          />
          <button type="submit" disabled={feedback !== null}>
            Comprobar
          </button>
        </form>
      ) : (
        <form onSubmit={comprobar} className="ejercicio">
          <p className={`enunciado${esProblema ? ' enunciado-problema' : ''}`}>
            {ejercicio.enunciado}
            {!esProblema && ' ='}
          </p>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            className={feedback === 'correcto' ? 'correcta' : feedback === 'incorrecto' ? 'incorrecta' : ''}
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            disabled={feedback !== null}
          />
          <button type="submit" disabled={feedback !== null}>
            Comprobar
          </button>
        </form>
      )}

      <div className="feedback-hueco">
        {feedback === 'correcto' && esPeque && (
          <p className="celebracion" aria-hidden="true">
            {celebracion}
          </p>
        )}
        {feedback === 'correcto' && <p className="feedback correcto">¡Correcto! 🎉</p>}
        {feedback === 'incorrecto' && (
          <p className="feedback incorrecto">Casi... la respuesta era {ejercicio.respuesta}</p>
        )}
      </div>

      <button className="finalizar" onClick={finalizar}>
        Finalizar
      </button>
    </div>
  )
}
