-- "Per repassar": fallos de cada alumno con àlies (por tipo de ejercicio y
-- enunciado), con cuántas veces los ha fallado.
CREATE TABLE fallos_alumnes (
  id BIGSERIAL PRIMARY KEY,
  alumne_id BIGINT NOT NULL REFERENCES alumnes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  enunciado TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  veces INTEGER NOT NULL DEFAULT 1 CHECK (veces > 0),
  ultima TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (alumne_id, tipo, enunciado)
);

ALTER TABLE fallos_alumnes ENABLE ROW LEVEL SECURITY;
