-- ═══════════════════════════════════════════════════════════════
-- MIGRAZIONE V2 — Near Miss, Whistleblowing, Quiz, Multilingua
-- Eseguire una sola volta su Railway tramite reqbin.com
-- ═══════════════════════════════════════════════════════════════

-- ─── NEAR MISS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS near_miss (
  id SERIAL PRIMARY KEY,
  azienda_id INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  data_evento TIMESTAMP NOT NULL DEFAULT NOW(),
  luogo VARCHAR(255),
  reparto VARCHAR(100),
  descrizione TEXT NOT NULL,
  causa_probabile TEXT,
  persone_coinvolte INTEGER DEFAULT 0,
  gravita VARCHAR(20) DEFAULT 'bassa', -- bassa, media, alta
  azione_correttiva TEXT,
  stato VARCHAR(20) DEFAULT 'aperto', -- aperto, in_corso, chiuso
  segnalato_da VARCHAR(100),
  chiuso_il TIMESTAMP,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── WHISTLEBLOWING ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whistleblowing (
  id SERIAL PRIMARY KEY,
  azienda_id INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  codice_segnalazione VARCHAR(20) UNIQUE NOT NULL, -- codice per follow-up anonimo
  categoria VARCHAR(100),
  descrizione TEXT NOT NULL,
  luogo VARCHAR(255),
  data_fatto DATE,
  stato VARCHAR(20) DEFAULT 'ricevuta', -- ricevuta, in_istruttoria, chiusa
  risposta_admin TEXT, -- risposta visibile al segnalante (anonimo)
  ricevuta_il TIMESTAMP DEFAULT NOW(),
  aggiornata_il TIMESTAMP DEFAULT NOW(),
  chiusa_il TIMESTAMP,
  -- NESSUN dato identificativo del segnalante per legge
  ip_hash VARCHAR(64) -- hash dell'IP per statistiche, non identificativo
);

-- ─── QUIZ ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz (
  id SERIAL PRIMARY KEY,
  azienda_id INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  titolo VARCHAR(255) NOT NULL,
  descrizione TEXT,
  lingua VARCHAR(5) DEFAULT 'it',
  punteggio_minimo INTEGER DEFAULT 70, -- percentuale minima
  tempo_limite INTEGER, -- minuti, NULL = nessun limite
  attivo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_domande (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quiz(id) ON DELETE CASCADE,
  testo TEXT NOT NULL,
  ordine INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_risposte (
  id SERIAL PRIMARY KEY,
  domanda_id INTEGER REFERENCES quiz_domande(id) ON DELETE CASCADE,
  testo TEXT NOT NULL,
  corretta BOOLEAN DEFAULT FALSE,
  ordine INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_risultati (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quiz(id) ON DELETE CASCADE,
  lavoratore_id INTEGER REFERENCES lavoratori(id) ON DELETE CASCADE,
  punteggio INTEGER NOT NULL, -- percentuale 0-100
  superato BOOLEAN NOT NULL,
  risposte_dettaglio JSONB, -- dettaglio risposte date
  completato_il TIMESTAMP DEFAULT NOW(),
  lingua_usata VARCHAR(5) DEFAULT 'it',
  tempo_impiegato INTEGER -- secondi
);

-- ─── PREFERENZA LINGUA UTENTI ────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS lingua VARCHAR(5) DEFAULT 'it';

-- ─── INDICI PERFORMANCE ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_near_miss_azienda ON near_miss(azienda_id);
CREATE INDEX IF NOT EXISTS idx_near_miss_stato ON near_miss(stato);
CREATE INDEX IF NOT EXISTS idx_whistleblowing_azienda ON whistleblowing(azienda_id);
CREATE INDEX IF NOT EXISTS idx_whistleblowing_codice ON whistleblowing(codice_segnalazione);
CREATE INDEX IF NOT EXISTS idx_quiz_azienda ON quiz(azienda_id);
CREATE INDEX IF NOT EXISTS idx_quiz_domande ON quiz_domande(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_risultati_lavoratore ON quiz_risultati(lavoratore_id);
CREATE INDEX IF NOT EXISTS idx_quiz_risultati_quiz ON quiz_risultati(quiz_id);
