const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// ─── FORMAZIONE ───────────────────────────────────────────────
router.get('/formazione/azienda/:aziendaId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.azienda_id != req.params.aziendaId)
    return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      `SELECT f.*, l.nome, l.cognome, l.mansione
       FROM formazione f JOIN lavoratori l ON f.lavoratore_id = l.id
       WHERE l.azienda_id = $1 ORDER BY f.scadenza ASC NULLS LAST`,
      [req.params.aziendaId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.post('/formazione', authMiddleware, adminOnly, async (req, res) => {
  const { lavoratore_id, tipo_corso, ente_formatore, data_completamento, scadenza, ore_corso, note } = req.body;
  if (!lavoratore_id || !tipo_corso) return res.status(400).json({ error: 'Dati obbligatori mancanti' });
  try {
    const result = await pool.query(
      'INSERT INTO formazione (lavoratore_id, tipo_corso, ente_formatore, data_completamento, scadenza, ore_corso, note) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [lavoratore_id, tipo_corso, ente_formatore, data_completamento || null, scadenza || null, ore_corso || null, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.put('/formazione/:id', authMiddleware, adminOnly, async (req, res) => {
  const { tipo_corso, ente_formatore, data_completamento, scadenza, ore_corso, note } = req.body;
  try {
    const result = await pool.query(
      'UPDATE formazione SET tipo_corso=$1, ente_formatore=$2, data_completamento=$3, scadenza=$4, ore_corso=$5, note=$6 WHERE id=$7 RETURNING *',
      [tipo_corso, ente_formatore, data_completamento || null, scadenza || null, ore_corso || null, note, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.delete('/formazione/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM formazione WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ─── VISITE MEDICHE ───────────────────────────────────────────
router.get('/visite/azienda/:aziendaId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.azienda_id != req.params.aziendaId)
    return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      `SELECT v.*, l.nome, l.cognome, l.mansione
       FROM visite_mediche v JOIN lavoratori l ON v.lavoratore_id = l.id
       WHERE l.azienda_id = $1 ORDER BY v.scadenza ASC`,
      [req.params.aziendaId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.post('/visite', authMiddleware, adminOnly, async (req, res) => {
  const { lavoratore_id, medico_competente, data_visita, scadenza, giudizio, note } = req.body;
  if (!lavoratore_id || !data_visita || !scadenza) return res.status(400).json({ error: 'Dati obbligatori mancanti' });
  try {
    const result = await pool.query(
      'INSERT INTO visite_mediche (lavoratore_id, medico_competente, data_visita, scadenza, giudizio, note) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [lavoratore_id, medico_competente, data_visita, scadenza, giudizio || 'Idoneo', note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.put('/visite/:id', authMiddleware, adminOnly, async (req, res) => {
  const { medico_competente, data_visita, scadenza, giudizio, note } = req.body;
  try {
    const result = await pool.query(
      'UPDATE visite_mediche SET medico_competente=$1, data_visita=$2, scadenza=$3, giudizio=$4, note=$5 WHERE id=$6 RETURNING *',
      [medico_competente, data_visita, scadenza, giudizio || 'Idoneo', note, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.delete('/visite/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM visite_mediche WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ─── NOMINE ───────────────────────────────────────────────────
router.get('/nomine/azienda/:aziendaId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.azienda_id != req.params.aziendaId)
    return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      'SELECT * FROM nomine WHERE azienda_id = $1 ORDER BY tipo, data_nomina DESC',
      [req.params.aziendaId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.post('/nomine', authMiddleware, adminOnly, async (req, res) => {
  const { azienda_id, tipo, nominato, data_nomina, scadenza, note } = req.body;
  if (!azienda_id || !tipo || !nominato || !data_nomina) return res.status(400).json({ error: 'Dati obbligatori mancanti' });
  try {
    const result = await pool.query(
      'INSERT INTO nomine (azienda_id, tipo, nominato, data_nomina, scadenza, note) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [azienda_id, tipo, nominato, data_nomina, scadenza || null, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.put('/nomine/:id', authMiddleware, adminOnly, async (req, res) => {
  const { tipo, nominato, data_nomina, scadenza, note } = req.body;
  try {
    const result = await pool.query(
      'UPDATE nomine SET tipo=$1, nominato=$2, data_nomina=$3, scadenza=$4, note=$5 WHERE id=$6 RETURNING *',
      [tipo, nominato, data_nomina, scadenza || null, note, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.delete('/nomine/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM nomine WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ─── ATTREZZATURE ─────────────────────────────────────────────
router.get('/attrezzature/azienda/:aziendaId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.azienda_id != req.params.aziendaId)
    return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      'SELECT * FROM attrezzature WHERE azienda_id = $1 ORDER BY prossima_verifica ASC NULLS LAST, nome',
      [req.params.aziendaId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.post('/attrezzature', authMiddleware, adminOnly, async (req, res) => {
  const { azienda_id, nome, marca_modello, matricola, data_acquisto, ultima_verifica, prossima_verifica, tipo_verifica, note } = req.body;
  if (!azienda_id || !nome) return res.status(400).json({ error: 'Dati obbligatori mancanti' });
  try {
    const result = await pool.query(
      'INSERT INTO attrezzature (azienda_id, nome, marca_modello, matricola, data_acquisto, ultima_verifica, prossima_verifica, tipo_verifica, note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [azienda_id, nome, marca_modello, matricola, data_acquisto || null, ultima_verifica || null, prossima_verifica || null, tipo_verifica, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.put('/attrezzature/:id', authMiddleware, adminOnly, async (req, res) => {
  const { nome, marca_modello, matricola, data_acquisto, ultima_verifica, prossima_verifica, tipo_verifica, note } = req.body;
  try {
    const result = await pool.query(
      'UPDATE attrezzature SET nome=$1, marca_modello=$2, matricola=$3, data_acquisto=$4, ultima_verifica=$5, prossima_verifica=$6, tipo_verifica=$7, note=$8 WHERE id=$9 RETURNING *',
      [nome, marca_modello, matricola, data_acquisto || null, ultima_verifica || null, prossima_verifica || null, tipo_verifica, note, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.delete('/attrezzature/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM attrezzature WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ─── DOCUMENTI ────────────────────────────────────────────────
router.get('/documenti/azienda/:aziendaId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.azienda_id != req.params.aziendaId)
    return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      'SELECT * FROM documenti WHERE azienda_id = $1 ORDER BY data_upload DESC',
      [req.params.aziendaId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.post('/documenti', authMiddleware, adminOnly, async (req, res) => {
  const { azienda_id, tipo, nome, url, scadenza, note } = req.body;
  if (!azienda_id || !nome) return res.status(400).json({ error: 'Dati obbligatori mancanti' });
  try {
    const result = await pool.query(
      'INSERT INTO documenti (azienda_id, tipo, nome, url, scadenza, note) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [azienda_id, tipo || 'altro', nome, url, scadenza || null, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.delete('/documenti/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM documenti WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
