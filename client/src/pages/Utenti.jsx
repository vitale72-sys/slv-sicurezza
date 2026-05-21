import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function Utenti() {
  const [utenti, setUtenti] = useState([]);
  const [aziende, setAziende] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email:'', password:'', nome:'', azienda_id:'' });
  const f = (k,v) => setForm(x=>({...x,[k]:v}));

  useEffect(() => {
    api.getUsers().then(setUtenti).catch(console.error);
    api.getAziende().then(setAziende).catch(console.error);
  }, []);

  async function handleSave() {
    if (!form.email || !form.password) return alert('Email e password obbligatorie');
    try {
      const created = await api.createUser(form);
      setUtenti(u=>[...u, {...created, azienda_nome: aziende.find(a=>a.id==created.azienda_id)?.nome}]);
      setShowModal(false);
      setForm({ email:'', password:'', nome:'', azienda_id:'' });
    } catch(err) { alert(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questo utente?')) return;
    try {
      await api.deleteUser(id);
      setUtenti(u=>u.filter(x=>x.id!==id));
    } catch(err) { alert(err.message); }
  }

  return (
    <div className="page">
      <div className="topbar" style={{marginLeft:-24,marginRight:-24,marginTop:-24,marginBottom:24,paddingLeft:24,paddingRight:24}}>
        <span className="topbar-title">Utenti portale clienti</span>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}>+ Nuovo utente</button>
      </div>

      <div className="card">
        <p style={{fontSize:13,color:'#6b7280',marginBottom:16}}>
          Crea un account per ogni azienda cliente che vuoi far accedere al portale. L'utente vedrà solo i dati della propria azienda.
        </p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Email</th><th>Nome</th><th>Azienda associata</th><th>Ruolo</th><th></th></tr></thead>
            <tbody>
              {utenti.map(u=>(
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.nome||'—'}</td>
                  <td>{u.azienda_nome||<span style={{color:'#9ca3af'}}>Nessuna azienda</span>}</td>
                  <td><span className={`badge ${u.role==='admin'?'badge-info':'badge-gray'}`}>{u.role==='admin'?'Admin':'Cliente'}</span></td>
                  <td>{u.role!=='admin' && <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(u.id)}>Elimina</button>}</td>
                </tr>
              ))}
              {utenti.length===0 && <tr><td colSpan="5" style={{textAlign:'center',color:'#9ca3af',padding:32}}>Nessun utente</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Crea utente cliente</h3>
              <button className="modal-close" onClick={()=>setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={e=>f('email',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" value={form.password} onChange={e=>f('password',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Nome (opzionale)</label>
                <input className="form-input" value={form.nome} onChange={e=>f('nome',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Azienda associata</label>
                <select className="form-input" value={form.azienda_id} onChange={e=>f('azienda_id',e.target.value)}>
                  <option value="">Nessuna azienda</option>
                  {aziende.map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSave}>Crea utente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
