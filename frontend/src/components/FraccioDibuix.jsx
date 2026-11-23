// Dibujo de una fracción: un pastel o una barra dividida en "parts" partes
// iguales, con las "pintades" primeras coloreadas.
const MIDA = 200

function Pastis({ parts, pintades }) {
  const c = MIDA / 2
  const r = MIDA / 2 - 6
  const punt = (i) => {
    const angle = (2 * Math.PI * i) / parts - Math.PI / 2
    return [c + r * Math.cos(angle), c + r * Math.sin(angle)]
  }
  return Array.from({ length: parts }, (_, i) => {
    const [x1, y1] = punt(i)
    const [x2, y2] = punt(i + 1)
    const d = `M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`
    return <path key={i} d={d} className={`fraccio-part${i < pintades ? ' pintada' : ''}`} />
  })
}

function Barra({ parts, pintades }) {
  const ample = (MIDA * 1.6) / parts
  return Array.from({ length: parts }, (_, i) => (
    <rect
      key={i}
      x={6 + i * ample}
      y={MIDA / 2 - 35}
      width={ample}
      height={70}
      className={`fraccio-part${i < pintades ? ' pintada' : ''}`}
    />
  ))
}

export default function FraccioDibuix({ dibuix }) {
  const esBarra = dibuix.forma === 'barra'
  const ample = esBarra ? MIDA * 1.6 + 12 : MIDA
  return (
    <svg
      viewBox={`0 0 ${ample} ${MIDA}`}
      className={`fraccio-dibuix ${dibuix.forma}`}
      role="img"
      aria-label={`${dibuix.forma}: ${dibuix.parts} parts, ${dibuix.pintades} pintades`}
      data-parts={dibuix.parts}
      data-pintades={dibuix.pintades}
    >
      {esBarra ? <Barra {...dibuix} /> : <Pastis {...dibuix} />}
    </svg>
  )
}
