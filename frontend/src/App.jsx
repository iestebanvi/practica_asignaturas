import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Curso from './pages/Curso.jsx'
import Asignatura from './pages/Asignatura.jsx'
import Practica from './pages/Practica.jsx'
import ParaRepasar from './pages/ParaRepasar.jsx'
import NoTrobat from './pages/NoTrobat.jsx'
import RecordsCurs from './pages/RecordsCurs.jsx'
import Login from './pages/profesorat/Login.jsx'
import Consola from './pages/profesorat/Consola.jsx'
import VistaPrevia from './pages/profesorat/VistaPrevia.jsx'

// Cada pantalla tiene su URL: el botón "atrás" del navegador funciona y se
// puede guardar en favoritos el curso de cada niño. "repassar" es un segmento
// fijo, así que tiene prioridad sobre ":asignaturaId" (y ninguna asignatura
// puede llamarse así; lo comprueba cursos.test.js).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Segmentos fijos: ganan a ":cursoId/..." (y ningún curso puede llamarse
          "profesorat"; lo impide la BD). Ojo: "/profesorat/*" a secas perdería
          contra "/:cursoId/:asignaturaId/:modoId" en el ranking de rutas. */}
      <Route path="/profesorat" element={<Login />} />
      <Route path="/profesorat/consola/*" element={<Consola />} />
      <Route path="/profesorat/prova/:modoId" element={<VistaPrevia />} />
      <Route path="/:cursoId" element={<Curso />} />
      <Route path="/:cursoId/repassar" element={<ParaRepasar />} />
      <Route path="/:cursoId/records" element={<RecordsCurs />} />
      <Route path="/:cursoId/:asignaturaId" element={<Asignatura />} />
      <Route path="/:cursoId/:asignaturaId/:modoId" element={<Practica />} />
      <Route path="*" element={<NoTrobat />} />
    </Routes>
  )
}
