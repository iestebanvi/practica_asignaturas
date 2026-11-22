import { Link } from 'react-router-dom'
import Pagina from '../components/Pagina.jsx'
import { T } from '../textos.js'

export default function NoTrobat() {
  return (
    <Pagina className="no-trobat">
      <p>{T.noTrobat}</p>
      <Link to="/" className="enllac-secundari">
        {T.tornaInici}
      </Link>
    </Pagina>
  )
}
