const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

function canAccess(req, aziendaId) {
  return req.user.role === 'admin' || req.user.azienda_id == aziendaId;
}

router.get('/azienda/:aziendaId', authMiddleware, async (req, res) => {
  if (!canAccess(req, req.params.aziendaId)) return res.status(403).json({ error: 'Accesso negato' });
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

router.post('/', authMiddleware, async (req, res) => {
  const {
    azienda_id, nome, cognome, data_nascita, luogo_nascita, codice_fiscale,
    mansione, reparto, ruoli_sicurezza, fa_turni, turno_note,
    formazione_pregressa, telefono, email, data_assunzione
  } = req.body;
  if (!azienda_id || !nome || !cognome) return res.status(400).json({ error: 'Dati obbligatori mancanti' });
  if (req.user.role !== 'admin' && !req.user.can_edit) return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      `INSERT INTO lavoratori
        (azienda_id, nome, cognome, data_nascita, luogo_nascita, codice_fiscale,
         mansione, reparto, ruoli_sicurezza, fa_turni, turno_note,
         formazione_pregressa, telefono, email, data_assunzione)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [azienda_id, nome, cognome,
       data_nascita||null, luogo_nascita||null, codice_fiscale||null,
       mansione||null, reparto||null,
       ruoli_sicurezza&&ruoli_sicurezza.length>0 ? ruoli_sicurezza : null,
       fa_turni||false, turno_note||null,
       formazione_pregressa||null, telefono||null, email||null,
       data_assunzione||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const {
    nome, cognome, data_nascita, luogo_nascita, codice_fiscale,
    mansione, reparto, ruoli_sicurezza, fa_turni, turno_note,
    formazione_pregressa, telefono, email, data_assunzione, attivo
  } = req.body;
  if (req.user.role !== 'admin' && !req.user.can_edit) return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      `UPDATE lavoratori SET
        nome=$1, cognome=$2, data_nascita=$3, luogo_nascita=$4, codice_fiscale=$5,
        mansione=$6, reparto=$7, ruoli_sicurezza=$8, fa_turni=$9, turno_note=$10,
        formazione_pregressa=$11, telefono=$12, email=$13,
        data_assunzione=$14, attivo=$15
       WHERE id=$16 RETURNING *`,
      [nome, cognome,
       data_nascita||null, luogo_nascita||null, codice_fiscale||null,
       mansione||null, reparto||null,
       ruoli_sicurezza&&ruoli_sicurezza.length>0 ? ruoli_sicurezza : null,
       fa_turni||false, turno_note||null,
       formazione_pregressa||null, telefono||null, email||null,
       data_assunzione||null, attivo!==false, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && !req.user.can_edit) return res.status(403).json({ error: 'Accesso negato' });
  try {
    await pool.query('DELETE FROM lavoratori WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
