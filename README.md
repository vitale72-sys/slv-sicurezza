# SLV Sicurezza — Gestionale sicurezza sul lavoro

App web per la gestione di scadenze formazione, visite mediche, nomine, attrezzature e documenti, con portale clienti.

---

## Pubblicazione su Railway (30 minuti, una volta sola)

### Passo 1 — Crea account GitHub
1. Vai su https://github.com
2. Registrati con email e password
3. Conferma email

### Passo 2 — Carica il codice su GitHub
1. Crea un nuovo repository su https://github.com/new
   - Nome: `slv-sicurezza`
   - Visibilità: **Private** (consigliato)
2. Scarica e installa GitHub Desktop da https://desktop.github.com
3. Clicca "Add an Existing Repository" → seleziona questa cartella
4. Fai "Publish repository" su GitHub

### Passo 3 — Crea account Railway
1. Vai su https://railway.app
2. Accedi con il tuo account GitHub (più rapido)
3. Scegli il piano Hobby ($5/mese, carta di credito richiesta)

### Passo 4 — Crea il progetto
1. Clicca "New Project"
2. Seleziona "Deploy from GitHub repo"
3. Seleziona il repository `slv-sicurezza`
4. Railway inizierà a costruire l'app automaticamente

### Passo 5 — Aggiungi il database PostgreSQL
1. Nel progetto Railway, clicca "New Service" → "Database" → "PostgreSQL"
2. Aspetta che il database sia pronto (30 secondi)
3. Clicca sul database → "Connect" → copia la variabile `DATABASE_URL`

### Passo 6 — Configura le variabili d'ambiente
1. Clicca sul servizio dell'app → "Variables"
2. Aggiungi queste variabili:
   ```
   DATABASE_URL = (quella copiata dal database PostgreSQL)
   JWT_SECRET   = (stringa lunga casuale, es. slv_sicurezza_2024_chiave_segreta_lunga)
   NODE_ENV     = production
   PORT         = 3000
   ```
3. Clicca "Deploy" per riavviare con le nuove variabili

### Passo 7 — Crea l'utente admin
1. Ottieni l'URL dell'app da Railway (es. `https://slv-sicurezza-xxxxx.railway.app`)
2. Apri il browser e vai a:
   ```
   https://TUO-URL.railway.app/api/auth/init
   ```
   Con metodo POST (usa Postman, o il terminale):
   ```bash
   curl -X POST https://TUO-URL.railway.app/api/auth/init \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@slvsicurezza.it","password":"LA_TUA_PASSWORD"}'
   ```
3. Accedi all'app con quelle credenziali

### Passo 8 — Dominio personalizzato (opzionale)
1. In Railway, clicca sul servizio → "Settings" → "Domains"
2. Aggiungi il tuo dominio (es. `gestionale.slvsicurezza.it`)
3. Configura il DNS del tuo dominio con il record CNAME fornito da Railway

---

## Utilizzo quotidiano

### Come RSPP (admin)
- Accedi con le tue credenziali
- Dashboard: vedi tutte le scadenze imminenti di tutte le aziende
- Aziende: aggiungi/modifica aziende clienti
- Per ogni azienda: gestisci lavoratori, formazione, visite, nomine, attrezzature, documenti
- Utenti: crea accessi per le aziende clienti

### Come azienda cliente
- Accedi con le credenziali fornite dal consulente
- Vedi solo i dati della tua azienda (sola lettura)

---

## Aggiornamenti

Per aggiornare l'app dopo modifiche al codice:
1. In GitHub Desktop, fai "Commit" e "Push"
2. Railway si aggiorna automaticamente in 1-2 minuti

---

## Supporto tecnico
Sviluppato con Claude (Anthropic) per SLV Sicurezza — Salvatore Vitale, geometra.
