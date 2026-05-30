import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════
// EseguiQuiz — Pagina pubblica per compilare il quiz
// URL: /quiz/:quizId/:lavoratoreId
// ═══════════════════════════════════════════════════════════════
export function EseguiQuiz() {
  const { quizId, lavoratoreId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [domandaCorrente, setDomandaCorrente] = useState(0);
  const [risposte, setRisposte] = useState({});
  const [step, setStep] = useState('inizio'); // inizio | quiz | risultato
  const [risultato, setRisultato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tempo, setTempo] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch(`/api/quiz/${quizId}/esegui`)
      .then(r => r.json())
      .then(setQuiz)
      .catch(console.error);
  }, [quizId]);

  function iniziaQuiz() {
    setStep('quiz');
    timerRef.current = setInterval(() => setTempo(s => s + 1), 1000);
  }

  function handleRisposta(domandaId, rispostaId) {
    setRisposte(r => ({...r, [domandaId]: rispostaId}));
  }

  async function handleInvia() {
    clearInterval(timerRef.current);
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz/${quizId}/invia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lavoratore_id: lavoratoreId,
          risposte_date: risposte,
          lingua_usata: 'it',
          tempo_impiegato: tempo
        })
      });
      const data = await res.json();
      setRisultato(data);
      setStep('risultato');
    } catch (err) {
      alert('Errore nell\'invio');
    } finally {
      setLoading(false);
    }
  }

  function formatTempo(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (!quiz) return <div style={{padding:40,textAlign:'center',fontSize:16}}>Caricamento...</div>;

  return (
    <div style={{minHeight:'100vh',background:'#f4f6fa',padding:'24px 16px'}}>
      <div style={{maxWidth:600,margin:'0 auto'}}>

        {/* Header */}
        <div style={{background:'#0f3460',borderRadius:14,padding:'20px 24px',marginBottom:20,color:'white'}}>
          <div style={{fontSize:12,opacity:0.6,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px'}}>SLV Sicurezza</div>
          <h2 style={{fontSize:18,fontWeight:700}}>{quiz.titolo}</h2>
          {quiz.descrizione && <p style={{fontSize:13,opacity:0.75,marginTop:6}}>{quiz.descrizione}</p>}
        </div>

        {/* SCHERMATA INIZIALE */}
        {step === 'inizio' && (
          <div style={{background:'white',borderRadius:14,border:'1px solid #e8ecf4',padding:32,textAlign:'center'}}>
            <div style={{fontSize:24,marginBottom:16}}>📝</div>
            <h3 style={{fontSize:18,fontWeight:700,marginBottom:8}}>Quiz di formazione</h3>
            <div style={{background:'#f8fafc',borderRadius:10,padding:16,marginBottom:24,textAlign:'left',fontSize:14}}>
              <div style={{marginBottom:6}}>📝 <strong>{quiz.domande?.length || '—'}</strong> domande</div>
              <div style={{marginBottom:6}}>✅ Punteggio minimo: <strong>{quiz.punteggio_minimo}%</strong></div>
              {quiz.tempo_limite && <div>⏱ Tempo limite: <strong>{quiz.tempo_limite} minuti</strong></div>}
            </div>
            <button className="btn btn-primary" onClick={iniziaQuiz}
              style={{width:'100%',justifyContent:'center',padding:13,fontSize:16}}>
              Inizia →
            </button>
          </div>
        )}

        {/* QUIZ */}
        {step === 'quiz' && quiz.domande && (
          <div>
            {/* Progress bar */}
            <div style={{background:'white',borderRadius:10,padding:'14px 20px',marginBottom:16,border:'1px solid #e8ecf4',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:13,fontWeight:600,color:'#6b7280'}}>
                Domanda {domandaCorrente + 1} di {quiz.domande.length}
              </span>
              <span style={{fontSize:13,color:'#6b7280'}}>⏱ {formatTempo(tempo)}</span>
            </div>
            <div style={{background:'#e8ecf4',borderRadius:4,height:4,marginBottom:20,overflow:'hidden'}}>
              <div style={{
                height:'100%',background:'#0f3460',borderRadius:4,
                width: `${((domandaCorrente + 1) / quiz.domande.length) * 100}%`,
                transition:'width 0.3s'
              }}/>
            </div>

            {/* Domanda */}
            <div style={{background:'white',borderRadius:14,border:'1px solid #e8ecf4',padding:28,marginBottom:16}}>
              <p style={{fontSize:17,fontWeight:600,lineHeight:1.5,marginBottom:24,color:'#1a1a2e'}}>
                {quiz.domande[domandaCorrente].testo}
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {quiz.domande[domandaCorrente].risposte.map(r => {
                  const selezionata = risposte[quiz.domande[domandaCorrente].id] === r.id;
                  return (
                    <div key={r.id} onClick={() => handleRisposta(quiz.domande[domandaCorrente].id, r.id)}
                      style={{
                        padding:'14px 18px',borderRadius:10,cursor:'pointer',
                        border: selezionata ? '2px solid #0f3460' : '1.5px solid #e2e8f0',
                        background: selezionata ? '#eff6ff' : 'white',
                        fontSize:15,fontWeight: selezionata ? 600 : 400,
                        color: selezionata ? '#0f3460' : '#374151',
                        transition:'all 0.15s',
                        display:'flex',alignItems:'center',gap:12,
                      }}>
                      <div style={{
                        width:20,height:20,borderRadius:'50%',flexShrink:0,
                        border: selezionata ? '2px solid #0f3460' : '2px solid #d1d5db',
                        background: selezionata ? '#0f3460' : 'transparent',
                        display:'flex',alignItems:'center',justifyContent:'center',
                      }}>
                        {selezionata && <div style={{width:8,height:8,borderRadius:'50%',background:'white'}}/>}
                      </div>
                      {r.testo}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigazione */}
            <div style={{display:'flex',gap:12,justifyContent:'space-between'}}>
              <button className="btn btn-secondary"
                onClick={() => setDomandaCorrente(d => d - 1)}
                disabled={domandaCorrente === 0}
                style={{flex:1,justifyContent:'center'}}>
                ← Indietro
              </button>
              {domandaCorrente < quiz.domande.length - 1 ? (
                <button className="btn btn-primary"
                  onClick={() => setDomandaCorrente(d => d + 1)}
                  disabled={!risposte[quiz.domande[domandaCorrente].id]}
                  style={{flex:1,justifyContent:'center'}}>
                  Avanti →
                </button>
              ) : (
                <button className="btn btn-primary"
                  onClick={handleInvia}
                  disabled={loading || !risposte[quiz.domande[domandaCorrente].id]}
                  style={{flex:1,justifyContent:'center',background:'#059669'}}>
                  {loading ? '...' : 'Invia risposte'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* RISULTATO */}
        {step === 'risultato' && risultato && (
          <div style={{background:'white',borderRadius:14,border:'1px solid #e8ecf4',padding:32,textAlign:'center'}}>
            <div style={{
              width:100,height:100,borderRadius:'50%',margin:'0 auto 24px',
              background: risultato.superato ? '#d1fae5' : '#fee2e2',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:42,
            }}>
              {risultato.superato ? '✅' : '❌'}
            </div>
            <h2 style={{fontSize:24,fontWeight:800,marginBottom:8,color: risultato.superato ? '#059669' : '#dc2626'}}>
              {risultato.superato ? '✅ Superato!' : '❌ Non superato'}
            </h2>

            {/* Punteggio grande */}
            <div style={{
              background: risultato.superato ? '#f0fdf4' : '#fff5f5',
              borderRadius:14,padding:'24px',margin:'20px 0',
              border: `2px solid ${risultato.superato ? '#a7f3d0' : '#fecaca'}`
            }}>
              <div style={{fontSize:52,fontWeight:900,color: risultato.superato ? '#059669' : '#dc2626',lineHeight:1}}>
                {risultato.punteggio}<span style={{fontSize:28}}>%</span>
              </div>
              <div style={{fontSize:14,color:'#6b7280',marginTop:8}}>
                Risposte corrette: {risultato.risposte_giuste} su {risultato.totale_domande}
              </div>
              <div style={{fontSize:13,color:'#9ca3af',marginTop:4}}>
                Punteggio minimo richiesto: {risultato.punteggio_minimo}%
              </div>
            </div>

            <div style={{fontSize:13,color:'#6b7280',marginBottom:24}}>
              ⏱ Tempo impiegato: {formatTempo(tempo)}
            </div>

            {!risultato.superato && (
              <button className="btn btn-primary" onClick={() => {
                setStep('quiz'); setDomandaCorrente(0); setRisposte({}); setTempo(0);
                timerRef.current = setInterval(() => setTempo(s => s + 1), 1000);
              }} style={{width:'100%',justifyContent:'center',padding:13}}>
                Riprova
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QuizAdmin — Gestione quiz dentro AziendaDettaglio
// ═══════════════════════════════════════════════════════════════
export function QuizAdmin({ aziendaId, lavoratori }) {
  const [lista, setLista] = useState([]);
  const [modal, setModal] = useState(null); // null | 'nuovo' | 'domande' | 'risultati'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [dettaglio, setDettaglio] = useState(null);
  const [risultati, setRisultati] = useState([]);
  const [nuovaDomanda, setNuovaDomanda] = useState({ testo: '', risposte: [
    { testo: '', corretta: true },
    { testo: '', corretta: false },
    { testo: '', corretta: false },
    { testo: '', corretta: false },
  ]});
  const [loading, setLoading] = useState(true);
  const f = (k, v) => setForm(x => ({...x, [k]: v}));
  const token = () => localStorage.getItem('slv_token');
  const baseUrl = window.location.origin;

  useEffect(() => {
    fetch(`/api/quiz/azienda/${aziendaId}`, {
      headers: { Authorization: `Bearer ${token()}` }
    }).then(r => r.json()).then(setLista).catch(console.error).finally(() => setLoading(false));
  }, [aziendaId]);

  async function creaQuiz() {
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...form, azienda_id: aziendaId })
    });
    const data = await res.json();
    setLista(l => [data, ...l]);
    setModal(null);
  }

  async function apriDomande(quiz) {
    setSelected(quiz);
    const res = await fetch(`/api/quiz/${quiz.id}/dettaglio`, {
      headers: { Authorization: `Bearer ${token()}` }
    });
    setDettaglio(await res.json());
    setModal('domande');
  }

  async function aggiungiDomanda() {
    if (!nuovaDomanda.testo) return alert('Inserisci il testo della domanda');
    if (!nuovaDomanda.risposte.some(r => r.corretta)) return alert('Seleziona almeno una risposta corretta');
    const res = await fetch(`/api/quiz/${selected.id}/domande`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(nuovaDomanda)
    });
    if (res.ok) await apriDomande(selected);
    setNuovaDomanda({ testo: '', risposte: [
      { testo: '', corretta: true },
      { testo: '', corretta: false },
      { testo: '', corretta: false },
      { testo: '', corretta: false },
    ]});
  }

  async function eliminaDomanda(domandaId) {
    if (!confirm('Eliminare questa domanda?')) return;
    await fetch(`/api/quiz/domande/${domandaId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token()}` }
    });
    await apriDomande(selected);
  }

  async function apriRisultati(quiz) {
    setSelected(quiz);
    const res = await fetch(`/api/quiz/${quiz.id}/risultati`, {
      headers: { Authorization: `Bearer ${token()}` }
    });
    setRisultati(await res.json());
    setModal('risultati');
  }

  async function eliminaQuiz(id) {
    if (!confirm('Eliminare questo quiz?')) return;
    await fetch(`/api/quiz/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    setLista(l => l.filter(q => q.id !== id));
  }

  if (loading) return <div style={{padding:20,color:'#6b7280'}}>Caricamento...</div>;

  return (
    <div>
      <div className="card-header">
        <span className="card-title">📝 Quiz</span>
        <button className="btn btn-primary btn-sm"
          onClick={() => { setForm({ punteggio_minimo: 70 }); setModal('nuovo'); }}>
          + Nuovo quiz
        </button>
      </div>

      {lista.length === 0 ? (
        <div className="empty">Nessun quiz creato</div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {lista.map(q => (
            <div key={q.id} style={{background:'#f8fafc',borderRadius:10,padding:'16px 20px',border:'1px solid #e8ecf4',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
              <div>
                <div style={{fontWeight:600,fontSize:15}}>{q.titolo}</div>
                <div style={{fontSize:13,color:'#6b7280',marginTop:3}}>
                  {q.n_domande} domande · minimo {q.punteggio_minimo}% · {q.n_completamenti} completamenti
                </div>
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button className="btn btn-secondary btn-sm" onClick={() => apriDomande(q)}>Domande</button>
                <button className="btn btn-secondary btn-sm" onClick={() => apriRisultati(q)}>Risultati</button>
                {lavoratori?.length > 0 && (
                  <a href={`${baseUrl}/quiz/${q.id}/${lavoratori[0]?.id}`} target="_blank" rel="noreferrer"
                    className="btn btn-success btn-sm">
                    Anteprima
                  </a>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => eliminaQuiz(q.id)}>Elimina</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuovo quiz */}
      {modal === 'nuovo' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Nuovo quiz</h3>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Titolo *</label>
                <input className="form-input" value={form.titolo || ''} onChange={e => f('titolo', e.target.value)}
                  placeholder="es. Formazione generale D.Lgs. 81/08" />
              </div>
              <div className="form-group">
                <label className="form-label">Descrizione</label>
                <textarea className="form-input" rows="2" value={form.descrizione || ''} onChange={e => f('descrizione', e.target.value)} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Punteggio minimo (%)</label>
                  <input className="form-input" type="number" min="0" max="100"
                    value={form.punteggio_minimo || 70} onChange={e => f('punteggio_minimo', parseInt(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tempo limite (minuti, 0=nessuno)</label>
                  <input className="form-input" type="number" min="0"
                    value={form.tempo_limite || ''} onChange={e => f('tempo_limite', e.target.value ? parseInt(e.target.value) : null)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Annulla</button>
              <button className="btn btn-primary" onClick={creaQuiz}>Crea quiz</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal domande */}
      {modal === 'domande' && dettaglio && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{maxWidth:680}}>
            <div className="modal-header">
              <h3>Domande — {dettaglio.titolo}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body" style={{maxHeight:'70vh',overflowY:'auto'}}>
              {/* Domande esistenti */}
              {dettaglio.domande?.map((d, i) => (
                <div key={d.id} style={{background:'#f8fafc',borderRadius:10,padding:14,marginBottom:12,border:'1px solid #e8ecf4'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                    <div style={{fontWeight:600,fontSize:14}}>{i + 1}. {d.testo}</div>
                    <button className="btn btn-danger btn-sm" onClick={() => eliminaDomanda(d.id)}>✕</button>
                  </div>
                  {d.risposte.map(r => (
                    <div key={r.id} style={{
                      padding:'6px 12px',borderRadius:7,marginBottom:5,fontSize:13,
                      background: r.corretta ? '#d1fae5' : '#f1f5f9',
                      color: r.corretta ? '#065f46' : '#374151',
                      border: r.corretta ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                      display:'flex',alignItems:'center',gap:8,
                    }}>
                      {r.corretta ? '✅' : '○'} {r.testo}
                    </div>
                  ))}
                </div>
              ))}

              {/* Nuova domanda */}
              <div style={{background:'#eff6ff',borderRadius:10,padding:16,border:'2px dashed #93c5fd'}}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:'#0f3460'}}>+ Aggiungi domanda</div>
                <div className="form-group">
                  <label className="form-label">Testo domanda</label>
                  <textarea className="form-input" rows="2" value={nuovaDomanda.testo}
                    onChange={e => setNuovaDomanda(n => ({...n, testo: e.target.value}))}
                    placeholder="Scrivi la domanda..." />
                </div>
                {nuovaDomanda.risposte.map((r, i) => (
                  <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
                    <input type="radio" checked={r.corretta} onChange={() =>
                      setNuovaDomanda(n => ({...n, risposte: n.risposte.map((r2, j) => ({...r2, corretta: j === i}))}))}
                      style={{flexShrink:0}} title="Risposta corretta" />
                    <input className="form-input" value={r.testo} style={{flex:1}}
                      placeholder={`Risposta ${i + 1}${i === 0 ? ' (corretta)' : ''}`}
                      onChange={e => setNuovaDomanda(n => ({...n,
                        risposte: n.risposte.map((r2, j) => j === i ? {...r2, testo: e.target.value} : r2)
                      }))} />
                  </div>
                ))}
                <p style={{fontSize:12,color:'#6b7280',marginBottom:10}}>
                  🔘 Seleziona il pallino accanto alla risposta corretta
                </p>
                <button className="btn btn-primary btn-sm" onClick={aggiungiDomanda}>
                  Aggiungi domanda
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Chiudi</button>
              {lavoratori?.length > 0 && (
                <a href={`${baseUrl}/quiz/${dettaglio.id}/${lavoratori[0]?.id}`}
                  target="_blank" rel="noreferrer" className="btn btn-success">
                  🔗 Link quiz
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal risultati */}
      {modal === 'risultati' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" style={{maxWidth:640}}>
            <div className="modal-header">
              <h3>Risultati — {selected?.titolo}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {risultati.length === 0 ? (
                <div className="empty">Nessun risultato ancora</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>Lavoratore</th><th>Punteggio</th><th>Esito</th><th>Data</th><th>Lingua</th>
                    </tr></thead>
                    <tbody>
                      {risultati.map(r => (
                        <tr key={r.id}>
                          <td style={{fontWeight:600}}>{r.cognome} {r.nome}</td>
                          <td>
                            <strong style={{color: r.superato ? '#059669' : '#dc2626'}}>{r.punteggio}%</strong>
                          </td>
                          <td>
                            <span className={`badge ${r.superato ? 'badge-ok' : 'badge-danger'}`}>
                              {r.superato ? '✅ Superato' : '❌ Non superato'}
                            </span>
                          </td>
                          <td style={{fontSize:13}}>{new Date(r.completato_il).toLocaleDateString('it-IT')}</td>
                          <td style={{fontSize:13}}>{r.lingua_usata || 'it'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Chiudi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
