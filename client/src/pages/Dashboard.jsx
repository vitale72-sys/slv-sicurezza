import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, formatDate } from '../api.js';
import { useAuth } from '../App.jsx';

const tipoLabel = { formazione:'Formazione', visita_medica:'Visita medica', nomina:'Nomina', attrezzatura:'Attrezzatura', documento:'Documento' };
const tipoColor = { formazione:'#3b82f6', visita_medica:'#8b5cf6', nomina:'#f59e0b', attrezzatura:'#10b981', documento:'#6b7280' };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [riepilogo, setRiepilogo] = useState([]);
  const [scadenze, setScadenze] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('scadute');

  useEffect(() => {
    if (user?.role === 'admin') {
      Promise.all([api.getDashboardRiepilogo(), api.getDashboardScadenze(90)])
        .then(([r, s]) => { setRiepilogo(r); setScadenze(s); })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      // cliente: redirect diretto alla sua azienda
      if (user?.azienda_id) navigate(`/aziende/${user.azienda_id}`);
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="page">Caricamento...</div>;
  if (!scadenze) return null;

  const totScadute = riepilogo.reduce((s,a)=>s + parseInt(a.formazione_scadute||0) + parseInt(a.visite_scadute||0) + parseInt(a.nomine_scadute||0) + parseInt(a.attrezzature_scadute||0),0);
  const totAziende = riepilogo.length;
  const totLavoratori = riepilogo.reduce((s,a)=>s+parseInt(a.lavoratori_attivi||0),0);

  const lista = tab === 'scadute' ? scadenze.scadute : tab === 'presto' ? scadenze.in_scadenza : scadenze.future;

  return (
    <div className="page">
      <div className="topbar" style={{marginLeft:-24,marginRight:-24,marginTop:-24,marginBottom:24,paddingLeft:24,paddingRight:24}}>
        <span className="topbar-title">Cruscotto generale</span>
              </div>

      <div className="kpi-grid">
        <div className="kpi info">
          <div className="kpi-label">Aziende clienti</div>
          <div className="kpi-value">{totAziende}</div>
        </div>
        <div className="kpi info">
          <div className="kpi-label">Lavoratori attivi</div>
          <div className="kpi-value">{totLavoratori}</div>
        </div>
        <div className={`kpi ${totScadute>0?'danger':'ok'}`}>
          <div className="kpi-label">Scadenze scadute</div>
          <div className="kpi-value">{totScadute}</div>
        </div>
        <div className={`kpi ${scadenze.in_scadenza.length>0?'warning':'ok'}`}>
          <div className="kpi-label">In scadenza (30gg)</div>
          <div className="kpi-value">{scadenze.in_scadenza.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Scadenzario globale</span>
        </div>
        <div className="tabs">
          <div className={`tab${tab==='scadute'?' active':''}`} onClick={()=>setTab('scadute')}>
            Scadute ({scadenze.scadute.length})
          </div>
          <div className={`tab${tab==='presto'?' active':''}`} onClick={()=>setTab('presto')}>
            Entro 30 giorni ({scadenze.in_scadenza.length})
          </div>
          <div className={`tab${tab==='future'?' active':''}`} onClick={()=>setTab('future')}>
            Entro 90 giorni ({scadenze.future.length})
          </div>
        </div>
        {lista.length === 0 ? (
          <div className="empty">Nessuna scadenza in questa categoria</div>
        ) : lista.map((s,i) => (
          <div key={i} className={`scad-row ${tab==='scadute'?'scaduta':tab==='presto'?'presto':'ok'}`}
            style={{cursor:'pointer'}} onClick={()=>navigate(`/aziende/${s.azienda_id}`)}>
            <span className="scad-tipo" style={{color:tipoColor[s.tipo]||'#6b7280'}}>
              {tipoLabel[s.tipo]||s.tipo}
            </span>
            <span className="scad-desc">
              <strong>{s.azienda_nome}</strong> — {s.soggetto}: {s.descrizione}
            </span>
            <span className="scad-date">{formatDate(s.scadenza)}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Riepilogo per azienda</span>
          <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/aziende')}>Vedi tutte</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Azienda</th><th>Settore</th><th>Lavoratori</th>
              <th>Form. scadute</th><th>Visite scadute</th><th>Nomine scadute</th><th>Attr. scadute</th>
            </tr></thead>
            <tbody>
              {riepilogo.map(a=>(
                <tr key={a.id} style={{cursor:'pointer'}} onClick={()=>navigate(`/aziende/${a.id}`)}>
                  <td style={{fontWeight:500}}>{a.nome}</td>
                  <td>{a.settore||'—'}</td>
                  <td>{a.lavoratori_attivi}</td>
                  <td>{parseInt(a.formazione_scadute)>0?<span className="badge badge-danger">{a.formazione_scadute}</span>:<span className="badge badge-ok">0</span>}</td>
                  <td>{parseInt(a.visite_scadute)>0?<span className="badge badge-danger">{a.visite_scadute}</span>:<span className="badge badge-ok">0</span>}</td>
                  <td>{parseInt(a.nomine_scadute)>0?<span className="badge badge-danger">{a.nomine_scadute}</span>:<span className="badge badge-ok">0</span>}</td>
                  <td>{parseInt(a.attrezzature_scadute)>0?<span className="badge badge-danger">{a.attrezzature_scadute}</span>:<span className="badge badge-ok">0</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
