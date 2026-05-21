const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Cruscotto globale - scadenze entro 90 giorni per tutte le aziende (solo admin)
router.get('/scadenze', authMiddleware, adminOnly, async (req, res) => {
  const giorni = parseInt(req.query.giorni) || 90;
  try {
    const [formazione, visite, nomine, attrezzature, documenti] = await Promise.all([
      pool.query(`
        SELECT 'formazione' as tipo, f.id, f.tipo_corso as descrizione, f.scadenza,
               l.nome || ' ' || l.cognome as soggetto, a.nome as azienda_nome, a.id as azienda_id
        FROM formazione f
        JOIN lavoratori l ON f.lavoratore_id = l.id
        JOIN aziende a ON l.azienda_id = a.id
        WHERE f.scadenza IS NOT NULL AND f.scadenza <= NOW() + INTERVAL '${giorni} days'
        ORDER BY f.scadenza ASC
      `),
      pool.query(`
        SELECT 'visita_medica' as tipo, v.id, 'Visita medica' as descrizione, v.scadenza,
               l.nome || ' ' || l.cognome as soggetto, a.nome as azienda_nome, a.id as azienda_id
        FROM visite_mediche v
        JOIN lavoratori l ON v.lavoratore_id = l.id
        JOIN aziende a ON l.azienda_id = a.id
        WHERE v.scadenza <= NOW() + INTERVAL '${giorni} days'
        ORDER BY v.scadenza ASC
      `),
      pool.query(`
        SELECT 'nomina' as tipo, n.id, n.tipo as descrizione, n.scadenza,
               n.nominato as soggetto, a.nome as azienda_nome, a.id as azienda_id
        FROM nomine n
        JOIN aziende a ON n.azienda_id = a.id
        WHERE n.scadenza IS NOT NULL AND n.scadenza <= NOW() + INTERVAL '${giorni} days'
        ORDER BY n.scadenza ASC
      `),
      pool.query(`
        SELECT 'attrezzatura' as tipo, at.id, at.nome as descrizione, at.prossima_verifica as scadenza,
               at.marca_modello as soggetto, a.nome as azienda_nome, a.id as azienda_id
        FROM attrezzature at
        JOIN aziende a ON at.azienda_id = a.id
        WHERE at.prossima_verifica IS NOT NULL AND at.prossima_verifica <= NOW() + INTERVAL '${giorni} days'
        ORDER BY at.prossima_verifica ASC
      `),
      pool.query(`
        SELECT 'documento' as tipo, d.id, d.nome as descrizione, d.scadenza,
               d.tipo as soggetto, a.nome as azienda_nome, a.id as azienda_id
        FROM documenti d
        JOIN aziende a ON d.azienda_id = a.id
        WHERE d.scadenza IS NOT NULL AND d.scadenza <= NOW() + INTERVAL '${giorni} days'
        ORDER BY d.scadenza ASC
      `)
    ]);

    const tutto = [
      ...formazione.rows,
      ...visite.rows,
      ...nomine.rows,
      ...attrezzature.rows,
      ...documenti.rows
    ].sort((a, b) => new Date(a.scadenza) - new Date(b.scadenza));

    const oggi = new Date();
    const scadute = tutto.filter(r => new Date(r.scadenza) < oggi);
    const in_scadenza = tutto.filter(r => {
      const d = new Date(r.scadenza);
      return d >= oggi && d <= new Date(oggi.getTime() + 30 * 86400000);
    });
    const future = tutto.filter(r => new Date(r.scadenza) > new Date(oggi.getTime() + 30 * 86400000));

    res.json({ scadute, in_scadenza, future, totale: tutto.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Riepilogo numerico per azienda (admin)
router.get('/riepilogo', authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id, a.nome, a.settore, a.numero_dipendenti,
        (SELECT COUNT(*) FROM lavoratori WHERE azienda_id = a.id AND attivo = true) as lavoratori_attivi,
        (SELECT COUNT(*) FROM formazione f JOIN lavoratori l ON f.lavoratore_id = l.id
          WHERE l.azienda_id = a.id AND f.scadenza < NOW()) as formazione_scadute,
        (SELECT COUNT(*) FROM visite_mediche v JOIN lavoratori l ON v.lavoratore_id = l.id
          WHERE l.azienda_id = a.id AND v.scadenza < NOW()) as visite_scadute,
        (SELECT COUNT(*) FROM nomine WHERE azienda_id = a.id AND scadenza < NOW()) as nomine_scadute,
        (SELECT COUNT(*) FROM attrezzature WHERE azienda_id = a.id AND prossima_verifica < NOW()) as attrezzature_scadute
      FROM aziende a ORDER BY a.nome
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore del server' });
  }
});

module.exports = router;
