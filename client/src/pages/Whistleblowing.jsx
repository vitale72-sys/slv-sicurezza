// ═══════════════════════════════════════════════════════════════
// WhistleblowingPubblico.jsx — Pagina pubblica senza login
// URL: /segnala/:aziendaId
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { lingue, t, getLingua, setLingua } from '../i18n/traduzioni.js';

const CATEGORIE = {
  it: ['Violazione sicurezza sul lavoro','Molestie o discriminazioni','Corruzione o frodi','Violazione normativa ambientale','Illeciti amministrativi','Altro'],
  en: ['Workplace safety violation','Harassment or discrimination','Corruption or fraud','Environmental violation','Administrative offenses','Other'],
  fr: ['Violation sécurité au travail','Harcèlement ou discrimination','Corruption ou fraude','Violation environnementale','Infractions administratives','Autre'],
  ro: ['Încălcarea siguranței la muncă','Hărțuire sau discriminare','Corupție sau fraudă','Încălcare de mediu','Infracțiuni administrative','Altele'],
  al: ['Shkelje sigurie në punë','Ngacmim ose diskriminim','Korrupsion ose mashtrim','Shkelje mjedisore','Shkelje administrative','Tjetër'],
  hi: ['कार्यस्थल सुरक्षा उल्लंघन','उत्पीड़न या भेदभाव','भ्रष्टाचार या धोखाधड़ी','पर्यावरण उल्लंघन','प्रशासनिक अपराध','अन्य'],
};

