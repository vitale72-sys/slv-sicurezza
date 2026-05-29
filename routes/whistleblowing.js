const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const crypto = require('crypto');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Genera codice segnalazione univoco (per follow-up anonimo)
function generaCodice() {
  return 'WB-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Hash IP per statistiche (non identificativo)
function hashIP(ip) {
  return crypto.createHash('sha256').update(ip + 'slv2024').digest('hex').slice(0, 16);
}

// ─── ROTTE PUBBLICHE (senza login) ────────────────────────────

// Invia segnalazione anonima
router.post('/segnala/:aziendaId', async (req, res) => {
  const { categoria, descrizione, luogo, data_fatto } = req.body;
  if (!descrizione || descrizione.length < 20) {
    return res.status(400).json({ error: 'Descrizione troppo breve (minimo 20 caratteri)' });
  }
  const codice = generaCodice();
  const ipHash = hashIP(req.ip || 'unknown');
  try {
    await pool.query(
      `INSERT INTO whistleblowing
        (azienda_id, codice_segnalazione, categoria, descrizione, luogo, data_fatto, ip_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [req.params.aziendaId, codice, categoria, descrizione,
       luogo || null, data_fatto || null, ipHash]
    );
    res.status(201).json({
      success: true,
      codice_segnalazione: codice,
      messaggio: 'Segnalazione ricevuta. Conserva il codice per verificare lo stato.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Verifica stato segnalazione con codice (anonimo)
router.get('/stato/:codice', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT codice_segnalazione, stato, ricevuta_il, aggiornata_il, risposta_admin
       FROM whistleblowing WHERE codice_segnalazione = $1`,
      [req.params.codice.toUpperCase()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Codice non trovato' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ─── ROTTE ADMIN ──────────────────────────────────────────────

// Lista segnalazioni per azienda (solo admin)
router.get('/azienda/:aziendaId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, codice_segnalazione, categoria, descrizione, luogo,
              data_fatto, stato, risposta_admin, ricevuta_il, aggiornata_il
       FROM whistleblowing WHERE azienda_id = $1
       ORDER BY ricevuta_il DESC`,
      [req.params.aziendaId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Aggiorna stato e risposta (solo admin)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { stato, risposta_admin } = req.body;
  try {
    const chiusa_il = stato === 'chiusa' ? new Date() : null;
    const result = await pool.query(
      `UPDATE whistleblowing SET stato=$1, risposta_admin=$2,
       aggiornata_il=NOW(), chiusa_il=$3 WHERE id=$4 RETURNING *`,
      [stato, risposta_admin, chiusa_il, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Conta segnalazioni per dashboard
router.get('/count/:aziendaId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as totale,
              COUNT(*) FILTER (WHERE stato = 'ricevuta') as nuove,
              COUNT(*) FILTER (WHERE stato = 'in_istruttoria') as in_corso
       FROM whistleblowing WHERE azienda_id = $1`,
      [req.params.aziendaId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
