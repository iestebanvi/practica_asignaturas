import { PERFILES } from '../logic/perfiles.js'

export default function Home({ onSeleccionarPerfil }) {
  return (
    <div className="pantalla home">
      <h1>Practica Asignaturas 📚</h1>
      <p>¿Quién va a jugar?</p>
      <div className="perfiles">
        {Object.values(PERFILES).map((perfil) => (
          <button
            key={perfil.id}
            className={`perfil perfil-${perfil.id}`}
            onClick={() => onSeleccionarPerfil(perfil.id)}
          >
            {perfil.nombre}
          </button>
        ))}
      </div>
    </div>
  )
}
