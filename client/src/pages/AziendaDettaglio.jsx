import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, formatDate, scadenzaBadge } from '../api.js';
import { useAuth } from '../App.jsx';

const NOMINE_TIPI = ['RSPP Interno','RSPP Esterno','RLS','Medico Competente','Addetto Antincendio','Addetto Primo Soccorso','ASPP','Preposto','Dirigente'];
const GIUDIZI = ['Idoneo','Idoneo con prescrizioni','Idoneo con limitazioni','Non idoneo temporaneo','Non idoneo'];
const DOC_TIPI = ['DVR','POS','DUVRI','Piano di emergenza','Registro infortuni','Valutazione rischio rumore','Valutazione rischio vibr.','Altro'];

export default function AziendaDettaglio() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [azienda, setAzienda] = useState(null);
  const [tab, setTab] = useState('lavoratori');
  const [data, setData] = useState({});
  const [lavoratori, setLavoratori] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const f = (k,v) => setForm(x=>({...x,[k]:v}));

  useEffect(() => {
    api.getAzienda(id).then(setAzienda).catch(()=>navigate('/aziende'));
    api.getLavoratori(id).then(l=>setLavoratori(l)).catch(()=>{});
    loadTab('lavoratori');
  }, [id]);

  async function loadTab(t) {
    setTab(t);
    if (t === 'lavoratori') { const r=await api.getLavoratori(id); setLavoratori(r); setData(x=>({...x,lavoratori:r})); return; }
    const loaders = { formazione:api.getFormazione, visite:api.getVisite, nomine:api.getNomine, attrezzature:api.getAttrezzature, documenti:api.getDocumenti };
    if (loaders[t]) { const r=await loaders[t](id); setData(x=>({...x,[t]:r})); }
  }

  async function handleSave() {
    try {
      if (tab==='lavoratori') {
        if (form.id) { const r=await api.updateLavoratore(form.id,form); setData(x=>({...x,lavoratori:x.lavoratori.map(l=>l.id===form.id?r:l)})); setLavoratori(l=>l.map(l=>l.id===form.id?r:l)); }
        else { const r=await api.createLavoratore({...form,azienda_id:id}); setData(x=>({...x,lavoratori:[...(x.lavoratori||[]),r]})); setLavoratori(l=>[...l,r]); }
      } else if (tab==='formazione') {
        if (form.id) { const r=await api.updateFormazione(form.id,form); setData(x=>({...x,formazione:x.formazione.map(i=>i.id===form.id?r:i)})); }
        else { const r=await api.createFormazione(form); setData(x=>({...x,formazione:[...(x.formazione||[]),r]})); }
      } else if (tab==='visite') {
        if (form.id) { const r=await api.updateVisita(form.id,form); setData(x=>({...x,visite:x.visite.map(i=>i.id===form.id?r:i)})); }
        else { const r=await api.createVisita(form); setData(x=>({...x,visite:[...(x.visite||[]),r]})); }
      } else if (tab==='nomine') {
        if (form.id) { const r=await api.updateNomina(form.id,form); setData(x=>({...x,nomine:x.nomine.map(i=>i.id===form.id?r:i)})); }
        else { const r=await api.createNomina({...form,azienda_id:id}); setData(x=>({...x,nomine:[...(x.nomine||[]),r]})); }
      } else if (tab==='attrezzature') {
        if (form.id) { const r=await api.updateAttrezzatura(form.id,form); setData(x=>({...x,attrezzature:x.attrezzature.map(i=>i.id===form.id?r:i)})); }
        else { const r=await api.createAttrezzatura({...form,azienda_id:id}); setData(x=>({...x,attrezzature:[...(x.attrezzature||[]),r]})); }
      } else if (tab==='documenti') {
        const r=await api.createDocumento({...form,azienda_id:id});
        setData(x=>({...x,documenti:[...(x.documenti||[]),r]}));
      }
      setModal(null);
    } catch(err) { alert(err.message); }
  }

  async function handleDelete(itemId) {
    if (!confirm('Eliminare questo elemento?')) return;
    const dels = { lavoratori:api.deleteLavoratore, formazione:api.deleteFormazione, visite:api.deleteVisita, nomine:api.deleteNomina, attrezzature:api.deleteAttrezzatura, documenti:api.deleteDocumento };
    try {
      await dels[tab](itemId);
      setData(x=>({...x,[tab]:(x[tab]||[]).filter(i=>i.id!==itemId)}));
      if (tab==='lavoratori') setLavoratori(l=>l.filter(i=>i.id!==itemId));
    } catch(err) { alert(err.message); }
  }

  if (!azienda) return <div className="page">Caricamento...</div>;

  const rows = data[tab] || [];

  return (
    <div className="page">
      <div className="topbar" style={{marginLeft:-24,marginRight:-24,marginTop:-24,marginBottom:24,paddingLeft:24,paddingRight:24}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {isAdmin && <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/aziende')}>← Indietro</button>}
          <span className="topbar-title">{azienda.nome}</span>
          {azienda.settore && <span className="badge badge-gray">{azienda.settore}</span>}
        </div>
        <span style={{fontSize:12,color:'#6b7280'}}>{azienda.referente} · {azienda.telefono||azienda.email||''}</span>
      </div>

      <div className="tabs">
        {[['lavoratori','👷 Lavoratori'],['formazione','📋 Formazione'],['visite','🏥 Visite mediche'],['nomine','📄 Nomine'],['attrezzature','🔧 Attrezzature'],['documenti','🗂 Documenti']].map(([k,l])=>(
          <div key={k} className={`tab${tab===k?' active':''}`} onClick={()=>loadTab(k)}>{l}</div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{textTransform:'capitalize'}}>{tab}</span>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={()=>{
              const defaults = { formazione:{lavoratore_id:''}, visite:{lavoratore_id:'',giudizio:'Idoneo'}, nomine:{tipo:NOMINE_TIPI[0]}, documenti:{tipo:'DVR'} };
              setForm(defaults[tab]||{});
              setModal('add');
            }}>+ Aggiungi</button>
          )}
        </div>

        <div className="table-wrap">
          {tab==='lavoratori' && <TableLavoratori rows={rows} isAdmin={isAdmin} onEdit={r=>{setForm({...r});setModal('add');}} onDelete={handleDelete} />}
          {tab==='formazione' && <TableFormazione rows={rows} isAdmin={isAdmin} onEdit={r=>{setForm({...r});setModal('add');}} onDelete={handleDelete} />}
          {tab==='visite' && <TableVisite rows={rows} isAdmin={isAdmin} onEdit={r=>{setForm({...r});setModal('add');}} onDelete={handleDelete} />}
          {tab==='nomine' && <TableNomine rows={rows} isAdmin={isAdmin} onEdit={r=>{setForm({...r});setModal('add');}} onDelete={handleDelete} />}
          {tab==='attrezzature' && <TableAttrezzature rows={rows} isAdmin={isAdmin} onEdit={r=>{setForm({...r});setModal('add');}} onDelete={handleDelete} />}
          {tab==='documenti' && <TableDocumenti rows={rows} isAdmin={isAdmin} onDelete={handleDelete} />}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{form.id?'Modifica':'Nuovo'} {tab.replace('_',' ')}</h3>
              <button className="modal-close" onClick={()=>setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {tab==='lavoratori' && <FormLavoratore form={form} f={f} />}
              {tab==='formazione' && <FormFormazione form={form} f={f} lavoratori={lavoratori} />}
              {tab==='visite' && <FormVisita form={form} f={f} lavoratori={lavoratori} giudizi={GIUDIZI} />}
              {tab==='nomine' && <FormNomina form={form} f={f} tipi={NOMINE_TIPI} />}
              {tab==='attrezzature' && <FormAttrezzatura form={form} f={f} />}
              {tab==='documenti' && <FormDocumento form={form} f={f} tipi={DOC_TIPI} />}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setModal(null)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSave}>Salva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tabelle ──────────────────────────────────────────────────

function Actions({row, isAdmin, onEdit, onDelete}) {
  if (!isAdmin) return null;
  return (
    <div style={{display:'flex',gap:6}}>
      {onEdit && <button className="btn btn-secondary btn-sm" onClick={()=>onEdit(row)}>Modifica</button>}
      <button className="btn btn-danger btn-sm" onClick={()=>onDelete(row.id)}>Elimina</button>
    </div>
  );
}

function EmptyRow({cols}) {
  return <tr><td colSpan={cols} style={{textAlign:'center',color:'#9ca3af',padding:32}}>Nessun elemento</td></tr>;
}

function Scad({data}) {
  const b = scadenzaBadge(data);
  return <span className={`badge ${b.cls}`}>{formatDate(data)} · {b.label}</span>;
}

function TableLavoratori({rows,isAdmin,onEdit,onDelete}) {
  return <table><thead><tr><th>Cognome e nome</th><th>Mansione</th><th>Reparto</th><th>Assunzione</th><th>Stato</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={6}/>:rows.map(r=><tr key={r.id}>
      <td style={{fontWeight:500}}>{r.cognome} {r.nome}</td>
      <td>{r.mansione||'—'}</td><td>{r.reparto||'—'}</td>
      <td>{formatDate(r.data_assunzione)}</td>
      <td><span className={`badge ${r.attivo?'badge-ok':'badge-gray'}`}>{r.attivo?'Attivo':'Non attivo'}</span></td>
      <td><Actions row={r} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete}/></td>
    </tr>)}</tbody></table>;
}

function TableFormazione({rows,isAdmin,onEdit,onDelete}) {
  return <table><thead><tr><th>Lavoratore</th><th>Corso</th><th>Ente</th><th>Ore</th><th>Completato</th><th>Scadenza</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={7}/>:rows.map(r=><tr key={r.id}>
      <td style={{fontWeight:500}}>{r.cognome} {r.nome}</td>
      <td>{r.tipo_corso}</td><td>{r.ente_formatore||'—'}</td><td>{r.ore_corso||'—'}</td>
      <td>{formatDate(r.data_completamento)}</td>
      <td>{r.scadenza?<Scad data={r.scadenza}/>:'—'}</td>
      <td><Actions row={r} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete}/></td>
    </tr>)}</tbody></table>;
}

