-- Bloques de preguntas: cada bloque completo que juega un alumno con àlies.
-- El tamaño del bloque es el del modo (si lo tiene) o el del curso
-- (cursos.config.bloc, 30 si no está).
ALTER TABLE modos ADD COLUMN bloc INTEGER CHECK (bloc IS NULL OR bloc BETWEEN 5 AND 100);

CREATE TABLE blocs (
  id BIGSERIAL PRIMARY KEY,
  alumne_id BIGINT NOT NULL REFERENCES alumnes(id) ON DELETE CASCADE,
  modo_id BIGINT NOT NULL REFERENCES modos(id) ON DELETE CASCADE,
  puntos INTEGER NOT NULL CHECK (puntos >= 0),
  aciertos INTEGER NOT NULL CHECK (aciertos >= 0),
  preguntas INTEGER NOT NULL CHECK (preguntas > 0 AND aciertos <= preguntas),
  creat_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX blocs_modo_alumne_idx ON blocs (modo_id, alumne_id, puntos DESC);

ALTER TABLE blocs ENABLE ROW LEVEL SECURITY;
