import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { formatDate, scadenzaBadge } from '../api.js';

export default function SchedaDipendente() {
  const { id } = useParams();
  const [dati, setDati] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/dipendente/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setDati(d); })
      .catch(() => setError('Errore di rete'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{padding:40,textAlign:'center'}}>Caricamento...</div>;
  if (error) return <div style={{padding:40,textAlign:'center',color:'#dc2626'}}>{error}</div>;
  if (!dati) return null;

  const { lavoratore, azienda, formazione, visite } = dati;
  const iniziali = `${lavoratore.nome?.[0]||''}${lavoratore.cognome?.[0]||''}`.toUpperCase();

  return (
    <div className="scheda-wrap">
      <div className="scheda-card">
        <div className="scheda-header">
          <div className="scheda-avatar">{iniziali}</div>
          <div>
            <div style={{fontSize:20,fontWeight:700}}>{lavoratore.cognome} {lavoratore.nome}</div>
            <div style={{fontSize:14,opacity:0.8,marginTop:3}}>{lavoratore.mansione||'—'}</div>
            <div style={{fontSize:13,opacity:0.7,marginTop:2}}>{lavoratore.reparto||''}</div>
          </div>
        </div>
        <div className="scheda-body">
          <div className="scheda-section">
            <div className="scheda-section-title">Azienda</div>
            <div style={{fontSize:15,fontWeight:600,color:'#0f3460'}}>{azienda.nome}</div>
            {azienda.settore && <div style={{fontSize:13,color:'#6b7280'}}>{azienda.settore}</div>}
          </div>

          <div className="scheda-section">
            <div className="scheda-section-title">Formazione ({formazione.length})</div>
            {formazione.length===0 ? <div style={{color:'#9ca3af',fontSize:14}}>Nessun corso registrato</div> :
              formazione.map((f,i)=>{
                const b = scadenzaBadge(f.scadenza);
                return (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #f1f5f9',flexWrap:'wrap',gap:6}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:500}}>{f.tipo_corso}</div>
                      <div style={{fontSize:12,color:'#6b7280'}}>{f.ente_formatore||''} {f.ore_corso?`· ${f.ore_corso}h`:''}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:12,color:'#6b7280'}}>Scade: {formatDate(f.scadenza)}</div>
                      {f.scadenza && <span className={`badge ${b.cls}`} style={{fontSize:11}}>{b.label}</span>}
                    </div>
                  </div>
                );
              })
            }
          </div>

          <div className="scheda-section">
            <div className="scheda-section-title">Visite mediche ({visite.length})</div>
            {visite.length===0 ? <div style={{color:'#9ca3af',fontSize:14}}>Nessuna visita registrata</div> :
              visite.map((v,i)=>{
                const b = scadenzaBadge(v.scadenza);
                return (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #f1f5f9',flexWrap:'wrap',gap:6}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:500}}>{v.giudizio}</div>
                      <div style={{fontSize:12,color:'#6b7280'}}>{v.medico_competente||''}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:12,color:'#6b7280'}}>Scade: {formatDate(v.scadenza)}</div>
                      <span className={`badge ${b.cls}`} style={{fontSize:11}}>{b.label}</span>
                    </div>
                  </div>
                );
              })
            }
          </div>

          <div style={{textAlign:'center',marginTop:20,fontSize:12,color:'#9ca3af'}}>
            SLV Sicurezza · Salvatore Vitale · Verificato il {new Date().toLocaleDateString('it-IT')}
          </div>
        </div>
      </div>
    </div>
  );
}
