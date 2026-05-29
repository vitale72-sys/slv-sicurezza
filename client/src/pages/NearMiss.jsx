import { useState, useEffect } from 'react';
import { formatDate } from '../api.js';
import { t } from '../i18n/traduzioni.js';

const GRAVITA_COLORI = { bassa: 'badge-ok', media: 'badge-warning', alta: 'badge-danger' };
const STATO_COLORI = { aperto: 'badge-danger', in_corso: 'badge-warning', chiuso: 'badge-ok' };

export default function NearMiss({ aziendaId, canEdit, lingua = 'it' }) {
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
    if (!form.descrizione) return alert(t(lingua, 'nm_descrizione') + ' richiesta');
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
    if (!confirm(t(lingua, 'conferma_elimina'))) return;
    const token = localStorage.getItem('slv_token');
    await fetch(`/api/nearmiss/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setLista(l => l.filter(i => i.id !== id));
  }

  if (loading) return <div style={{padding:20,color:'#6b7280'}}>{t(lingua, 'caricamento')}</div>;

  return (
    <div>
      <div className="card-header">
        <span className="card-title">⚠️ Near Miss</span>
        {canEdit && (
          <button className="btn btn-primary btn-sm" onClick={() => { setForm({ gravita: 'bassa', stato: 'aperto' }); setModal(true); }}>
            {t(lingua, 'aggiungi')}
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
              <th>{t(lingua, 'nm_luogo')}</th>
              <th>{t(lingua, 'nm_descrizione').replace(' *','')}</th>
              <th>{t(lingua, 'nm_gravita')}</th>
              <th>{t(lingua, 'nm_stato')}</th>
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
                      {t(lingua, `nm_${r.gravita}`)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${STATO_COLORI[r.stato]}`}>
                      {t(lingua, `nm_${r.stato}`)}
                    </span>
                  </td>
                  <td>
                    {canEdit && (
                      <div style={{display:'flex',gap:5}}>
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => { setForm({...r}); setModal(true); }}>
                          {t(lingua, 'modifica')}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>
                          {t(lingua, 'elimina')}
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
              <h3>{t(lingua, 'nm_titolo')}</h3>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t(lingua, 'nm_luogo')}</label>
                  <input className="form-input" value={form.luogo || ''} onChange={e => f('luogo', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t(lingua, 'nm_reparto')}</label>
                  <input className="form-input" value={form.reparto || ''} onChange={e => f('reparto', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t(lingua, 'nm_descrizione')}</label>
                <textarea className="form-input" rows="3" value={form.descrizione || ''}
                  onChange={e => f('descrizione', e.target.value)}
                  placeholder="Descrivi cosa è accaduto..." />
              </div>
              <div className="form-group">
                <label className="form-label">{t(lingua, 'nm_causa')}</label>
                <textarea className="form-input" rows="2" value={form.causa_probabile || ''}
                  onChange={e => f('causa_probabile', e.target.value)} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t(lingua, 'nm_gravita')}</label>
                  <select className="form-input" value={form.gravita || 'bassa'} onChange={e => f('gravita', e.target.value)}>
                    <option value="bassa">{t(lingua, 'nm_bassa')}</option>
                    <option value="media">{t(lingua, 'nm_media')}</option>
                    <option value="alta">{t(lingua, 'nm_alta')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t(lingua, 'nm_persone')}</label>
                  <input className="form-input" type="number" value={form.persone_coinvolte || 0}
                    onChange={e => f('persone_coinvolte', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t(lingua, 'nm_azione')}</label>
                <textarea className="form-input" rows="2" value={form.azione_correttiva || ''}
                  onChange={e => f('azione_correttiva', e.target.value)} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t(lingua, 'nm_stato')}</label>
                  <select className="form-input" value={form.stato || 'aperto'} onChange={e => f('stato', e.target.value)}>
                    <option value="aperto">{t(lingua, 'nm_aperto')}</option>
                    <option value="in_corso">{t(lingua, 'nm_in_corso')}</option>
                    <option value="chiuso">{t(lingua, 'nm_chiuso')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t(lingua, 'nm_segnalato')}</label>
                  <input className="form-input" value={form.segnalato_da || ''}
                    onChange={e => f('segnalato_da', e.target.value)} placeholder="Anonimo" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>{t(lingua, 'annulla')}</button>
              <button className="btn btn-primary" onClick={handleSave}>{t(lingua, 'salva')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
