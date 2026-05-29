const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

function canAccessAzienda(req, aziendaId) {
  return req.user.role === 'admin' || req.user.azienda_id == aziendaId;
}

router.get('/azienda/:aziendaId', authMiddleware, async (req, res) => {
  if (!canAccessAzienda(req, req.params.aziendaId)) return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      'SELECT * FROM lavoratori WHERE azienda_id = $1 ORDER BY cognome, nome',
      [req.params.aziendaId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.post('/import-csv', authMiddleware, adminOnly, async (req, res) => {
  const { azienda_id, lavoratori } = req.body;
  if (!canAccessAzienda(req, azienda_id)) return res.status(403).json({ error: 'Accesso negato' });
  if (!azienda_id || !Array.isArray(lavoratori) || lavoratori.length === 0)
    return res.status(400).json({ error: 'Dati mancanti' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (const l of lavoratori) {
      if (!l.nome || !l.cognome) continue;
      const r = await client.query(
        `INSERT INTO lavoratori (azienda_id, nome, cognome, data_nascita, luogo_nascita, codice_fiscale,
          mansione, reparto, telefono, email, data_assunzione, fa_turni)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [azienda_id, l.nome.trim(), l.cognome.trim(),
         l.data_nascita || null, l.luogo_nascita || null,
         l.codice_fiscale ? l.codice_fiscale.toUpperCase() : null,
         l.mansione || null, l.reparto || null,
         l.telefono || null, l.email || null,
         l.data_assunzione || null,
         l.fa_turni === 'true' || l.fa_turni === true || false]
      );
      results.push(r.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json({ imported: results.length, lavoratori: results });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Errore durante l\'importazione' });
  } finally {
    client.release();
  }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { azienda_id, nome, cognome, mansione, reparto, data_assunzione } = req.body;
  if (!azienda_id || !nome || !cognome) return res.status(400).json({ error: 'Dati obbligatori mancanti' });
  try {
    const result = await pool.query(
      'INSERT INTO lavoratori (azienda_id, nome, cognome, mansione, reparto, data_assunzione) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [azienda_id, nome, cognome, mansione, reparto, data_assunzione || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { nome, cognome, mansione, reparto, data_assunzione, attivo } = req.body;
  try {
    const result = await pool.query(
      'UPDATE lavoratori SET nome=$1, cognome=$2, mansione=$3, reparto=$4, data_assunzione=$5, attivo=$6 WHERE id=$7 RETURNING *',
      [nome, cognome, mansione, reparto, data_assunzione || null, attivo !== false, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM lavoratori WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
