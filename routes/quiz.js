const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// ─── GESTIONE QUIZ (admin) ────────────────────────────────────

// Lista quiz per azienda
router.get('/azienda/:aziendaId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.azienda_id != req.params.aziendaId)
    return res.status(403).json({ error: 'Accesso negato' });
  try {
    const result = await pool.query(
      `SELECT q.*,
        (SELECT COUNT(*) FROM quiz_domande WHERE quiz_id = q.id) as n_domande,
        (SELECT COUNT(*) FROM quiz_risultati WHERE quiz_id = q.id) as n_completamenti
       FROM quiz q WHERE q.azienda_id = $1 ORDER BY q.created_at DESC`,
      [req.params.aziendaId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Crea quiz
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { azienda_id, titolo, descrizione, lingua, punteggio_minimo, tempo_limite } = req.body;
  if (!azienda_id || !titolo) return res.status(400).json({ error: 'Dati obbligatori mancanti' });
  try {
    const result = await pool.query(
      `INSERT INTO quiz (azienda_id, titolo, descrizione, lingua, punteggio_minimo, tempo_limite)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [azienda_id, titolo, descrizione, lingua || 'it', punteggio_minimo || 70, tempo_limite || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Aggiorna quiz
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { titolo, descrizione, lingua, punteggio_minimo, tempo_limite, attivo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE quiz SET titolo=$1, descrizione=$2, lingua=$3, punteggio_minimo=$4,
       tempo_limite=$5, attivo=$6 WHERE id=$7 RETURNING *`,
      [titolo, descrizione, lingua || 'it', punteggio_minimo || 70,
       tempo_limite || null, attivo !== false, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Elimina quiz
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM quiz WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ─── DOMANDE ──────────────────────────────────────────────────

// Leggi quiz completo con domande e risposte (per admin)
router.get('/:id/dettaglio', authMiddleware, adminOnly, async (req, res) => {
  try {
    const quiz = await pool.query('SELECT * FROM quiz WHERE id = $1', [req.params.id]);
    if (quiz.rows.length === 0) return res.status(404).json({ error: 'Quiz non trovato' });

    const domande = await pool.query(
      'SELECT * FROM quiz_domande WHERE quiz_id = $1 ORDER BY ordine, id',
      [req.params.id]
    );
    const risposte = await pool.query(
      `SELECT r.* FROM quiz_risposte r
       JOIN quiz_domande d ON r.domanda_id = d.id
       WHERE d.quiz_id = $1 ORDER BY r.ordine, r.id`,
      [req.params.id]
    );

    const domandeConRisposte = domande.rows.map(d => ({
      ...d,
      risposte: risposte.rows.filter(r => r.domanda_id === d.id)
    }));

    res.json({ ...quiz.rows[0], domande: domandeConRisposte });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Aggiungi domanda con risposte
router.post('/:id/domande', authMiddleware, adminOnly, async (req, res) => {
  const { testo, ordine, risposte } = req.body;
  if (!testo || !risposte || risposte.length < 2)
    return res.status(400).json({ error: 'Servono almeno 2 risposte' });
  if (!risposte.some(r => r.corretta))
    return res.status(400).json({ error: 'Almeno una risposta deve essere corretta' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const d = await client.query(
      'INSERT INTO quiz_domande (quiz_id, testo, ordine) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, testo, ordine || 0]
    );
    for (let i = 0; i < risposte.length; i++) {
      await client.query(
        'INSERT INTO quiz_risposte (domanda_id, testo, corretta, ordine) VALUES ($1,$2,$3,$4)',
        [d.rows[0].id, risposte[i].testo, risposte[i].corretta || false, i]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(d.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Errore del server' });
  } finally {
    client.release();
  }
});

// Elimina domanda
router.delete('/domande/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM quiz_domande WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// ─── ESECUZIONE QUIZ (pubblico con lavoratore_id) ─────────────

// Leggi quiz per compilazione (senza risposte corrette!)
router.get('/:id/esegui', async (req, res) => {
  try {
    const quiz = await pool.query(
      'SELECT id, titolo, descrizione, lingua, punteggio_minimo, tempo_limite FROM quiz WHERE id = $1 AND attivo = true',
      [req.params.id]
    );
    if (quiz.rows.length === 0) return res.status(404).json({ error: 'Quiz non trovato o non attivo' });

    const domande = await pool.query(
      'SELECT id, testo, ordine FROM quiz_domande WHERE quiz_id = $1 ORDER BY ordine, id',
      [req.params.id]
    );
    const risposte = await pool.query(
      `SELECT r.id, r.domanda_id, r.testo, r.ordine
       FROM quiz_risposte r
       JOIN quiz_domande d ON r.domanda_id = d.id
       WHERE d.quiz_id = $1 ORDER BY r.ordine`,
      [req.params.id]
    );

    const domandeConRisposte = domande.rows.map(d => ({
      ...d,
      risposte: risposte.rows.filter(r => r.domanda_id === d.id)
    }));

    res.json({ ...quiz.rows[0], domande: domandeConRisposte });
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Invia risposte e calcola punteggio
router.post('/:id/invia', async (req, res) => {
  const { lavoratore_id, risposte_date, lingua_usata, tempo_impiegato } = req.body;
  if (!lavoratore_id || !risposte_date)
    return res.status(400).json({ error: 'Dati mancanti' });

  try {
    const quiz = await pool.query(
      'SELECT * FROM quiz WHERE id = $1', [req.params.id]
    );
    if (quiz.rows.length === 0) return res.status(404).json({ error: 'Quiz non trovato' });

    // Recupera risposte corrette
    const corrette = await pool.query(
      `SELECT r.id, r.domanda_id FROM quiz_risposte r
       JOIN quiz_domande d ON r.domanda_id = d.id
       WHERE d.quiz_id = $1 AND r.corretta = true`,
      [req.params.id]
    );

    const nDomande = await pool.query(
      'SELECT COUNT(*) FROM quiz_domande WHERE quiz_id = $1', [req.params.id]
    );
    const totale = parseInt(nDomande.rows[0].count);

    // Calcola punteggio
    let risposteGiuste = 0;
    const dettaglio = [];
    for (const [domandaId, rispostaId] of Object.entries(risposte_date)) {
      const corretta = corrette.rows.find(
        c => c.domanda_id == domandaId && c.id == rispostaId
      );
      const ok = !!corretta;
      if (ok) risposteGiuste++;
      dettaglio.push({ domanda_id: domandaId, risposta_id: rispostaId, corretta: ok });
    }

    const punteggio = totale > 0 ? Math.round((risposteGiuste / totale) * 100) : 0;
    const superato = punteggio >= quiz.rows[0].punteggio_minimo;

    // Salva risultato
    const result = await pool.query(
      `INSERT INTO quiz_risultati
        (quiz_id, lavoratore_id, punteggio, superato, risposte_dettaglio, lingua_usata, tempo_impiegato)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, lavoratore_id, punteggio, superato,
       JSON.stringify(dettaglio), lingua_usata || 'it', tempo_impiegato || null]
    );

    res.json({
      punteggio,
      superato,
      punteggio_minimo: quiz.rows[0].punteggio_minimo,
      risposte_giuste: risposteGiuste,
      totale_domande: totale,
      dettaglio
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Risultati quiz per azienda/lavoratore (admin)
router.get('/:id/risultati', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT qr.*, l.nome, l.cognome, l.mansione
       FROM quiz_risultati qr
       JOIN lavoratori l ON qr.lavoratore_id = l.id
       WHERE qr.quiz_id = $1
       ORDER BY qr.completato_il DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
