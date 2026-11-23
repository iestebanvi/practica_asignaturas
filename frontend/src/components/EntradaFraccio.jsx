// Respuesta en forma de fracción: dos casillas apiladas (numerador y
// denominador) con la raya en medio. El valor viaja como texto "n/d".
export default function EntradaFraccio({ valor, onChange, inputRef, className, disabled }) {
  const [n = '', d = ''] = valor.split('/')
  const canvi = (nouN, nouD) => onChange(nouN === '' && nouD === '' ? '' : `${nouN}/${nouD}`)
  const net = (v) => v.replace(/\D/g, '')
  return (
    <div className={`entrada-fraccio ${className}`}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label="Numerador"
        value={n}
        onChange={(e) => canvi(net(e.target.value), d)}
        disabled={disabled}
      />
      <span className="entrada-fraccio-ratlla" aria-hidden="true" />
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label="Denominador"
        value={d}
        onChange={(e) => canvi(n, net(e.target.value))}
        disabled={disabled}
      />
    </div>
  )
}
