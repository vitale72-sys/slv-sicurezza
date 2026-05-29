const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

function canAccess(req, aziendaId) {
  return req.user.role === 'admin' || req.user.azienda_id == aziendaId;
}

// Lista near miss per azienda
router.get('/azienda/:aziendaId', authMiddleware, async (req, res) => {
  if (!canAccess(req, req.params.aziendaId)) return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      `SELECT * FROM near_miss WHERE azienda_id = $1 ORDER BY data_evento DESC`,
      [req.params.aziendaId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Crea near miss
router.post('/', authMiddleware, async (req, res) => {
  const { azienda_id, luogo, reparto, descrizione, causa_probabile,
    persone_coinvolte, gravita, azione_correttiva, segnalato_da, note } = req.body;
  if (!azienda_id || !descrizione) return res.status(400).json({ error: 'Dati obbligatori mancanti' });
  if (!canAccess(req, azienda_id)) return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      `INSERT INTO near_miss
        (azienda_id, luogo, reparto, descrizione, causa_probabile,
         persone_coinvolte, gravita, azione_correttiva, segnalato_da, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [azienda_id, luogo, reparto, descrizione, causa_probabile,
       persone_coinvolte || 0, gravita || 'bassa', azione_correttiva, segnalato_da, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Aggiorna near miss
router.put('/:id', authMiddleware, async (req, res) => {
  const { luogo, reparto, descrizione, causa_probabile, persone_coinvolte,
    gravita, azione_correttiva, stato, segnalato_da, note } = req.body;
  try {
    const chiuso_il = stato === 'chiuso' ? new Date() : null;
    const result = await pool.query(
      `UPDATE near_miss SET luogo=$1, reparto=$2, descrizione=$3, causa_probabile=$4,
       persone_coinvolte=$5, gravita=$6, azione_correttiva=$7, stato=$8,
       segnalato_da=$9, note=$10, chiuso_il=$11
       WHERE id=$12 RETURNING *`,
      [luogo, reparto, descrizione, causa_probabile, persone_coinvolte || 0,
       gravita || 'bassa', azione_correttiva, stato || 'aperto',
       segnalato_da, note, chiuso_il, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Elimina near miss (solo admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Accesso negato' });
  try {
    await pool.query('DELETE FROM near_miss WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Statistiche near miss per dashboard
router.get('/stats/:aziendaId', authMiddleware, async (req, res) => {
  if (!canAccess(req, req.params.aziendaId)) return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as totale,
        COUNT(*) FILTER (WHERE stato = 'aperto') as aperti,
        COUNT(*) FILTER (WHERE stato = 'chiuso') as chiusi,
        COUNT(*) FILTER (WHERE gravita = 'alta') as alta_gravita,
        COUNT(*) FILTER (WHERE data_evento > NOW() - INTERVAL '30 days') as ultimi_30gg
       FROM near_miss WHERE azienda_id = $1`,
      [req.params.aziendaId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
