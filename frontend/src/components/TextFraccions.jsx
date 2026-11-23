// Texto con fracciones "3/4" (o "?/12") dibujadas apiladas, como en el
// cuaderno. El resto del texto se deja tal cual.
export function Fraccio({ n, d }) {
  return (
    <span className="fraccio" aria-label={`${n}/${d}`}>
      <span className="fraccio-num">{n}</span>
      <span className="fraccio-den">{d}</span>
    </span>
  )
}

export default function TextFraccions({ text }) {
  const trossos = String(text).split(/(\d+\/\d+|\?\/\d+|\d+\/\?)/)
  return trossos.map((t, i) => {
    const m = t.match(/^(\d+|\?)\/(\d+|\?)$/)
    return m ? <Fraccio key={i} n={m[1]} d={m[2]} /> : t
  })
}
