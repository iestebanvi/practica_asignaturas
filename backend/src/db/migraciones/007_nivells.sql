-- Niveles dentro de un modo. El nivel 1 es el propio modo (sus tipos y su
-- dificultad) y está siempre abierto; "nivells" guarda los niveles 2 y 3:
-- [{ "operaciones": [...], "params": {...}, "obert": true|false }].
ALTER TABLE modos ADD COLUMN nivells JSONB NOT NULL DEFAULT '[]';

-- Cada bloque guardado es de un nivel: los récords van por nivel.
ALTER TABLE blocs ADD COLUMN nivell SMALLINT NOT NULL DEFAULT 1 CHECK (nivell BETWEEN 1 AND 3);

DROP INDEX IF EXISTS blocs_modo_alumne_idx;
CREATE INDEX blocs_modo_nivell_alumne_idx ON blocs (modo_id, nivell, alumne_id, puntos DESC);
