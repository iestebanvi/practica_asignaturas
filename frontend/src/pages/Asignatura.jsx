import { PERFILES, ASIGNATURAS_MAYOR } from '../logic/perfiles.js'

export default function Asignatura({ onSeleccionarAsignatura, onVolver }) {
  return (
    <div className="pantalla asignatura">
      <h1>{PERFILES.mayor.nombre}</h1>
      <p>¿Qué asignatura quieres practicar?</p>
      <div className="perfiles">
        {Object.values(ASIGNATURAS_MAYOR).map((asignatura) => (
          <button
            key={asignatura.id}
            className={`perfil asignatura-${asignatura.id}`}
            onClick={() => onSeleccionarAsignatura(asignatura.id)}
          >
            {asignatura.nombre}
          </button>
        ))}
      </div>
      <button className="finalizar" onClick={onVolver}>
        ← Volver
      </button>
    </div>
  )
}
