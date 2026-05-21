const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e password richiesti' });

  try {
    const result = await pool.query(
      'SELECT u.*, a.nome as azienda_nome FROM users u LEFT JOIN aziende a ON u.azienda_id = a.id WHERE u.email = $1',
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenziali non valide' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenziali non valide' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, azienda_id: user.azienda_id, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, nome: user.nome, azienda_id: user.azienda_id, azienda_nome: user.azienda_nome }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Crea utente cliente (solo admin)
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  const { email, password, nome, azienda_id } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e password richiesti' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, role, nome, azienda_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, nome, azienda_id',
      [email.toLowerCase(), hash, 'client', nome, azienda_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email già registrata' });
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Lista utenti (solo admin)
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT u.id, u.email, u.role, u.nome, u.azienda_id, a.nome as azienda_nome FROM users u LEFT JOIN aziende a ON u.azienda_id = a.id ORDER BY u.created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Elimina utente (solo admin)
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1 AND role != $2', [req.params.id, 'admin']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Inizializzazione admin (usare una sola volta)
router.post('/init', async (req, res) => {
  try {
    const existing = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Admin già esistente' });

    const hash = await bcrypt.hash(req.body.password || 'admin123', 10);
    await pool.query(
      "INSERT INTO users (email, password_hash, role, nome) VALUES ($1, $2, 'admin', $3)",
      [req.body.email || 'admin@slvsicurezza.it', hash, 'Salvatore Vitale']
    );
    res.json({ message: 'Admin creato. Cambia subito la password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
