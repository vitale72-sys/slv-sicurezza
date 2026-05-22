const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Scheda pubblica dipendente (nessun token richiesto - accessibile via QR)
router.get('/:id', async (req, res) => {
  try {
    const lav = await pool.query('SELECT * FROM lavoratori WHERE id = $1 AND attivo = true', [req.params.id]);
    if (lav.rows.length === 0) return res.status(404).json({ error: 'Dipendente non trovato' });
    const l = lav.rows[0];

    const [azienda, formazione, visite] = await Promise.all([
      pool.query('SELECT nome, settore FROM aziende WHERE id = $1', [l.azienda_id]),
      pool.query('SELECT tipo_corso, ente_formatore, ore_corso, data_completamento, scadenza FROM formazione WHERE lavoratore_id = $1 ORDER BY scadenza ASC NULLS LAST', [l.id]),
      pool.query('SELECT giudizio, medico_competente, data_visita, scadenza FROM visite_mediche WHERE lavoratore_id = $1 ORDER BY scadenza ASC', [l.id])
    ]);

    res.json({
      lavoratore: { nome: l.nome, cognome: l.cognome, mansione: l.mansione, reparto: l.reparto },
      azienda: azienda.rows[0] || {},
      formazione: formazione.rows,
      visite: visite.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