function TableVisite({rows,isAdmin,onEdit,onDelete}) {
  return <table><thead><tr><th>Lavoratore</th><th>Medico</th><th>Data visita</th><th>Giudizio</th><th>Scadenza</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={6}/>:rows.map(r=><tr key={r.id}>
      <td style={{fontWeight:500}}>{r.cognome} {r.nome}</td>
      <td>{r.medico_competente||'—'}</td>
      <td>{formatDate(r.data_visita)}</td>
      <td><span className="badge badge-info">{r.giudizio}</span></td>
      <td><Scad data={r.scadenza}/></td>
      <td><Actions row={r} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete}/></td>
    </tr>)}</tbody></table>;
}

function TableNomine({rows,isAdmin,onEdit,onDelete}) {
  return <table><thead><tr><th>Tipo nomina</th><th>Nominato</th><th>Data nomina</th><th>Scadenza</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={5}/>:rows.map(r=><tr key={r.id}>
      <td><span className="badge badge-info">{r.tipo}</span></td>
      <td style={{fontWeight:500}}>{r.nominato}</td>
      <td>{formatDate(r.data_nomina)}</td>
      <td>{r.scadenza?<Scad data={r.scadenza}/>:'Senza scadenza'}</td>
      <td><Actions row={r} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete}/></td>
    </tr>)}</tbody></table>;
}

