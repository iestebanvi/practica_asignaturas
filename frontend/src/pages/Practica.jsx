import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { generarEjercicioParaPerfil, comprobarRespuesta } from '../logic/ejercicios.js'
import { obtenerCurso, obtenerAsignatura, obtenerModo, estiloColor } from '../logic/cursos.js'
import { registrarFallo } from '../logic/fallos.js'
import { T } from '../textos.js'
import Pagina from '../components/Pagina.jsx'
import Resumen from './Resumen.jsx'
import NoTrobat from './NoTrobat.jsx'
import { pronunciar } from '../logic/audio.js'
import Reloj from '../components/Reloj.jsx'
import Volcan from '../components/Volcan.jsx'
import Riu from '../components/Riu.jsx'
import Figura from '../components/Figura.jsx'

const CELEBRACIONES = ['🎉', '🌟', '🦄', '🐉', '🚀', '🥳', '🌈', '🐬']
const TIPOS_SIN_ENUNCIADO = ['problema', 'hora', 'costat-quadrat']
const TIPOS_OPCION_MULTIPLE = [
  'hora',
  'vocabulario',
  'gramatica',
  'medi-pregunta',
  'medi-imatge',
  'perimetre-area',
  'potencia-expressio',
  'potencia-base10',
  'potencia-imatge',
  'potencia-comparar',
]
const TIPOS_ESCRITOS = ['vocabulario-escrito', 'there-be']
const TIPOS_ENUNCIADO_TEXTO = [
  'vocabulario',
  'gramatica',
  'vocabulario-escrito',
  'there-be',
  'medi-pregunta',
  'medi-imatge',
  'perimetre-area',
  'potencia-expressio',
  'potencia-base10',
  'potencia-imatge',
  'potencia-comparar',
]
const TIPOS_CON_REGISTRO_FALLOS = [...TIPOS_OPCION_MULTIPLE, ...TIPOS_ESCRITOS]
// Tipos cuyo enunciado se cierra con "≈" (estimación aproximada) en vez de
// "=" (operación exacta).
const TIPOS_SIMBOLO_APROXIMADO = ['estimacion']
// Enunciados que ya son una pregunta completa: no llevan "=" al final.
const TIPOS_SIN_SIMBOLO = ['costat-quadrat']

function simboloCierre(tipo) {
  if (TIPOS_SIN_SIMBOLO.includes(tipo)) return ''
  return TIPOS_SIMBOLO_APROXIMADO.includes(tipo) ? '≈' : '='
}
const ENDPOINTS_BANCO = {
  problema: '/api/problemas',
  vocabulario: '/api/vocabulario',
  'vocabulario-escrito': '/api/vocabulario',
  gramatica: '/api/gramatica',
  'medi-pregunta': '/api/medi',
}

function elegirCelebracion() {
  return CELEBRACIONES[Math.floor(Math.random() * CELEBRACIONES.length)]
}

// Resuelve curso/asignatura/modo desde la URL y alterna entre la partida y su
// resumen. "Torna a jugar" cambia la "key" de la partida para empezar de cero.
export default function Practica() {
  const { cursoId, asignaturaId, modoId } = useParams()
  const curso = obtenerCurso(cursoId)
  const asignatura = obtenerAsignatura(cursoId, asignaturaId)
  const modo = obtenerModo(cursoId, asignaturaId, modoId)
  const [resumen, setResumen] = useState(null)
  const [partida, setPartida] = useState(0)

  if (!modo) return <NoTrobat />

  const molles = [
    { nom: T.inici, to: '/' },
    { nom: curso.nombre, to: `/${curso.id}` },
    { nom: asignatura.nombre, to: `/${curso.id}/${asignatura.id}` },
    { nom: modo.nombre },
  ]

  function tornarAJugar() {
    setResumen(null)
    setPartida((n) => n + 1)
  }

  return (
    <Pagina curso={curso} molles={molles} className={resumen ? 'pantalla-resum' : 'pantalla-practica'}>
      {resumen ? (
        <Resumen resumen={resumen} curso={curso} asignatura={asignatura} onTornarAJugar={tornarAJugar} />
      ) : (
        <Partida key={partida} curso={curso} asignatura={asignatura} modo={modo} onFinalizar={setResumen} />
      )}
    </Pagina>
  )
}

