import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function Utenti() {
  const [utenti, setUtenti] = useState([]);
  const [aziende, setAziende] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email:'', password:'', nome:'', azienda_id:'', can_edit: false });
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
      setForm({ email:'', password:'', nome:'', azienda_id:'', can_edit: false });
    } catch(err) { alert(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questo utente?')) return;
    try {
      await api.deleteUser(id);
      setUtenti(u=>u.filter(x=>x.id!==id));
    } catch(err) { alert(err.message); }
  }

  async function toggleEdit(u) {
    try {
      const updated = await api.updateUser(u.id, { can_edit: !u.can_edit });
      setUtenti(list => list.map(x => x.id===u.id ? {...x, can_edit: updated.can_edit} : x));
    } catch(err) { alert(err.message); }
  }

  return (
    <div className="page">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22,flexWrap:'wrap',gap:10}}>
        <span style={{fontSize:18,fontWeight:700}}>Utenti portale clienti</span>
        <button className="btn btn-primary" onClick={()=>setShowModal(true)}>+ Nuovo utente</button>
      </div>

      <div className="card">
        <p style={{fontSize:14,color:'#6b7280',marginBottom:18}}>
          Crea un account per ogni azienda cliente. Puoi scegliere se può solo vedere i dati oppure anche modificarli.
        </p>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Email</th><th>Nome</th><th>Azienda</th><th>Permesso</th><th>Ruolo</th><th></th>
            </tr></thead>
            <tbody>
              {utenti.map(u=>(
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.nome||'—'}</td>
                  <td>{u.azienda_nome||<span style={{color:'#9ca3af'}}>Nessuna</span>}</td>
                  <td>
                    {u.role!=='admin' ? (
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div
                          onClick={()=>toggleEdit(u)}
                          style={{
                            width:44, height:24, borderRadius:12, cursor:'pointer',
                            background: u.can_edit ? '#10b981' : '#d1d5db',
                            position:'relative', transition:'background 0.2s'
                          }}
                        >
                          <div style={{
                            position:'absolute', top:3,
                            left: u.can_edit ? 23 : 3,
                            width:18, height:18, borderRadius:'50%',
                            background:'#fff', transition:'left 0.2s',
                            boxShadow:'0 1px 3px rgba(0,0,0,0.2)'
                          }}/>
                        </div>
                        <span style={{fontSize:13,color: u.can_edit ? '#065f46' : '#6b7280', fontWeight:500}}>
                          {u.can_edit ? 'Può modificare' : 'Solo lettura'}
                        </span>
                      </div>
                    ) : <span className="badge badge-info">Admin</span>}
                  </td>
                  <td><span className={`badge ${u.role==='admin'?'badge-info':'badge-gray'}`}>{u.role==='admin'?'Admin':'Cliente'}</span></td>
                  <td>{u.role!=='admin' && <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(u.id)}>Elimina</button>}</td>
                </tr>
              ))}
              {utenti.length===0 && <tr><td colSpan="6" style={{textAlign:'center',color:'#9ca3af',padding:32}}>Nessun utente</td></tr>}
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
              <div className="form-group">
                <label className="form-label">Permesso accesso</label>
                <select className="form-input" value={form.can_edit?'1':'0'} onChange={e=>f('can_edit',e.target.value==='1')}>
                  <option value="0">Sola lettura — può solo vedere i dati</option>
                  <option value="1">Può modificare — può aggiungere e modificare dati</option>
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
