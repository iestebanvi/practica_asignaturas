import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Curso from './pages/Curso.jsx'
import Asignatura from './pages/Asignatura.jsx'
import Practica from './pages/Practica.jsx'
import ParaRepasar from './pages/ParaRepasar.jsx'
import NoTrobat from './pages/NoTrobat.jsx'

// Cada pantalla tiene su URL: el botón "atrás" del navegador funciona y se
// puede guardar en favoritos el curso de cada niño. "repassar" es un segmento
// fijo, así que tiene prioridad sobre ":asignaturaId" (y ninguna asignatura
// puede llamarse así; lo comprueba cursos.test.js).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:cursoId" element={<Curso />} />
      <Route path="/:cursoId/repassar" element={<ParaRepasar />} />
      <Route path="/:cursoId/:asignaturaId" element={<Asignatura />} />
      <Route path="/:cursoId/:asignaturaId/:modoId" element={<Practica />} />
      <Route path="*" element={<NoTrobat />} />
    </Routes>
  )
}
