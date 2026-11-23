// Tabla de proporcionalidad: dos magnitudes, cuatro columnas y una casilla
// vacía (null), marcada con "?".
export default function TaulaProporcio({ taula }) {
  return (
    <table className="taula-proporcio">
      <tbody>
        {taula.files.map((fila, i) => (
          <tr key={i}>
            <th scope="row">{taula.magnituds[i]}</th>
            {fila.map((v, j) => (
              <td key={j} className={v === null ? 'buida' : ''}>
                {v ?? '?'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
