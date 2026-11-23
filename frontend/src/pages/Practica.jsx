import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  generarEjercicioParaPerfil,
  comprobarRespuesta,
  operacionesConocidas,
  usaBanco,
} from '../logic/ejercicios.js'
import { buscarAsignatura, buscarModo, estiloColor } from '../logic/cursos.js'
import { obtenerCurso, obtenerPreguntas } from '../logic/api.js'
import { useApi } from '../hooks/useApi.js'
import AmbDades from '../components/AmbDades.jsx'
import { registrarFallo } from '../logic/fallos.js'
import { formatDecimal } from '../logic/common.js'
import { tamanoBloc, estadoInicial, registrarRespuesta } from '../logic/blocs.js'
import { useAlumne, enviarBloc } from '../logic/alumne.js'
import { obtenerRecordsPropis, claveModo, recordsCursActius } from '../logic/records.js'
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
const TIPOS_SIN_ENUNCIADO = ['problema', 'hora', 'costat-quadrat', 'arrel-quadrat', 'arrel-imatge', 'decimal-posicio', 'decimal-arrodonir']
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
  'quadrat-perfecte',
  'arrel-entera',
  'decimal-comparar',
  'decimal-extrem',
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
  'quadrat-perfecte',
  'arrel-entera',
  'decimal-comparar',
  'decimal-extrem',
]
const TIPOS_CON_REGISTRO_FALLOS = [...TIPOS_OPCION_MULTIPLE, ...TIPOS_ESCRITOS]
// Tipos cuyo enunciado se cierra con "≈" (estimación aproximada) en vez de
// "=" (operación exacta).
const TIPOS_SIMBOLO_APROXIMADO = ['estimacion']
// Enunciados que ya son una pregunta completa: no llevan "=" al final.
const TIPOS_SIN_SIMBOLO = ['costat-quadrat', 'arrel-quadrat', 'arrel-imatge', 'decimal-posicio', 'decimal-arrodonir']
// Respuestas numéricas con decimales: campo de texto con teclado decimal (el
// campo "number" del navegador no acepta bien la coma).
const TIPOS_RESPOSTA_DECIMAL = [
  'decimal-arrodonir',
  'decimal-suma',
  'decimal-resta',
  'decimal-potencia10',
  'decimal-per-natural',
]

// Las soluciones numéricas se enseñan como se escriben en catalán (3,5).
function mostrar(valor) {
  return typeof valor === 'number' ? formatDecimal(valor) : valor
}

function simboloCierre(tipo) {
  if (TIPOS_SIN_SIMBOLO.includes(tipo)) return ''
  return TIPOS_SIMBOLO_APROXIMADO.includes(tipo) ? '≈' : '='
}
function elegirCelebracion() {
  return CELEBRACIONES[Math.floor(Math.random() * CELEBRACIONES.length)]
}

// Resuelve curso/asignatura/modo desde la URL y alterna entre la partida y su
// resumen. "Torna a jugar" cambia la "key" de la partida para empezar de cero.
export default function Practica() {
  const { cursoId, asignaturaId, modoId } = useParams()
  const resultado = useApi(() => obtenerCurso(cursoId), cursoId)

  return (
    <AmbDades resultado={resultado}>
      {(curso) => {
        const asignatura = buscarAsignatura(curso, asignaturaId)
        const modo = buscarModo(asignatura, modoId)
        if (!modo) return <NoTrobat />
        return (
          <PracticaModo
            key={`${asignatura.id}/${modo.id}`}
            curso={curso}
            asignatura={asignatura}
            modo={modo}
            entorno={entornoAlumnes(curso, asignatura)}
          />
        )
      }}
    </AmbDades>
  )
}

// Lo que cambia entre jugar como alumno y la vista previa de la consola:
//   molles: camino de navegación de la cabecera
//   rutaTorna: adónde llevan "← Torna" y "Tria un altre exercici"
//   cargarPreguntas(modo): de dónde salen las preguntas del banco
//   registrarFallos: si los fallos se apuntan en "Per repassar"
//   guardarBlocs: si los bloques completados se guardan (con àlies)
function entornoAlumnes(curso, asignatura) {
  return {
    rutaTorna: `/${curso.id}/${asignatura.id}`,
    cargarPreguntas: (modo) => obtenerPreguntas(modo.banco),
    registrarFallos: true,
    guardarBlocs: true,
  }
}

