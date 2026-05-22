import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const GIORNI = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
const tipoLabel = { formazione:'Form.', visita_medica:'Visita', nomina:'Nomina', attrezzatura:'Attrez.', documento:'Doc.' };
const tipoColor = { formazione:'#3b82f6', visita_medica:'#8b5cf6', nomina:'#f59e0b', attrezzatura:'#10b981', documento:'#6b7280' };

function scadenzaClass(dataStr) {
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  const d = new Date(dataStr); d.setHours(0,0,0,0);
  const diff = (d - oggi) / 86400000;
  if (diff < 0) return 'scaduta';
  if (diff <= 30) return 'presto';
  return 'ok';
}

export default function Calendario() {
  const navigate = useNavigate();
  const today = new Date();
  const [anno, setAnno] = useState(today.getFullYear());
  const [mese, setMese] = useState(today.getMonth());
  const [eventi, setEventi] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardScadenze(365).then(s => {
      const tutto = [...s.scadute, ...s.in_scadenza, ...s.future];
      setEventi(tutto);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  function prevMese() {
    if (mese === 0) { setMese(11); setAnno(a => a-1); }
    else setMese(m => m-1);
  }
  function nextMese() {
    if (mese === 11) { setMese(0); setAnno(a => a+1); }
    else setMese(m => m+1);
  }

  // Costruisci griglia del mese
  const primoGiorno = new Date(anno, mese, 1);
  const ultimoGiorno = new Date(anno, mese+1, 0);
  // Lunedì = 0
  let startDow = primoGiorno.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const giorni = [];
  // Giorni mese precedente
  for (let i = startDow-1; i >= 0; i--) {
    const d = new Date(anno, mese, -i);
    giorni.push({ data: d, corrente: false });
  }
  // Giorni mese corrente
  for (let i = 1; i <= ultimoGiorno.getDate(); i++) {
    giorni.push({ data: new Date(anno, mese, i), corrente: true });
  }
  // Giorni mese successivo
  const resto = 42 - giorni.length;
  for (let i = 1; i <= resto; i++) {
    giorni.push({ data: new Date(anno, mese+1, i), corrente: false });
  }

  function eventiDelGiorno(data) {
    return eventi.filter(e => {
      if (!e.scadenza) return false;
      const d = new Date(e.scadenza);
      return d.getFullYear()===data.getFullYear() && d.getMonth()===data.getMonth() && d.getDate()===data.getDate();
    });
  }

  const isToday = (d) => {
    const t = new Date();
    return d.getDate()===t.getDate() && d.getMonth()===t.getMonth() && d.getFullYear()===t.getFullYear();
  };

  // Scadenze del mese selezionato per lista laterale
  const scadenzeDelMese = eventi.filter(e => {
    if (!e.scadenza) return false;
    const d = new Date(e.scadenza);
    return d.getMonth()===mese && d.getFullYear()===anno;
  }).sort((a,b) => new Date(a.scadenza)-new Date(b.scadenza));

  if (loading) return <div className="page">Caricamento...</div>;

  return (
    <div className="page">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <span style={{fontSize:18,fontWeight:700}}>Calendario scadenze</span>
        <div className="cal-nav">
          <button onClick={prevMese}>‹</button>
          <span className="cal-month">{MESI[mese]} {anno}</span>
          <button onClick={nextMese}>›</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:16,alignItems:'start'}}>
        {/* Calendario */}
        <div className="card" style={{padding:12}}>
          <div className="cal-grid" style={{marginBottom:4}}>
            {GIORNI.map(g=><div key={g} className="cal-header">{g}</div>)}
          </div>
          <div className="cal-grid">
            {giorni.map((g,i) => {
              const ev = eventiDelGiorno(g.data);
              return (
                <div key={i} className={`cal-day${!g.corrente?' other-month':''}${isToday(g.data)?' today':''}`}>
                  <div className="cal-day-num" style={{color:g.corrente?'#374151':'#d1d5db'}}>{g.data.getDate()}</div>
                  {ev.slice(0,3).map((e,j)=>(
                    <div key={j} className={`cal-event ${scadenzaClass(e.scadenza)}`}
                      title={`${e.azienda_nome} - ${e.descrizione}`}
                      onClick={()=>setSelected(e)}>
                      {tipoLabel[e.tipo]||e.tipo}: {e.azienda_nome}
                    </div>
                  ))}
                  {ev.length>3 && <div style={{fontSize:10,color:'#6b7280'}}>+{ev.length-3} altri</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista scadenze del mese */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Scadenze {MESI[mese]}</span>
              <span className="badge badge-gray">{scadenzeDelMese.length}</span>
            </div>
            {scadenzeDelMese.length===0 ? (
              <div className="empty" style={{padding:'20px 0'}}>Nessuna scadenza</div>
            ) : scadenzeDelMese.map((e,i)=>(
              <div key={i} style={{padding:'8px 0',borderBottom:'1px solid #f1f5f9',cursor:'pointer'}}
                onClick={()=>navigate(`/aziende/${e.azienda_id}`)}>
                <div style={{fontSize:12,color:tipoColor[e.tipo]||'#6b7280',fontWeight:600}}>{tipoLabel[e.tipo]} · {e.azienda_nome}</div>
                <div style={{fontSize:13,color:'#374151',marginTop:2}}>{e.descrizione}</div>
                <div style={{fontSize:12,color:'#6b7280',marginTop:1}}>{e.soggetto} · {new Date(e.scadenza).toLocaleDateString('it-IT')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal dettaglio evento */}
      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dettaglio scadenza</h3>
              <button className="modal-close" onClick={()=>setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gap:10}}>
                <div><span style={{color:'#6b7280',fontSize:13}}>Tipo:</span> <span className="badge badge-info">{tipoLabel[selected.tipo]||selected.tipo}</span></div>
                <div><span style={{color:'#6b7280',fontSize:13}}>Azienda:</span> <strong> {selected.azienda_nome}</strong></div>
                <div><span style={{color:'#6b7280',fontSize:13}}>Elemento:</span> <strong> {selected.descrizione}</strong></div>
                <div><span style={{color:'#6b7280',fontSize:13}}>Soggetto:</span> <strong> {selected.soggetto}</strong></div>
                <div><span style={{color:'#6b7280',fontSize:13}}>Scadenza:</span> <strong> {new Date(selected.scadenza).toLocaleDateString('it-IT')}</strong></div>
                <div><span className={`badge ${scadenzaClass(selected.scadenza)==='scaduta'?'badge-danger':scadenzaClass(selected.scadenza)==='presto'?'badge-warning':'badge-ok'}`}>
                  {scadenzaClass(selected.scadenza)==='scaduta'?'Scaduta':scadenzaClass(selected.scadenza)==='presto'?'In scadenza':'Valida'}
                </span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setSelected(null)}>Chiudi</button>
              <button className="btn btn-primary" onClick={()=>{setSelected(null);navigate(`/aziende/${selected.azienda_id}`);}}>Vai all'azienda →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
