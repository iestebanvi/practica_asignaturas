function mensajeMotivador(puntos) {
  if (puntos === 0) return 'Sigue practicando, ¡tú puedes! 💪'
  if (puntos < 50) return '¡Buen intento! 👍'
  if (puntos < 100) return '¡Muy bien! 🌟'
  return '¡Increíble! 🏆'
}

export default function Resumen({ resumen, perfilId, onVolver, onVerRepasar }) {
  const { puntos, aciertos, fallos } = resumen
  const esPeque = perfilId === 'pequeno'

  return (
    <div className={`pantalla resumen${esPeque ? ' peque' : ''}`}>
      <h1>Resumen de la sesión</h1>
      <p className="puntos-totales">{puntos} puntos</p>
      <p className="detalle">
        Aciertos: {aciertos} · Fallos: {fallos}
      </p>
      <p className="mensaje">{mensajeMotivador(puntos)}</p>
      <button onClick={onVolver}>Elegir otro perfil</button>
      <button className="finalizar" onClick={onVerRepasar}>
        📖 Para repasar
      </button>
    </div>
  )
}
