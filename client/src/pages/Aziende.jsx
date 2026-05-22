import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function Aziende() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aziende, setAziende] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const emptyForm = { nome:'', piva:'', indirizzo:'', referente:'', telefono:'', email:'', settore:'', numero_dipendenti:'' };

  useEffect(() => {
    api.getAziende().then(setAziende).catch(console.error).finally(()=>setLoading(false));
  }, []);

  async function handleSave() {
    try {
      if (form.id) {
        const updated = await api.updateAzienda(form.id, form);
        setAziende(aziende.map(a=>a.id===form.id?updated:a));
      } else {
        const created = await api.createAzienda(form);
        setAziende([...aziende, created]);
      }
      setShowModal(false);
    } catch(err) { alert(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questa azienda e tutti i suoi dati?')) return;
    try {
      await api.deleteAzienda(id);
      setAziende(aziende.filter(a=>a.id!==id));
    } catch(err) { alert(err.message); }
  }

  const f = (k,v) => setForm(x=>({...x,[k]:v}));
  if (loading) return <div className="page">Caricamento...</div>;

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22,flexWrap:'wrap',gap:10}}>
        <span style={{fontSize:18,fontWeight:700}}>Aziende clienti</span>
        {user?.role==='admin' && (
          <button className="btn btn-primary" onClick={()=>{setForm(emptyForm);setShowModal(true)}}>
            + Nuova azienda
          </button>
        )}
      </div>

      {aziende.length===0 ? (
        <div className="empty">Nessuna azienda. Aggiungine una.</div>
      ) : (
        <div style={{display:'grid',gap:12}}>
          {aziende.map(a=>(
            <div key={a.id} className="azienda-row">
              <div className="azienda-info" style={{flex:1}}>
                <h3>{a.nome}</h3>
                <p>
                  {[a.settore, a.referente, a.telefono||a.email].filter(Boolean).join(' · ')||'Nessun dettaglio'}
                  {a.numero_dipendenti>0 && ` · ${a.numero_dipendenti} dipendenti`}
                </p>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                {user?.role==='admin' && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={()=>{setForm({...a});setShowModal(true)}}>
                      Modifica
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(a.id)}>
                      Elimina
                    </button>
                  </>
                )}
                <button className="btn-apri" onClick={()=>navigate(`/aziende/${a.id}`)}>
                  Apri azienda →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{form.id?'Modifica azienda':'Nuova azienda'}</h3>
              <button className="modal-close" onClick={()=>setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome azienda *</label>
                <input className="form-input" value={form.nome||''} onChange={e=>f('nome',e.target.value)} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Partita IVA</label>
                  <input className="form-input" value={form.piva||''} onChange={e=>f('piva',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Settore</label>
                  <input className="form-input" value={form.settore||''} onChange={e=>f('settore',e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Indirizzo</label>
                <input className="form-input" value={form.indirizzo||''} onChange={e=>f('indirizzo',e.target.value)} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Referente</label>
                  <input className="form-input" value={form.referente||''} onChange={e=>f('referente',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">N. dipendenti</label>
                  <input className="form-input" type="number" value={form.numero_dipendenti||''} onChange={e=>f('numero_dipendenti',e.target.value)} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Telefono</label>
                  <input className="form-input" value={form.telefono||''} onChange={e=>f('telefono',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email||''} onChange={e=>f('email',e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSave}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
