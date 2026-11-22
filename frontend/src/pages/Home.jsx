import Pagina from '../components/Pagina.jsx'
import Targetes from '../components/Targetes.jsx'
import { CURSOS } from '../logic/cursos.js'
import { T } from '../textos.js'

export default function Home() {
  return (
    <Pagina className="home">
      <h1>{T.triaCurs}</h1>
      <Targetes items={Object.values(CURSOS)} rutaDe={(curso) => `/${curso.id}`} />
    </Pagina>
  )
}