export function WhistleblowingPubblico() {
  const { aziendaId } = useParams();
  const [lingua, setLinguaState] = useState(getLingua());
  const [form, setForm] = useState({ categoria: '', descrizione: '', luogo: '', data_fatto: '' });
  const [step, setStep] = useState('form'); // form | successo | verifica
  const [codice, setCodice] = useState('');
  const [codiceCerca, setCodiceCerca] = useState('');
  const [statoSegnalazione, setStatoSegnalazione] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const f = (k, v) => setForm(x => ({...x, [k]: v}));

  function handleLingua(codice) { setLingua(codice); setLinguaState(codice); }

  async function handleInvia(e) {
    e.preventDefault();
    if (!form.descrizione || form.descrizione.length < 20) {
      setError('Descrizione troppo breve (minimo 20 caratteri)'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/whistleblowing/segnala/${aziendaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCodice(data.codice_segnalazione);
      setStep('successo');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifica(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/whistleblowing/stato/${codiceCerca}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatoSegnalazione(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const categorie = CATEGORIE[lingua] || CATEGORIE.it;

  return (
    <div style={{minHeight:'100vh',background:'#f4f6fa',padding:'24px 16px'}}>
      <div style={{maxWidth:560,margin:'0 auto'}}>
        {/* Header */}
        <div style={{background:'#0f3460',borderRadius:14,padding:'24px',marginBottom:20,color:'white',textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:8}}>🔒</div>
          <h2 style={{fontSize:20,fontWeight:700,marginBottom:6}}>SLV Sicurezza</h2>
          <p style={{fontSize:14,opacity:0.75}}>{t(lingua, 'wb_anonima')}</p>
        </div>

        {/* Selettore lingua */}
        <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:20,flexWrap:'wrap'}}>
          {lingue.map(l => (
            <button key={l.code} onClick={() => handleLingua(l.code)} style={{
              padding:'5px 10px',borderRadius:20,cursor:'pointer',fontSize:12,fontWeight:600,
              border: lingua === l.code ? '2px solid #0f3460' : '1.5px solid #e2e8f0',
              background: lingua === l.code ? '#eff6ff' : 'white',
              color: lingua === l.code ? '#0f3460' : '#6b7280',
            }}>
              {l.flag} {l.label}
            </button>
          ))}
        </div>

        {/* Tab: form / verifica */}
        {step !== 'successo' && (
          <div style={{display:'flex',gap:0,marginBottom:20,background:'white',borderRadius:10,padding:4,border:'1px solid #e8ecf4'}}>
            <button onClick={() => setStep('form')} style={{
              flex:1,padding:'10px',borderRadius:8,border:'none',cursor:'pointer',
              fontWeight:600,fontSize:14,
              background: step === 'form' ? '#0f3460' : 'transparent',
              color: step === 'form' ? 'white' : '#6b7280',
            }}>
              {t(lingua, 'wb_titolo')}
            </button>
            <button onClick={() => setStep('verifica')} style={{
              flex:1,padding:'10px',borderRadius:8,border:'none',cursor:'pointer',
              fontWeight:600,fontSize:14,
              background: step === 'verifica' ? '#0f3460' : 'transparent',
              color: step === 'verifica' ? 'white' : '#6b7280',
            }}>
              {t(lingua, 'wb_verifica')}
            </button>
          </div>
        )}

        <div style={{background:'white',borderRadius:14,border:'1px solid #e8ecf4',padding:28,boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>

          {/* FORM SEGNALAZIONE */}
          {step === 'form' && (
            <form onSubmit={handleInvia}>
              <div style={{background:'#fef3c7',border:'1px solid #fde68a',borderRadius:8,padding:'12px 16px',marginBottom:20,fontSize:13,color:'#92400e'}}>
                ⚠️ Non inserire il tuo nome o dati identificativi nel testo.
              </div>
              <div className="form-group">
                <label className="form-label">{t(lingua, 'wb_categoria')}</label>
                <select className="form-input" value={form.categoria} onChange={e => f('categoria', e.target.value)}>
                  <option value="">—</option>
                  {categorie.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t(lingua, 'wb_descrizione')}</label>
                <textarea className="form-input" rows="5" value={form.descrizione}
                  onChange={e => f('descrizione', e.target.value)}
                  placeholder="Descrivi in dettaglio cosa hai osservato..." required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t(lingua, 'wb_luogo')}</label>
                  <input className="form-input" value={form.luogo} onChange={e => f('luogo', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t(lingua, 'wb_data')}</label>
                  <input className="form-input" type="date" value={form.data_fatto}
                    onChange={e => f('data_fatto', e.target.value)} />
                </div>
              </div>
              {error && <div style={{color:'#dc2626',fontSize:13,marginBottom:12}}>{error}</div>}
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{width:'100%',justifyContent:'center',padding:12}}>
                {loading ? t(lingua, 'caricamento') : t(lingua, 'wb_invia')}
              </button>
            </form>
          )}

          {/* SUCCESSO */}
          {step === 'successo' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:16}}>✅</div>
              <h3 style={{fontSize:18,fontWeight:700,marginBottom:12}}>Segnalazione ricevuta</h3>
              <p style={{fontSize:14,color:'#6b7280',marginBottom:24}}>
                {t(lingua, 'wb_conserva')}
              </p>
              <div style={{background:'#f0f9ff',border:'2px solid #0f3460',borderRadius:12,padding:'20px',marginBottom:24}}>
                <div style={{fontSize:11,color:'#6b7280',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  {t(lingua, 'wb_codice')}
                </div>
                <div style={{fontSize:28,fontWeight:800,color:'#0f3460',letterSpacing:4}}>{codice}</div>
              </div>
              <button className="btn btn-secondary" onClick={() => { setStep('verifica'); setCodiceCerca(codice); }}
                style={{width:'100%',justifyContent:'center'}}>
                {t(lingua, 'wb_verifica')}
              </button>
            </div>
          )}

          {/* VERIFICA STATO */}
          {step === 'verifica' && (
            <div>
              <form onSubmit={handleVerifica}>
                <div className="form-group">
                  <label className="form-label">{t(lingua, 'wb_codice')}</label>
                  <input className="form-input" value={codiceCerca}
                    onChange={e => setCodiceCerca(e.target.value.toUpperCase())}
                    placeholder="WB-XXXXXXXX" style={{textTransform:'uppercase',fontFamily:'monospace',fontSize:16}}/>
                </div>
                {error && <div style={{color:'#dc2626',fontSize:13,marginBottom:12}}>{error}</div>}
                <button type="submit" className="btn btn-primary" disabled={loading}
                  style={{width:'100%',justifyContent:'center',padding:12}}>
                  {loading ? t(lingua, 'caricamento') : t(lingua, 'wb_verifica')}
                </button>
              </form>
              {statoSegnalazione && (
                <div style={{marginTop:24,background:'#f8fafc',borderRadius:10,padding:20,border:'1px solid #e8ecf4'}}>
                  <div style={{marginBottom:12}}>
                    <span style={{fontSize:11,color:'#6b7280',textTransform:'uppercase'}}>Codice: </span>
                    <strong>{statoSegnalazione.codice_segnalazione}</strong>
                  </div>
                  <div style={{marginBottom:12}}>
                    <span style={{fontSize:11,color:'#6b7280',textTransform:'uppercase'}}>{t(lingua, 'wb_stato')}: </span>
                    <span className={`badge ${statoSegnalazione.stato === 'chiusa' ? 'badge-ok' : statoSegnalazione.stato === 'in_istruttoria' ? 'badge-warning' : 'badge-info'}`}>
                      {t(lingua, `wb_${statoSegnalazione.stato}`)}
                    </span>
                  </div>
                  <div style={{marginBottom:12}}>
                    <span style={{fontSize:11,color:'#6b7280',textTransform:'uppercase'}}>Ricevuta il: </span>
                    {new Date(statoSegnalazione.ricevuta_il).toLocaleDateString('it-IT')}
                  </div>
                  {statoSegnalazione.risposta_admin && (
                    <div style={{background:'#eff6ff',borderRadius:8,padding:14,marginTop:12}}>
                      <div style={{fontSize:11,color:'#6b7280',marginBottom:6,textTransform:'uppercase'}}>{t(lingua, 'wb_risposta')}</div>
                      <p style={{fontSize:14,color:'#1a1a2e'}}>{statoSegnalazione.risposta_admin}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WhistleblowingAdmin.jsx — Vista admin dentro AziendaDettaglio
// ═══════════════════════════════════════════════════════════════
export function WhistleblowingAdmin({ aziendaId, lingua = 'it' }) {
  const [lista, setLista] = useState([]);
  const [selected, setSelected] = useState(null);
  const [risposta, setRisposta] = useState('');
  const [stato, setStato] = useState('');
  const [loading, setLoading] = useState(true);
  const baseUrl = window.location.origin;

  useEffect(() => {
    fetch(`/api/whistleblowing/azienda/${aziendaId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('slv_token')}` }
    }).then(r => r.json()).then(setLista).catch(console.error).finally(() => setLoading(false));
  }, [aziendaId]);

  async function handleAggiorna() {
    const token = localStorage.getItem('slv_token');
    const res = await fetch(`/api/whistleblowing/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stato, risposta_admin: risposta })
    });
    const data = await res.json();
    setLista(l => l.map(i => i.id === selected.id ? data : i));
    setSelected(null);
  }

  const STATO_COL = { ricevuta: 'badge-danger', in_istruttoria: 'badge-warning', chiusa: 'badge-ok' };

  if (loading) return <div style={{padding:20,color:'#6b7280'}}>{t(lingua, 'caricamento')}</div>;

  return (
    <div>
      <div className="card-header">
        <span className="card-title">🔒 Whistleblowing</span>
        <a href={`${baseUrl}/segnala/${aziendaId}`} target="_blank" rel="noreferrer"
          className="btn btn-secondary btn-sm">
          Link segnalazione →
        </a>
      </div>
      <div style={{background:'#fef3c7',border:'1px solid #fde68a',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#92400e'}}>
        ⚠️ Dati riservati. Accesso limitato solo a te come RSPP.
      </div>
      {lista.length === 0 ? (
        <div className="empty">Nessuna segnalazione ricevuta</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Codice</th><th>Categoria</th><th>Ricevuta il</th><th>{t(lingua, 'wb_stato')}</th><th></th>
            </tr></thead>
            <tbody>
              {lista.map(r => (
                <tr key={r.id}>
                  <td style={{fontFamily:'monospace',fontWeight:600}}>{r.codice_segnalazione}</td>
                  <td>{r.categoria || '—'}</td>
                  <td style={{fontSize:13}}>{new Date(r.ricevuta_il).toLocaleDateString('it-IT')}</td>
                  <td><span className={`badge ${STATO_COL[r.stato]}`}>{t(lingua, `wb_${r.stato}`)}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => { setSelected(r); setRisposta(r.risposta_admin || ''); setStato(r.stato); }}>
                      Gestisci
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Segnalazione {selected.codice_segnalazione}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              {selected.categoria && <div style={{marginBottom:12}}><strong>Categoria:</strong> {selected.categoria}</div>}
              <div style={{background:'#f8fafc',borderRadius:8,padding:14,marginBottom:16}}>
                <div style={{fontSize:11,color:'#6b7280',marginBottom:6,textTransform:'uppercase'}}>Descrizione</div>
                <p style={{fontSize:14,lineHeight:1.7}}>{selected.descrizione}</p>
              </div>
              {selected.luogo && <div style={{marginBottom:8,fontSize:13}}><strong>Luogo:</strong> {selected.luogo}</div>}
              {selected.data_fatto && <div style={{marginBottom:16,fontSize:13}}><strong>Data fatto:</strong> {new Date(selected.data_fatto).toLocaleDateString('it-IT')}</div>}
              <div className="form-group">
                <label className="form-label">Stato</label>
                <select className="form-input" value={stato} onChange={e => setStato(e.target.value)}>
                  <option value="ricevuta">Ricevuta</option>
                  <option value="in_istruttoria">In istruttoria</option>
                  <option value="chiusa">Chiusa</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Risposta al segnalante (visibile con il codice)</label>
                <textarea className="form-input" rows="4" value={risposta}
                  onChange={e => setRisposta(e.target.value)}
                  placeholder="La risposta sarà visibile al segnalante tramite il codice..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleAggiorna}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