// Partida + resumen de un modo. "cabecera" se pinta encima (lo usa la vista
// previa para su aviso).
export function PracticaModo({ curso, asignatura, modo, entorno, molles: mollesPropias, cabecera = null, senseAlies = false }) {
  const [resumen, setResumen] = useState(null)
  const [partida, setPartida] = useState(0)
  // Con àlies (y si el entorno lo permite), los bloques se guardan.
  const alumne = useAlumne(senseAlies ? null : curso.id)
  // Récord del niño en este modo (undefined: aún no se sabe; null: no tiene).
  const [record, setRecord] = useState(undefined)
  useEffect(() => {
    if (!entorno.guardarBlocs || !alumne) return setRecord(undefined)
    obtenerRecordsPropis(curso.id)
      .then((rs) => setRecord(rs[claveModo(asignatura.id, modo.id)] ?? null))
      .catch(() => setRecord(undefined))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumne, curso.id, asignatura.id, modo.id])
  const guardarBloc =
    entorno.guardarBlocs && alumne
      ? async (bloc) => {
          const resultado = await enviarBloc(curso.id, asignatura.id, modo.id, bloc)
          setRecord(resultado.millor)
          return resultado
        }
      : null
  // Los fallos van a "Per repassar" solo con àlies (se guardan en el servidor).
  // Mientras aún no se sabe si hay àlies (alumne === undefined, al cargar la
  // página) también se envían: sin sesión, el servidor los rechaza y ya está.
  const apuntarFallo =
    entorno.registrarFallos && alumne !== null
      ? (ejercicio) => registrarFallo(curso.id, ejercicio).catch(() => {})
      : null
  const entornoPartida = { ...entorno, guardarBloc, apuntarFallo, pistaAlies: entorno.guardarBlocs && !alumne, record }

  const molles = mollesPropias ?? [
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
    <Pagina
      curso={curso}
      molles={molles}
      senseAlies={senseAlies}
      className={resumen ? 'pantalla-resum' : 'pantalla-practica'}
    >
      {cabecera}
      {resumen ? (
        <Resumen
          resumen={resumen}
          rutaAltre={entorno.rutaTorna}
          rutaRepassar={entorno.registrarFallos ? `/${curso.id}/repassar` : null}
          rutaRecords={
            entorno.guardarBlocs && recordsCursActius(curso) ? `/${curso.id}/records#${asignatura.id}-${modo.id}` : null
          }
          onTornarAJugar={tornarAJugar}
        />
      ) : (
        <Partida key={partida} curso={curso} modo={modo} entorno={entornoPartida} onFinalizar={setResumen} />
      )}
    </Pagina>
  )
}

