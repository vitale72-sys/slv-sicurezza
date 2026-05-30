import { useState, useEffect } from 'react';

const GRAVITA_COLORI = { bassa: 'badge-ok', media: 'badge-warning', alta: 'badge-danger' };
const STATO_COLORI = { aperto: 'badge-danger', in_corso: 'badge-warning', chiuso: 'badge-ok' };
const GRAVITA_LABEL = { bassa: 'Bassa', media: 'Media', alta: 'Alta' };
const STATO_LABEL = { aperto: 'Aperto', in_corso: 'In corso', chiuso: 'Chiuso' };

export default function NearMiss({ aziendaId, canEdit }) {
  const [lista, setLista] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const f = (k, v) => setForm(x => ({...x, [k]: v}));

  useEffect(() => {
    fetch(`/api/nearmiss/azienda/${aziendaId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('slv_token')}` }
    }).then(r => r.json()).then(setLista).catch(console.error).finally(() => setLoading(false));
  }, [aziendaId]);

  async function handleSave() {
    if (!form.descrizione) return alert('Descrizione richiesta');
    try {
      const token = localStorage.getItem('slv_token');
      const url = form.id ? `/api/nearmiss/${form.id}` : '/api/nearmiss';
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, azienda_id: aziendaId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (form.id) setLista(l => l.map(i => i.id === form.id ? data : i));
      else setLista(l => [data, ...l]);
      setModal(false);
    } catch (err) { alert(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questo elemento?')) return;
    const token = localStorage.getItem('slv_token');
    await fetch(`/api/nearmiss/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setLista(l => l.filter(i => i.id !== id));
  }

  if (loading) return <div style={{padding:20,color:'#6b7280'}}>Caricamento...</div>;

  return (
    <div>
      <div className="card-header">
        <span className="card-title">⚠️ Near Miss</span>
        {canEdit && (
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({ gravita: 'bassa', stato: 'aperto' }); setModal(true); }}>
            + Aggiungi
          </button>
        )}
      </div>

      {lista.length === 0 ? (
        <div className="empty">Nessun near miss registrato</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Data</th>
              <th>Luogo</th>
              <th>Descrizione</th>
              <th>Gravità</th>
              <th>Stato</th>
              <th></th>
            </tr></thead>
            <tbody>
              {lista.map(r => (
                <tr key={r.id}>
                  <td style={{fontSize:13}}>{new Date(r.data_evento).toLocaleDateString('it-IT')}</td>
                  <td>{r.luogo || '—'}</td>
                  <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {r.descrizione}
                  </td>
                  <td>
                    <span className={`badge ${GRAVITA_COLORI[r.gravita]}`}>
                      {GRAVITA_LABEL[r.gravita] || r.gravita}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATO_COLORI[r.stato]}`}>
                      {STATO_LABEL[r.stato] || r.stato}
                    </span>
                  </td>
                  <td>
                    {canEdit && (
                      <div style={{display:'flex',gap:5}}>
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => { setForm({...r}); setModal(true); }}>
                          Modifica
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>
                          Elimina
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Segnalazione Near Miss</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Luogo</label>
                  <input className="form-input" value={form.luogo || ''} onChange={e => f('luogo', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reparto</label>
                  <input className="form-input" value={form.reparto || ''} onChange={e => f('reparto', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descrizione accaduto *</label>
                <textarea className="form-input" rows="3" value={form.descrizione || ''}
                  onChange={e => f('descrizione', e.target.value)}
                  placeholder="Descrivi cosa è accaduto..." />
              </div>
              <div className="form-group">
                <label className="form-label">Causa probabile</label>
                <textarea className="form-input" rows="2" value={form.causa_probabile || ''}
                  onChange={e => f('causa_probabile', e.target.value)} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Gravità</label>
                  <select className="form-input" value={form.gravita || 'bassa'} onChange={e => f('gravita', e.target.value)}>
                    <option value="bassa">Bassa</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Persone coinvolte</label>
                  <input className="form-input" type="number" value={form.persone_coinvolte || 0}
                    onChange={e => f('persone_coinvolte', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Azione correttiva</label>
                <textarea className="form-input" rows="2" value={form.azione_correttiva || ''}
                  onChange={e => f('azione_correttiva', e.target.value)} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Stato</label>
                  <select className="form-input" value={form.stato || 'aperto'} onChange={e => f('stato', e.target.value)}>
                    <option value="aperto">Aperto</option>
                    <option value="in_corso">In corso</option>
                    <option value="chiuso">Chiuso</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Segnalato da</label>
                  <input className="form-input" value={form.segnalato_da || ''}
                    onChange={e => f('segnalato_da', e.target.value)} placeholder="Anonimo" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSave}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
