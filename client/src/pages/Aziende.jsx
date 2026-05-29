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
      <div className="topbar" style={{marginLeft:-24,marginRight:-24,marginTop:-24,marginBottom:24,paddingLeft:24,paddingRight:24}}>
        <span className="topbar-title">Aziende clienti</span>
        {user?.role==='admin' && (
          <button className="btn btn-primary btn-sm" onClick={()=>{setForm(emptyForm);setShowModal(true)}}>
            + Nuova azienda
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Nome azienda</th><th>P.IVA</th><th>Referente</th><th>Settore</th>
              <th>Dipendenti</th><th>Contatto</th><th></th>
            </tr></thead>
            <tbody>
              {aziende.map(a=>(
                <tr key={a.id}>
                  <td style={{fontWeight:500,cursor:'pointer',color:'#0f3460'}} onClick={()=>navigate(`/aziende/${a.id}`)}>
                    {a.nome}
                  </td>
                  <td>{a.piva||'—'}</td>
                  <td>{a.referente||'—'}</td>
                  <td>{a.settore||'—'}</td>
                  <td>{a.numero_dipendenti||0}</td>
                  <td>{a.telefono||a.email||'—'}</td>
                  <td>
                    {user?.role==='admin' && (
                      <div style={{display:'flex',gap:6}}>
                        <button className="btn btn-secondary btn-sm" onClick={()=>{setForm({...a});setShowModal(true)}}>Modifica</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(a.id)}>Elimina</button>
                      </div>
                    )}
                    <button className="btn btn-secondary btn-sm" style={{marginLeft:user?.role==='admin'?0:0}} onClick={()=>navigate(`/aziende/${a.id}`)}>Dettaglio →</button>
                  </td>
                </tr>
              ))}
              {aziende.length===0 && <tr><td colSpan="7" style={{textAlign:'center',color:'#9ca3af',padding:40}}>Nessuna azienda. Aggiungine una.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

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