function Partida({ curso, modo, entorno, onFinalizar }) {
  const operaciones = operacionesConocidas(modo.operaciones)
  const { nivel } = curso
  const ambCelebracio = curso.config.celebracio
  const necesitaBanco = usaBanco(operaciones) && Boolean(modo.banco)
  // Sin ningún tipo que se pueda generar (p.ej. todos desconocidos, o solo de
  // banco y el modo no tiene banco), el modo no puede funcionar.
  const disponible = operaciones.some((op) => necesitaBanco || !usaBanco([op]))
  const { rutaTorna } = entorno
  const tamano = tamanoBloc(curso, modo)

  const [banco, setBanco] = useState([])
  const [bancoListo, setBancoListo] = useState(!necesitaBanco)
  const [bancoError, setBancoError] = useState(false)
  const [ejercicio, setEjercicio] = useState(() =>
    necesitaBanco || !disponible ? null : generarEjercicioParaPerfil({ operaciones, nivel, params: modo.params }, []),
  )
  const [respuesta, setRespuesta] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [ultimoIntento, setUltimoIntento] = useState(null)
  const [celebracion, setCelebracion] = useState(null)
  const [puntos, setPuntos] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const [fallos, setFallos] = useState(0)
  const [blocs, setBlocs] = useState(estadoInicial)
  const [avisBloc, setAvisBloc] = useState(null) // { text, record }
  const inputRef = useRef(null)

  // Al completar un bloque: aviso breve (y, con àlies, se guarda).
  async function blocCompletat(bloc) {
    const base = `${T.blocCompletat} ${T.blocResultat(bloc)}`
    if (!entorno.guardarBloc) {
      const extra = entorno.pistaAlies ? T.guardaAmbAlies : T.noEsGuardaPrevia
      setAvisBloc({ text: `${base} · ${extra}`, record: false })
      return
    }
    setAvisBloc({ text: base, record: false })
    try {
      const { nouRecord, millor } = await entorno.guardarBloc(bloc)
      setAvisBloc({ text: `${base} · ${nouRecord ? T.nouRecord : T.elTeuRecord(millor)}`, record: nouRecord })
    } catch {
      setAvisBloc({ text: `${base} ${T.noSHaGuardat}`, record: false })
    }
  }

  useEffect(() => {
    if (!avisBloc) return
    const t = setTimeout(() => setAvisBloc(null), 6000)
    return () => clearTimeout(t)
  }, [avisBloc])

  function cargarBanco() {
    setBancoError(false)
    entorno
      .cargarPreguntas(modo)
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
      setEjercicio(generarEjercicioParaPerfil({ operaciones, nivel, params: modo.params }, banco))
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
      respuestaCorrecta: mostrar(ejercicio.respuesta),
      respuestaDada,
      esCorrecta,
    })

    if (ejercicio.ingles) pronunciar(ejercicio.ingles)

    const { estado: blocsDespres, completat } = registrarRespuesta(
      blocs,
      { esCorrecta, puntos: ejercicio.puntos },
      tamano,
    )
    setBlocs(blocsDespres)
    if (completat) blocCompletat(completat)

    if (esCorrecta) {
      setPuntos((p) => p + ejercicio.puntos)
      setAciertos((a) => a + 1)
      setFeedback('correcto')
      if (ambCelebracio) setCelebracion(elegirCelebracion())
    } else {
      setFallos((f) => f + 1)
      setFeedback('incorrecto')
      if (entorno.apuntarFallo && TIPOS_CON_REGISTRO_FALLOS.includes(ejercicio.tipo)) {
        entorno.apuntarFallo(ejercicio)
      }
    }

    setTimeout(() => {
      setEjercicio(generarEjercicioParaPerfil({ operaciones, nivel, params: modo.params }, banco))
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
    onFinalizar({ puntos, aciertos, fallos, blocs: blocs.completats, incompletes: blocs.actual.preguntas, tamano })
  }

  const enllacTorna = (
    <Link to={rutaTorna} className="enllac-secundari">
      {T.torna}
    </Link>
  )

  if (!disponible) {
    return (
      <div className="practica-avis">
        <p>{T.modeNoDisponible}</p>
        {enllacTorna}
      </div>
    )
  }

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
  // Preguntas cortas en forma de frase: tamaño intermedio y centradas (como
  // los enunciados con figura), ni gigantes como una operación ni pequeñas
  // como un problema.
  const esPreguntaCurta =
    Boolean(ejercicio.figura) || ['arrel-quadrat', 'decimal-posicio', 'decimal-arrodonir'].includes(ejercicio.tipo)
  const esDecimal = TIPOS_RESPOSTA_DECIMAL.includes(ejercicio.tipo)
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
        <p className="marcador-bloc">{T.bloc(blocs.completats.length + 1, blocs.actual.preguntas, tamano)}</p>
        {entorno.record !== undefined && (
          <p className="record-panell">{entorno.record ? T.elTeuRecordPanell(entorno.record) : T.encaraCapRecord}</p>
        )}
        {avisBloc && (
          <p className={`avis-bloc${avisBloc.record ? ' es-record' : ''}`} role="status">
            {avisBloc.text}
          </p>
        )}
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
              className={`enunciado${esProblema ? ' enunciado-problema' : ''}${esPreguntaCurta ? ' enunciado-figura' : ''}`}
            >
              {ejercicio.enunciado}
              {!esProblema && ` ${simboloCierre(ejercicio.tipo)}`}
            </p>
            <input
              ref={inputRef}
              type={esDecimal ? 'text' : 'number'}
              inputMode={esDecimal ? 'decimal' : 'numeric'}
              autoComplete="off"
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
          {feedback === 'incorrecto' && <p className="feedback incorrecto">{T.gairebe(mostrar(ejercicio.respuesta))}</p>}
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