function TableAttrezzature({rows,isAdmin,onEdit,onDelete}) {
  return <table><thead><tr><th>Attrezzatura</th><th>Marca/modello</th><th>Matricola</th><th>Ultima verifica</th><th>Prossima verifica</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={6}/>:rows.map(r=><tr key={r.id}>
      <td style={{fontWeight:500}}>{r.nome}</td>
      <td>{r.marca_modello||'—'}</td><td>{r.matricola||'—'}</td>
      <td>{formatDate(r.ultima_verifica)}</td>
      <td>{r.prossima_verifica?<Scad data={r.prossima_verifica}/>:'—'}</td>
      <td><Actions row={r} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete}/></td>
    </tr>)}</tbody></table>;
}

function TableDocumenti({rows,isAdmin,onDelete}) {
  return <table><thead><tr><th>Documento</th><th>Tipo</th><th>Caricato il</th><th>Scadenza</th><th>Link</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={6}/>:rows.map(r=><tr key={r.id}>
      <td style={{fontWeight:500}}>{r.nome}</td>
      <td><span className="badge badge-gray">{r.tipo}</span></td>
      <td>{formatDate(r.data_upload)}</td>
      <td>{r.scadenza?<Scad data={r.scadenza}/>:'—'}</td>
      <td>{r.url?<a href={r.url} target="_blank" rel="noreferrer" style={{color:'#0f3460',fontSize:12}}>Apri →</a>:'—'}</td>
      <td>{isAdmin&&<button className="btn btn-danger btn-sm" onClick={()=>onDelete(r.id)}>Elimina</button>}</td>
    </tr>)}</tbody></table>;
}