function Partida({ curso, asignatura, modo, onFinalizar }) {
  const { operaciones } = modo
  const { nivel } = curso
  const ambCelebracio = curso.config.celebracio
  const tipoBanco = operaciones.find((op) => op in ENDPOINTS_BANCO)
  const necesitaBanco = Boolean(tipoBanco)
  const rutaTorna = `/${curso.id}/${asignatura.id}`

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

    if (ejercicio.ingles) pronunciar(ejercicio.ingles)

    if (esCorrecta) {
      setPuntos((p) => p + ejercicio.puntos)
      setAciertos((a) => a + 1)
      setFeedback('correcto')
      if (ambCelebracio) setCelebracion(elegirCelebracion())
    } else {
      setFallos((f) => f + 1)
      setFeedback('incorrecto')
      if (TIPOS_CON_REGISTRO_FALLOS.includes(ejercicio.tipo)) {
        registrarFallo(curso.id, ejercicio)
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

  const enllacTorna = (
    <Link to={rutaTorna} className="enllac-secundari">
      {T.torna}
    </Link>
  )

  if (bancoError) {
    return (
      <div className="practica-avis">
        <p>{T.errorCarrega}</p>
        <button onClick={cargarBanco}>{T.reintenta}</button>
        {enllacTorna}
      </div>
    )
  }

  if (necesitaBanco && bancoListo && banco.length === 0) {
    return (
      <div className="practica-avis">
        <p>{T.bancBuit(modo.nombre)}</p>
        {enllacTorna}
      </div>
    )
  }

  if (!ejercicio) {
    return (
      <div className="practica-avis">
        <p>{T.carregant}</p>
      </div>
    )
  }

  const esProblema = ['problema', 'costat-quadrat'].includes(ejercicio.tipo)
  const esHora = ejercicio.tipo === 'hora'
  const esMediImagen = ejercicio.tipo === 'medi-imatge'
  const esOpcionMultiple = TIPOS_OPCION_MULTIPLE.includes(ejercicio.tipo)
  const esEscrito = TIPOS_ESCRITOS.includes(ejercicio.tipo)
  const esEnunciadoTexto = TIPOS_ENUNCIADO_TEXTO.includes(ejercicio.tipo)
  const sinEnunciado = TIPOS_SIN_ENUNCIADO.includes(ultimoIntento?.tipo)

  return (
    <div className="practica">
      <aside className="panell">
        <div className="marcador" style={estiloColor(modo)}>
          <span className="marcador-mode">{modo.nombre}</span>
          <span className="puntos">⭐ {puntos}</span>
        </div>
        <dl className="comptadors">
          <div>
            <dt>{T.encerts}</dt>
            <dd className="comptador-encerts">{aciertos}</dd>
          </div>
          <div>
            <dt>{T.errors}</dt>
            <dd className="comptador-errors">{fallos}</dd>
          </div>
        </dl>

        {ultimoIntento && (
          <p className={`anterior ${ultimoIntento.esCorrecta ? 'correcto' : 'incorrecto'}`}>
            {ultimoIntento.esCorrecta
              ? sinEnunciado
                ? T.anteriorCorrecte
                : T.anteriorOk(
                    ultimoIntento.enunciado,
                    simboloCierre(ultimoIntento.tipo),
                    ultimoIntento.respuestaCorrecta,
                  )
              : sinEnunciado
                ? T.anteriorIncorrecteBreu(ultimoIntento.respuestaDada, ultimoIntento.respuestaCorrecta)
                : T.anteriorKo(
                    ultimoIntento.enunciado,
                    simboloCierre(ultimoIntento.tipo),
                    ultimoIntento.respuestaCorrecta,
                    ultimoIntento.respuestaDada,
                  )}
          </p>
        )}
      </aside>

      <section className="zona-exercici">
        {esHora && <Reloj hora={ejercicio.hora} minuto={ejercicio.minuto} />}
        {esMediImagen && ejercicio.diagrama === 'volcan' && (
          <>
            <Volcan parteDestacada={ejercicio.parteId} />
            <p className="credit-imatge">Imatge: Woudloper, Wikimedia Commons (CC BY-SA 3.0)</p>
          </>
        )}
        {esMediImagen && ejercicio.diagrama === 'riu' && <Riu parteDestacada={ejercicio.parteId} />}
        {ejercicio.figura && <Figura figura={ejercicio.figura} />}
        {esEnunciadoTexto && <p className="enunciado enunciado-texto">{ejercicio.enunciado}</p>}

        {esEscrito && (
          <p className="instruccion">{ejercicio.instruccion ?? T.escriuParaula(ejercicio.direccion)}</p>
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
              {T.comprova}
            </button>
          </form>
        ) : (
          <form onSubmit={comprobar} className="ejercicio">
            <p
              className={`enunciado${esProblema ? ' enunciado-problema' : ''}${ejercicio.figura ? ' enunciado-figura' : ''}`}
            >
              {ejercicio.enunciado}
              {!esProblema && ` ${simboloCierre(ejercicio.tipo)}`}
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
              {T.comprova}
            </button>
          </form>
        )}

        <div className="feedback-hueco">
          {feedback === 'correcto' && ambCelebracio && (
            <p className="celebracion" aria-hidden="true">
              {celebracion}
            </p>
          )}
          {feedback === 'correcto' && <p className="feedback correcto">{T.correcte}</p>}
          {feedback === 'incorrecto' && <p className="feedback incorrecto">{T.gairebe(ejercicio.respuesta)}</p>}
        </div>
      </section>

      <div className="practica-final">
        <button className="boto-finalitza" onClick={finalizar}>
          {T.finalitza}
        </button>
      </div>
    </div>
  )
}
