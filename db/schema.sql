-- Schema SLV Sicurezza
-- Eseguire questo script una sola volta dopo aver creato il database

CREATE TABLE IF NOT EXISTS aziende (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  piva VARCHAR(20),
  indirizzo TEXT,
  referente VARCHAR(255),
  telefono VARCHAR(50),
  email VARCHAR(255),
  settore VARCHAR(100),
  numero_dipendenti INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client',
  nome VARCHAR(255),
  azienda_id INTEGER REFERENCES aziende(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lavoratori (
  id SERIAL PRIMARY KEY,
  azienda_id INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  mansione VARCHAR(255),
  reparto VARCHAR(100),
  data_assunzione DATE,
  attivo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS formazione (
  id SERIAL PRIMARY KEY,
  lavoratore_id INTEGER REFERENCES lavoratori(id) ON DELETE CASCADE,
  tipo_corso VARCHAR(255) NOT NULL,
  ente_formatore VARCHAR(255),
  data_completamento DATE,
  scadenza DATE,
  ore_corso INTEGER,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visite_mediche (
  id SERIAL PRIMARY KEY,
  lavoratore_id INTEGER REFERENCES lavoratori(id) ON DELETE CASCADE,
  medico_competente VARCHAR(255),
  data_visita DATE NOT NULL,
  scadenza DATE NOT NULL,
  giudizio VARCHAR(80) DEFAULT 'Idoneo',
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nomine (
  id SERIAL PRIMARY KEY,
  azienda_id INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  tipo VARCHAR(80) NOT NULL,
  nominato VARCHAR(255) NOT NULL,
  data_nomina DATE NOT NULL,
  scadenza DATE,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attrezzature (
  id SERIAL PRIMARY KEY,
  azienda_id INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  marca_modello VARCHAR(255),
  matricola VARCHAR(100),
  data_acquisto DATE,
  ultima_verifica DATE,
  prossima_verifica DATE,
  tipo_verifica VARCHAR(100),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documenti (
  id SERIAL PRIMARY KEY,
  azienda_id INTEGER REFERENCES aziende(id) ON DELETE CASCADE,
  tipo VARCHAR(100) DEFAULT 'altro',
  nome VARCHAR(255) NOT NULL,
  url TEXT,
  scadenza DATE,
  note TEXT,
  data_upload TIMESTAMP DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_lavoratori_azienda ON lavoratori(azienda_id);
CREATE INDEX IF NOT EXISTS idx_formazione_lavoratore ON formazione(lavoratore_id);
CREATE INDEX IF NOT EXISTS idx_visite_lavoratore ON visite_mediche(lavoratore_id);
CREATE INDEX IF NOT EXISTS idx_nomine_azienda ON nomine(azienda_id);
CREATE INDEX IF NOT EXISTS idx_attrezzature_azienda ON attrezzature(azienda_id);
CREATE INDEX IF NOT EXISTS idx_documenti_azienda ON documenti(azienda_id);
CREATE INDEX IF NOT EXISTS idx_users_azienda ON users(azienda_id);
