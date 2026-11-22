const NUMEROS = Array.from({ length: 12 }, (_, i) => i + 1)

function posicion(numero, radio) {
  const angulo = (numero % 12) * 30 * (Math.PI / 180)
  return {
    x: 100 + radio * Math.sin(angulo),
    y: 100 - radio * Math.cos(angulo),
  }
}

export default function Reloj({ hora, minuto }) {
  const anguloMinutero = minuto * 6
  const anguloHorario = (hora % 12) * 30 + minuto * 0.5

  return (
    <svg
      viewBox="0 0 200 200"
      className="reloj"
      role="img"
      aria-label={`Rellotge que marca les ${hora} i ${minuto} minuts`}
    >
      <circle cx="100" cy="100" r="95" className="reloj-esfera" />
      {NUMEROS.map((numero) => {
        const { x, y } = posicion(numero, 74)
        return (
          <text key={numero} x={x} y={y} className="reloj-numero" textAnchor="middle" dominantBaseline="central">
            {numero}
          </text>
        )
      })}
      <line
        x1="100"
        y1="100"
        x2="100"
        y2="58"
        className="reloj-horario"
        transform={`rotate(${anguloHorario} 100 100)`}
      />
      <line
        x1="100"
        y1="100"
        x2="100"
        y2="35"
        className="reloj-minutero"
        transform={`rotate(${anguloMinutero} 100 100)`}
      />
      <circle cx="100" cy="100" r="6" className="reloj-centro" />
    </svg>
  )
}
