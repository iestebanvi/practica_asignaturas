import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import Pagina from '../../components/Pagina.jsx'
import { PracticaModo } from '../Practica.jsx'
import { obtenerContenidoAdmin, obtenerBancoAdmin } from '../../logic/admin.js'
import { T } from '../../textos.js'
import { nivellsDe, triarNivell } from '../../logic/nivells.js'

// "Prova aquest mode": juega un modo tal como lo verá un alumno aunque esté
// inactivo (él, su asignatura o su curso). Los datos salen de la API de la
// consola (con sesión), que incluye lo inactivo. No apunta fallos.
export default function VistaPrevia() {
  const id = Number(useParams().modoId)
  const [estado, setEstado] = useState({ estado: 'carregant' })
  const [inclouInactives, setInclouInactives] = useState(false)
  const [cerca] = useSearchParams()

  useEffect(() => {
    obtenerContenidoAdmin()
      .then((contenido) => setEstado({ estado: 'ok', trobat: buscar(contenido, id) }))
      .catch((err) => setEstado({ estado: err.codigo === 'sessio_requerida' ? 'sense-sessio' : 'error' }))
  }, [id])

  if (estado.estado === 'sense-sessio') return <Navigate to="/profesorat" replace />
  if (estado.estado !== 'ok' || !estado.trobat) {
    return (
      <Pagina molles={[{ nom: T.consola, to: '/profesorat/consola' }, { nom: T.vistaPrevia }]}>
        <p className="practica-avis">
          {estado.estado === 'carregant' ? T.carregant : estado.estado === 'error' ? T.errorCarrega : T.modeNoTrobat}
        </p>
      </Pagina>
    )
  }

  const { curso, asignatura, modo } = estado.trobat
  const visible = curso.activo && asignatura.activo && modo.activo
  const rutaFitxa = `/profesorat/consola/mode/${modo.id}`

  // Mismas formas que la API pública (ids = slugs, "banco" del modo), que es lo
  // que espera la pantalla de práctica.
  const cursoJoc = { ...curso, id: curso.slug }
  const asignaturaJoc = { ...asignatura, id: asignatura.slug }
  const modoJoc = { ...modo, id: modo.slug, banco: modo.bancoId }
  // En la vista previa se pueden probar todos los niveles, también los cerrados.
  const nivells = nivellsDe(modo, { tambeTancats: true })
  const nivell = triarNivell(nivells, cerca.get('nivell'))
  const entorno = {
    rutaTorna: rutaFitxa,
    registrarFallos: false,
    cargarPreguntas: async () => {
      const banco = await obtenerBancoAdmin(modo.bancoId)
      return banco.preguntas.filter((p) => inclouInactives || p.activo)
    },
  }

  const cabecera = (
    <div className="avis-vista-previa" role="note">
      <p>{T.avisVistaPrevia(modo.nombre, visible)}</p>
      {modo.bancoId && (
        <label className="camp-check">
          <input type="checkbox" checked={inclouInactives} onChange={(e) => setInclouInactives(e.target.checked)} />
          {T.inclouInactives}
        </label>
      )}
      <p className="camp-ajuda">{T.ajudaVistaPrevia}</p>
      <Link to={rutaFitxa}>{T.tornaConsola}</Link>
    </div>
  )

  return (
    <PracticaModo
      // Al cambiar la casilla, partida nueva con las preguntas que tocan.
      key={`${modo.id}-${nivell}-${inclouInactives}`}
      curso={cursoJoc}
      asignatura={asignaturaJoc}
      modo={modoJoc}
      nivells={nivells}
      nivell={nivell}
      entorno={entorno}
      cabecera={cabecera}
      senseAlies
      molles={[
        { nom: T.consola, to: '/profesorat/consola' },
        { nom: modo.nombre, to: rutaFitxa },
        { nom: T.vistaPrevia },
      ]}
    />
  )
}

function buscar(contenido, modoId) {
  for (const curso of contenido.cursos) {
    for (const asignatura of curso.asignaturas) {
      const modo = asignatura.modos.find((m) => m.id === modoId)
      if (modo) return { curso, asignatura, modo }
    }
  }
  return null
}