// ─── Form ─────────────────────────────────────────────────────

function FormLavoratore({form,f}) {
  return <>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" value={form.nome||''} onChange={e=>f('nome',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Cognome *</label><input className="form-input" value={form.cognome||''} onChange={e=>f('cognome',e.target.value)}/></div>
    </div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Mansione</label><input className="form-input" value={form.mansione||''} onChange={e=>f('mansione',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Reparto</label><input className="form-input" value={form.reparto||''} onChange={e=>f('reparto',e.target.value)}/></div>
    </div>
    <div className="form-group"><label className="form-label">Data assunzione</label><input className="form-input" type="date" value={form.data_assunzione?.split('T')[0]||''} onChange={e=>f('data_assunzione',e.target.value)}/></div>
    <div className="form-group"><label className="form-label">Stato</label>
      <select className="form-input" value={form.attivo===false?'false':'true'} onChange={e=>f('attivo',e.target.value==='true')}>
        <option value="true">Attivo</option><option value="false">Non attivo</option>
      </select>
    </div>
  </>;
}

function FormFormazione({form,f,lavoratori}) {
  return <>
    <div className="form-group"><label className="form-label">Lavoratore *</label>
      <select className="form-input" value={form.lavoratore_id||''} onChange={e=>f('lavoratore_id',e.target.value)}>
        <option value="">Seleziona...</option>
        {lavoratori.filter(l=>l.attivo).map(l=><option key={l.id} value={l.id}>{l.cognome} {l.nome}</option>)}
      </select>
    </div>
    <div className="form-group"><label className="form-label">Tipo corso *</label><input className="form-input" value={form.tipo_corso||''} onChange={e=>f('tipo_corso',e.target.value)} placeholder="es. Formazione generale D.Lgs.81/08"/></div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Ente formatore</label><input className="form-input" value={form.ente_formatore||''} onChange={e=>f('ente_formatore',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Ore corso</label><input className="form-input" type="number" value={form.ore_corso||''} onChange={e=>f('ore_corso',e.target.value)}/></div>
    </div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Data completamento</label><input className="form-input" type="date" value={form.data_completamento?.split('T')[0]||''} onChange={e=>f('data_completamento',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Scadenza</label><input className="form-input" type="date" value={form.scadenza?.split('T')[0]||''} onChange={e=>f('scadenza',e.target.value)}/></div>
    </div>
    <div className="form-group"><label className="form-label">Note</label><textarea className="form-input" rows="2" value={form.note||''} onChange={e=>f('note',e.target.value)}/></div>
  </>;
}

function FormVisita({form,f,lavoratori,giudizi}) {
  return <>
    <div className="form-group"><label className="form-label">Lavoratore *</label>
      <select className="form-input" value={form.lavoratore_id||''} onChange={e=>f('lavoratore_id',e.target.value)}>
        <option value="">Seleziona...</option>
        {lavoratori.filter(l=>l.attivo).map(l=><option key={l.id} value={l.id}>{l.cognome} {l.nome}</option>)}
      </select>
    </div>
    <div className="form-group"><label className="form-label">Medico competente</label><input className="form-input" value={form.medico_competente||''} onChange={e=>f('medico_competente',e.target.value)}/></div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Data visita *</label><input className="form-input" type="date" value={form.data_visita?.split('T')[0]||''} onChange={e=>f('data_visita',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Scadenza *</label><input className="form-input" type="date" value={form.scadenza?.split('T')[0]||''} onChange={e=>f('scadenza',e.target.value)}/></div>
    </div>
    <div className="form-group"><label className="form-label">Giudizio</label>
      <select className="form-input" value={form.giudizio||'Idoneo'} onChange={e=>f('giudizio',e.target.value)}>
        {giudizi.map(g=><option key={g} value={g}>{g}</option>)}
      </select>
    </div>
    <div className="form-group"><label className="form-label">Note</label><textarea className="form-input" rows="2" value={form.note||''} onChange={e=>f('note',e.target.value)}/></div>
  </>;
}

function FormNomina({form,f,tipi}) {
  return <>
    <div className="form-group"><label className="form-label">Tipo nomina *</label>
      <select className="form-input" value={form.tipo||''} onChange={e=>f('tipo',e.target.value)}>
        {tipi.map(t=><option key={t} value={t}>{t}</option>)}
      </select>
    </div>
    <div className="form-group"><label className="form-label">Nominato *</label><input className="form-input" value={form.nominato||''} onChange={e=>f('nominato',e.target.value)} placeholder="Nome e cognome o ragione sociale"/></div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Data nomina *</label><input className="form-input" type="date" value={form.data_nomina?.split('T')[0]||''} onChange={e=>f('data_nomina',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Scadenza (opz.)</label><input className="form-input" type="date" value={form.scadenza?.split('T')[0]||''} onChange={e=>f('scadenza',e.target.value)}/></div>
    </div>
    <div className="form-group"><label className="form-label">Note</label><textarea className="form-input" rows="2" value={form.note||''} onChange={e=>f('note',e.target.value)}/></div>
  </>;
}

function FormAttrezzatura({form,f}) {
  return <>
    <div className="form-group"><label className="form-label">Nome attrezzatura *</label><input className="form-input" value={form.nome||''} onChange={e=>f('nome',e.target.value)}/></div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Marca/modello</label><input className="form-input" value={form.marca_modello||''} onChange={e=>f('marca_modello',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Matricola/n. serie</label><input className="form-input" value={form.matricola||''} onChange={e=>f('matricola',e.target.value)}/></div>
    </div>
    <div className="form-group"><label className="form-label">Tipo verifica</label><input className="form-input" value={form.tipo_verifica||''} onChange={e=>f('tipo_verifica',e.target.value)} placeholder="es. Verifica INAIL, Manutenzione periodica"/></div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Ultima verifica</label><input className="form-input" type="date" value={form.ultima_verifica?.split('T')[0]||''} onChange={e=>f('ultima_verifica',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Prossima verifica</label><input className="form-input" type="date" value={form.prossima_verifica?.split('T')[0]||''} onChange={e=>f('prossima_verifica',e.target.value)}/></div>
    </div>
    <div className="form-group"><label className="form-label">Note</label><textarea className="form-input" rows="2" value={form.note||''} onChange={e=>f('note',e.target.value)}/></div>
  </>;
}

function FormDocumento({form,f,tipi}) {
  return <>
    <div className="form-group"><label className="form-label">Nome documento *</label><input className="form-input" value={form.nome||''} onChange={e=>f('nome',e.target.value)} placeholder="es. DVR 2024"/></div>
    <div className="form-group"><label className="form-label">Tipo</label>
      <select className="form-input" value={form.tipo||'Altro'} onChange={e=>f('tipo',e.target.value)}>
        {tipi.map(t=><option key={t} value={t}>{t}</option>)}
      </select>
    </div>
    <div className="form-group"><label className="form-label">URL / link documento (opz.)</label><input className="form-input" type="url" value={form.url||''} onChange={e=>f('url',e.target.value)} placeholder="https://drive.google.com/..."/></div>
    <div className="form-group"><label className="form-label">Scadenza (opz.)</label><input className="form-input" type="date" value={form.scadenza?.split('T')[0]||''} onChange={e=>f('scadenza',e.target.value)}/></div>
    <div className="form-group"><label className="form-label">Note</label><textarea className="form-input" rows="2" value={form.note||''} onChange={e=>f('note',e.target.value)}/></div>
  </>;
}
