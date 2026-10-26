// Figuras de las fichas de perímetro y área. Todas se dibujan a escala (con
// las medidas en cm) dentro de un viewBox de 240 x 170.
const ANCHO = 240
const ALTO = 170
const BASE_Y = 130 // línea de base de las figuras que "se apoyan" en el suelo

const cm = (v) => `${v} cm`

function Medida({ x, y, anchor = 'middle', children }) {
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" className="figura-medida">
      {children}
    </text>
  )
}

// Marca de ángulo recto, en el pie de una altura (x, y)
function AnguloRecto({ x, y }) {
  return <path d={`M ${x} ${y - 8} L ${x + 8} ${y - 8} L ${x + 8} ${y}`} className="figura-recto" />
}

// Coloca una etiqueta en el punto medio de un lado, desplazada hacia fuera
// de la figura (alejándose de su centro).
function etiquetaLado(p, q, centro, distancia = 16) {
  const mx = (p.x + q.x) / 2
  const my = (p.y + q.y) / 2
  const dx = mx - centro.x
  const dy = my - centro.y
  const largo = Math.hypot(dx, dy) || 1
  return { x: mx + (dx / largo) * distancia, y: my + (dy / largo) * distancia }
}

function centroDe(puntos) {
  return {
    x: puntos.reduce((s, p) => s + p.x, 0) / puntos.length,
    y: puntos.reduce((s, p) => s + p.y, 0) / puntos.length,
  }
}

function Quadrat({ costat }) {
  const lado = 105
  const x0 = (ANCHO - lado) / 2 - 15
  const y0 = 15
  return (
    <>
      <rect x={x0} y={y0} width={lado} height={lado} className="figura-forma" />
      <Medida x={x0 + lado / 2} y={y0 + lado + 16}>{cm(costat)}</Medida>
      <Medida x={x0 + lado + 10} y={y0 + lado / 2} anchor="start">{cm(costat)}</Medida>
    </>
  )
}

function Rectangle({ base, altura }) {
  const escala = Math.min(165 / base, 105 / altura)
  const w = base * escala
  const h = altura * escala
  const x0 = (ANCHO - w) / 2 - 15
  const y0 = 15 + (105 - h) / 2
  return (
    <>
      <rect x={x0} y={y0} width={w} height={h} className="figura-forma" />
      <Medida x={x0 + w / 2} y={y0 + h + 16}>{cm(base)}</Medida>
      <Medida x={x0 + w + 10} y={y0 + h / 2} anchor="start">{cm(altura)}</Medida>
    </>
  )
}

// Triángulo del que se conocen los tres lados (perímetro): c es la base.
function TriangleCostats({ a, b, c }) {
  const x = (b * b + c * c - a * a) / (2 * c)
  const y = Math.sqrt(Math.max(0, b * b - x * x))
  const escala = Math.min(175 / c, 100 / y)
  const izquierda = (ANCHO - c * escala) / 2
  const A = { x: izquierda, y: BASE_Y }
  const B = { x: izquierda + c * escala, y: BASE_Y }
  const C = { x: izquierda + x * escala, y: BASE_Y - y * escala }
  const centro = centroDe([A, B, C])
  const lc = etiquetaLado(A, B, centro)
  const lb = etiquetaLado(A, C, centro)
  const la = etiquetaLado(B, C, centro)
  return (
    <>
      <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} className="figura-forma" />
      <Medida x={lc.x} y={lc.y}>{cm(c)}</Medida>
      <Medida x={lb.x} y={lb.y}>{cm(b)}</Medida>
      <Medida x={la.x} y={la.y}>{cm(a)}</Medida>
    </>
  )
}

// Triángulo con base, altura (línea discontinua) y el lado inclinado como distractor.
function TriangleAltura({ base, altura, costat, dx }) {
  const escala = Math.min(175 / base, 100 / altura)
  const izquierda = (ANCHO - base * escala) / 2
  const A = { x: izquierda, y: BASE_Y }
  const B = { x: izquierda + base * escala, y: BASE_Y }
  const C = { x: izquierda + dx * escala, y: BASE_Y - altura * escala }
  const centro = centroDe([A, B, C])
  const lado = etiquetaLado(A, C, centro, 24)
  return (
    <>
      <polygon points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} className="figura-forma" />
      <line x1={C.x} y1={C.y} x2={C.x} y2={BASE_Y} className="figura-altura" />
      <AnguloRecto x={C.x} y={BASE_Y} />
      <Medida x={(A.x + B.x) / 2} y={BASE_Y + 16}>{cm(base)}</Medida>
      <Medida x={C.x + 6} y={C.y + (BASE_Y - C.y) * 0.65} anchor="start">{cm(altura)}</Medida>
      <Medida x={lado.x} y={lado.y}>{cm(costat)}</Medida>
    </>
  )
}

function Paralelogram({ base, altura, costat, dx }) {
  const escala = Math.min(150 / (base + dx), 100 / altura)
  const anchoTotal = (base + dx) * escala
  const izquierda = (ANCHO - anchoTotal) / 2 + 12
  const yTop = BASE_Y - altura * escala
  const P1 = { x: izquierda, y: BASE_Y }
  const P2 = { x: izquierda + base * escala, y: BASE_Y }
  const P3 = { x: izquierda + (base + dx) * escala, y: yTop }
  const P4 = { x: izquierda + dx * escala, y: yTop }
  const centro = centroDe([P1, P2, P3, P4])
  const lado = etiquetaLado(P1, P4, centro, 28)
  return (
    <>
      <polygon
        points={`${P1.x},${P1.y} ${P2.x},${P2.y} ${P3.x},${P3.y} ${P4.x},${P4.y}`}
        className="figura-forma"
      />
      <line x1={P4.x} y1={P4.y} x2={P4.x} y2={BASE_Y} className="figura-altura" />
      <AnguloRecto x={P4.x} y={BASE_Y} />
      <Medida x={(P1.x + P2.x) / 2} y={BASE_Y + 16}>{cm(base)}</Medida>
      <Medida x={P4.x + 6} y={(yTop + BASE_Y) / 2} anchor="start">{cm(altura)}</Medida>
      <Medida x={lado.x} y={lado.y}>{cm(costat)}</Medida>
    </>
  )
}

function descripcion({ forma, medidas }) {
  switch (forma) {
    case 'quadrat':
      return `Quadrat de ${cm(medidas.costat)} de costat`
    case 'rectangle':
      return `Rectangle de ${cm(medidas.base)} de base i ${cm(medidas.altura)} d'altura`
    case 'triangle-costats':
      return `Triangle de costats ${cm(medidas.a)}, ${cm(medidas.b)} i ${cm(medidas.c)}`
    case 'triangle-altura':
      return `Triangle de ${cm(medidas.base)} de base i ${cm(medidas.altura)} d'altura`
    default:
      return `Paral·lelogram de ${cm(medidas.base)} de base i ${cm(medidas.altura)} d'altura`
  }
}

export default function Figura({ figura }) {
  const { forma, medidas } = figura
  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      className="figura-geometria"
      role="img"
      aria-label={descripcion(figura)}
    >
      {forma === 'quadrat' && <Quadrat {...medidas} />}
      {forma === 'rectangle' && <Rectangle {...medidas} />}
      {forma === 'triangle-costats' && <TriangleCostats {...medidas} />}
      {forma === 'triangle-altura' && <TriangleAltura {...medidas} />}
      {forma === 'paralelogram' && <Paralelogram {...medidas} />}
    </svg>
  )
}
