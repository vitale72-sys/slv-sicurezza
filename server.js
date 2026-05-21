require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const pool = require('./db/pool');

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/aziende', require('./routes/aziende'));
app.use('/api/lavoratori', require('./routes/lavoratori'));
app.use('/api', require('./routes/gestionale'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Serve React frontend in produzione
const clientBuild = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuild, 'index.html'));
    }
  });
}

// Inizializza schema database e avvia server
async function start() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database schema verificato.');
  } catch (err) {
    console.error('Errore schema database:', err.message);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`SLV Sicurezza avviato su porta ${PORT}`);
  });
}

start();
