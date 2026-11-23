-- Parámetros de dificultad de cada modo, por tipo de ejercicio generado
-- (p. ej. { "suma": { "max": 99999 } }). Vacío = según el nivel del curso.
ALTER TABLE modos ADD COLUMN params JSONB NOT NULL DEFAULT '{}';
