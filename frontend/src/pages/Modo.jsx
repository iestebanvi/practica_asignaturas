import { PERFILES, MODOS_PEQUE, ASIGNATURAS_MAYOR } from '../logic/perfiles.js'

export default function Modo({ perfilId, asignatura, onSeleccionarModo, onVolver }) {
  const esPeque = perfilId === 'pequeno'
  const asignaturaActual = esPeque ? null : ASIGNATURAS_MAYOR[asignatura]
  const modos = esPeque ? MODOS_PEQUE : asignaturaActual.modos
  const titulo = esPeque ? PERFILES.pequeno.nombre : asignaturaActual.nombre

  return (
    <div className={`pantalla modo${esPeque ? ' peque' : ''}`}>
      <h1>{titulo}</h1>
      <p>¿Qué quieres practicar?</p>
      <div className="perfiles">
        {Object.values(modos).map((modo) => (
          <button
            key={modo.id}
            className={`perfil modo-${modo.id}`}
            onClick={() => onSeleccionarModo(modo.id)}
          >
            {modo.nombre}
          </button>
        ))}
      </div>
      <button className="finalizar" onClick={onVolver}>
        ← Volver
      </button>
    </div>
  )
}
