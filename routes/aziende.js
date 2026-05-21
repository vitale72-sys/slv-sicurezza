const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Lista aziende (admin vede tutte, cliente vede solo la sua)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query('SELECT * FROM aziende ORDER BY nome');
    } else {
      result = await pool.query('SELECT * FROM aziende WHERE id = $1', [req.user.azienda_id]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Singola azienda
router.get('/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.azienda_id != req.params.id)
    return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query('SELECT * FROM aziende WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Azienda non trovata' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Crea azienda (solo admin)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { nome, piva, indirizzo, referente, telefono, email, settore, numero_dipendenti } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome azienda richiesto' });
  try {
    const result = await pool.query(
      'INSERT INTO aziende (nome, piva, indirizzo, referente, telefono, email, settore, numero_dipendenti) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [nome, piva, indirizzo, referente, telefono, email, settore, numero_dipendenti || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Aggiorna azienda (solo admin)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { nome, piva, indirizzo, referente, telefono, email, settore, numero_dipendenti } = req.body;
  try {
    const result = await pool.query(
      'UPDATE aziende SET nome=$1, piva=$2, indirizzo=$3, referente=$4, telefono=$5, email=$6, settore=$7, numero_dipendenti=$8 WHERE id=$9 RETURNING *',
      [nome, piva, indirizzo, referente, telefono, email, settore, numero_dipendenti || 0, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Elimina azienda (solo admin)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM aziende WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
