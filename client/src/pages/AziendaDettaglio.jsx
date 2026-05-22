import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, formatDate, scadenzaBadge } from '../api.js';
import { useAuth } from '../App.jsx';

const NOMINE_TIPI = ['RSPP Interno','RSPP Esterno','RLS','Medico Competente','Addetto Antincendio','Addetto Primo Soccorso','ASPP','Preposto','Dirigente'];
const GIUDIZI = ['Idoneo','Idoneo con prescrizioni','Idoneo con limitazioni','Non idoneo temporaneo','Non idoneo'];
const DOC_TIPI = ['DVR','POS','DUVRI','Piano di emergenza','Registro infortuni','Valutazione rischio rumore','Valutazione rischio vibr.','Altro'];
const RUOLI_SICUREZZA = ['Preposto','Addetto Primo Soccorso','Addetto Antincendio (Rischio Basso)','Addetto Antincendio (Rischio Medio)','Addetto Antincendio (Rischio Alto)','ASPP','RLS','Dirigente sicurezza'];

export default function AziendaDettaglio() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || user?.can_edit;

  const [azienda, setAzienda] = useState(null);
  const [tab, setTab] = useState('lavoratori');
  const [data, setData] = useState({});
  const [lavoratori, setLavoratori] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [badgeLav, setBadgeLav] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [fotoUrl, setFotoUrl] = useState(null);
  const f = (k,v) => setForm(x=>({...x,[k]:v}));

  async function openBadge(lav) {
    const url = `${window.location.origin}/dipendente/${lav.id}`;
    try {
      const QRCode = (await import('qrcode')).default;
      const qr = await QRCode.toDataURL(url, { width: 160, margin: 1 });
      setQrDataUrl(qr);
      setFotoUrl(null);
      setBadgeLav({ ...lav, url });
    } catch(e) { alert('Errore QR: ' + e.message); }
  }

  function handleFotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setFotoUrl(ev.target.result);
    reader.readAsDataURL(file);
  }

  function downloadBadgePDF() {
    const W = 969, H = 612;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Sfondo bianco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Bordo
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, W-4, H-4);

    // Banda sinistra blu
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, 260, H);

    // Foto o iniziali
    if (fotoUrl) {
      const img = new Image();
      img.src = fotoUrl;
      ctx.save();
      ctx.beginPath();
      ctx.arc(130, 160, 90, 0, Math.PI*2);
      ctx.clip();
      ctx.drawImage(img, 40, 70, 180, 180);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(130, 160, 90, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center';
      const iniziali = `${badgeLav.nome?.[0]||''}${badgeLav.cognome?.[0]||''}`.toUpperCase();
      ctx.fillText(iniziali, 130, 185);
    }

    // Nome azienda
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    const nomeAz = azienda?.nome || '';
    ctx.fillText(nomeAz.length > 20 ? nomeAz.slice(0,18)+'...' : nomeAz, 130, 300);

    // P.IVA
    if (azienda?.piva) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '14px Arial';
      ctx.fillText(`P.IVA: ${azienda.piva}`, 130, 325);
    }

    // Settore
    if (azienda?.settore) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '13px Arial';
      ctx.fillText(azienda.settore, 130, 348);
    }

    // Indirizzo
    if (azienda?.indirizzo) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '12px Arial';
      const ind = azienda.indirizzo.length > 26 ? azienda.indirizzo.slice(0,24)+'...' : azienda.indirizzo;
      ctx.fillText(ind, 130, 368);
    }

    // ─── Contenuto principale (parte destra) ───
    const X = 285;

    // Nome e cognome
    ctx.fillStyle = '#0f3460';
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'left';
    const nomeCompleto = `${badgeLav.cognome.toUpperCase()} ${badgeLav.nome}`;
    ctx.fillText(nomeCompleto.length > 28 ? nomeCompleto.slice(0,26)+'...' : nomeCompleto, X, 65);

    // Linea
    ctx.strokeStyle = '#e8ecf4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X, 80);
    ctx.lineTo(W-20, 80);
    ctx.stroke();

    // Mansione
    ctx.fillStyle = '#374151';
    ctx.font = '22px Arial';
    ctx.fillText(badgeLav.mansione || '', X, 115);

    // Data assunzione
    if (badgeLav.data_assunzione) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '17px Arial';
      ctx.fillText(`Assunto il: ${new Date(badgeLav.data_assunzione).toLocaleDateString('it-IT')}`, X, 148);
    }

    // Codice fiscale
    if (badgeLav.codice_fiscale) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '15px Arial';
      ctx.fillText(`C.F.: ${badgeLav.codice_fiscale}`, X, 175);
    }

    // Ruoli sicurezza
    if (badgeLav.ruoli_sicurezza?.length > 0) {
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('Ruoli:', X, 210);
      let rx = X + 52;
      badgeLav.ruoli_sicurezza.slice(0,3).forEach(r => {
        const rShort = r.replace('Addetto ','').replace('(Rischio ','(');
        ctx.font = '12px Arial';
        const w = ctx.measureText(rShort).width + 16;
        ctx.fillStyle = '#dbeafe';
        ctx.beginPath();
        ctx.roundRect(rx, 196, w, 22, 4);
        ctx.fill();
        ctx.fillStyle = '#1e40af';
        ctx.fillText(rShort, rx+8, 211);
        rx += w + 8;
      });
    }

    // Separatore
    ctx.strokeStyle = '#e8ecf4';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X, 248);
    ctx.lineTo(W-20, 248);
    ctx.stroke();

    // QR code
    const renderFinal = () => {
      if (qrDataUrl) {
        const qrImg = new Image();
        qrImg.onload = () => {
          ctx.drawImage(qrImg, X, 262, 155, 155);
          ctx.fillStyle = '#374151';
          ctx.font = 'bold 14px Arial';
          ctx.fillText('Verifica attestati e visite:', X+170, 300);
          ctx.fillStyle = '#6b7280';
          ctx.font = '13px Arial';
          ctx.fillText('Scansiona il QR code', X+170, 325);
          ctx.fillText('con il tuo smartphone', X+170, 345);
          savePDF(canvas, W, H);
        };
        qrImg.src = qrDataUrl;
      } else {
        savePDF(canvas, W, H);
      }
    };
    renderFinal();
  }

  function savePDF(canvas, W, H) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] });
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 0, 0, 85.6, 54);
      doc.save(`badge_${badgeLav.cognome}_${badgeLav.nome}.pdf`);
    };
    script.onerror = () => {
      const link = document.createElement('a');
      link.download = `badge_${badgeLav.cognome}_${badgeLav.nome}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    document.head.appendChild(script);
  }

  useEffect(() => {
    api.getAzienda(id).then(setAzienda).catch(()=>navigate('/aziende'));
    api.getLavoratori(id).then(l=>{ setLavoratori(l); setData(x=>({...x,lavoratori:l})); }).catch(()=>{});
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
        const payload = { ...form, azienda_id: id };
        if (form.id) { const r=await api.updateLavoratore(form.id,payload); setData(x=>({...x,lavoratori:x.lavoratori.map(l=>l.id===form.id?r:l)})); setLavoratori(l=>l.map(x=>x.id===form.id?r:x)); }
        else { const r=await api.createLavoratore(payload); setData(x=>({...x,lavoratori:[...(x.lavoratori||[]),r]})); setLavoratori(l=>[...l,r]); }
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
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {isAdmin && <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/aziende')}>← Indietro</button>}
          <span style={{fontSize:18,fontWeight:700}}>{azienda.nome}</span>
          {azienda.settore && <span className="badge badge-gray">{azienda.settore}</span>}
        </div>
        <span style={{fontSize:13,color:'#6b7280'}}>{azienda.referente} {azienda.telefono?'· '+azienda.telefono:''}</span>
      </div>

      <div className="tabs">
        {[['lavoratori','👷 Lavoratori'],['formazione','📋 Formazione'],['visite','🏥 Visite mediche'],['nomine','📄 Nomine'],['attrezzature','🔧 Attrezzature'],['documenti','🗂 Documenti']].map(([k,l])=>(
          <div key={k} className={`tab${tab===k?' active':''}`} onClick={()=>loadTab(k)}>{l}</div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title" style={{textTransform:'capitalize'}}>{tab}</span>
          {canEdit && (
            <button className="btn btn-primary btn-sm" onClick={()=>{
              const defaults = { formazione:{lavoratore_id:''}, visite:{lavoratore_id:'',giudizio:'Idoneo'}, nomine:{tipo:NOMINE_TIPI[0]}, documenti:{tipo:'DVR'} };
              setForm(defaults[tab]||{});
              setModal('add');
            }}>+ Aggiungi</button>
          )}
        </div>
        <div className="table-wrap">
          {tab==='lavoratori' && <TableLavoratori rows={rows} canEdit={canEdit} onEdit={r=>{setForm({...r,ruoli_sicurezza:r.ruoli_sicurezza||[]});setModal('add');}} onDelete={handleDelete} onBadge={openBadge}/>}
          {tab==='formazione' && <TableFormazione rows={rows} canEdit={canEdit} onEdit={r=>{setForm({...r});setModal('add');}} onDelete={handleDelete}/>}
          {tab==='visite' && <TableVisite rows={rows} canEdit={canEdit} onEdit={r=>{setForm({...r});setModal('add');}} onDelete={handleDelete}/>}
          {tab==='nomine' && <TableNomine rows={rows} canEdit={canEdit} onEdit={r=>{setForm({...r});setModal('add');}} onDelete={handleDelete}/>}
          {tab==='attrezzature' && <TableAttrezzature rows={rows} canEdit={canEdit} onEdit={r=>{setForm({...r});setModal('add');}} onDelete={handleDelete}/>}
          {tab==='documenti' && <TableDocumenti rows={rows} canEdit={canEdit} onDelete={handleDelete}/>}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{form.id?'Modifica':'Nuovo'} {tab}</h3>
              <button className="modal-close" onClick={()=>setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {tab==='lavoratori' && <FormLavoratore form={form} f={f} ruoliList={RUOLI_SICUREZZA}/>}
              {tab==='formazione' && <FormFormazione form={form} f={f} lavoratori={lavoratori}/>}
              {tab==='visite' && <FormVisita form={form} f={f} lavoratori={lavoratori} giudizi={GIUDIZI}/>}
              {tab==='nomine' && <FormNomina form={form} f={f} tipi={NOMINE_TIPI}/>}
              {tab==='attrezzature' && <FormAttrezzatura form={form} f={f}/>}
              {tab==='documenti' && <FormDocumento form={form} f={f} tipi={DOC_TIPI}/>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setModal(null)}>Annulla</button>
              <button className="btn btn-primary" onClick={handleSave}>Salva</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Badge QR */}
      {badgeLav && (
        <div className="modal-overlay" onClick={()=>setBadgeLav(null)}>
          <div className="modal" style={{maxWidth:680}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Badge — {badgeLav.cognome} {badgeLav.nome}</h3>
              <button className="modal-close" onClick={()=>setBadgeLav(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* Anteprima badge orizzontale */}
              <div style={{width:'100%',maxWidth:500,margin:'0 auto',background:'#fff',border:'3px solid #0f3460',borderRadius:12,display:'flex',overflow:'hidden',minHeight:160}}>
                {/* Colonna sinistra */}
                <div style={{width:150,background:'#0f3460',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'14px 8px',gap:6,flexShrink:0}}>
                  {fotoUrl ? (
                    <img src={fotoUrl} alt="foto" style={{width:76,height:76,borderRadius:'50%',objectFit:'cover',border:'2px solid rgba(255,255,255,0.3)'}}/>
                  ) : (
                    <div style={{width:76,height:76,borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:700,color:'#fff'}}>
                      {badgeLav.nome?.[0]}{badgeLav.cognome?.[0]}
                    </div>
                  )}
                  <div style={{fontSize:11,color:'rgba(255,255,255,0.95)',fontWeight:700,textAlign:'center',wordBreak:'break-word',marginTop:4}}>
                    {azienda?.nome}
                  </div>
                  {azienda?.piva && (
                    <div style={{fontSize:9,color:'rgba(255,255,255,0.65)',textAlign:'center'}}>P.IVA: {azienda.piva}</div>
                  )}
                  {azienda?.settore && (
                    <div style={{fontSize:9,color:'rgba(255,255,255,0.5)',textAlign:'center'}}>{azienda.settore}</div>
                  )}
                </div>

                {/* Colonna destra */}
                <div style={{flex:1,padding:'14px 16px',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:17,fontWeight:700,color:'#0f3460'}}>{badgeLav.cognome.toUpperCase()} {badgeLav.nome}</div>
                    <div style={{fontSize:13,color:'#374151',marginTop:2}}>{badgeLav.mansione||''}</div>
                    {badgeLav.data_assunzione && (
                      <div style={{fontSize:12,color:'#6b7280',marginTop:3}}>
                        Assunto il: {new Date(badgeLav.data_assunzione).toLocaleDateString('it-IT')}
                      </div>
                    )}
                    {badgeLav.codice_fiscale && (
                      <div style={{fontSize:11,color:'#9ca3af',marginTop:2}}>C.F.: {badgeLav.codice_fiscale}</div>
                    )}
                    {badgeLav.ruoli_sicurezza?.length>0 && (
                      <div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:6}}>
                        {badgeLav.ruoli_sicurezza.slice(0,3).map((r,i)=>(
                          <span key={i} style={{fontSize:10,background:'#dbeafe',color:'#1e40af',padding:'2px 7px',borderRadius:10,fontWeight:500}}>
                            {r.replace('Addetto ','').replace('(Rischio ','(')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',alignItems:'flex-end',justifyContent:'flex-end',marginTop:10}}>
                    {qrDataUrl && <img src={qrDataUrl} alt="QR" style={{width:52,height:52}}/>}
                  </div>
                </div>
              </div>

              {/* Carica foto */}
              <div style={{marginTop:16,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                <label style={{fontSize:13,fontWeight:500,color:'#374151'}}>Foto dipendente (opzionale):</label>
                <input type="file" accept="image/*" onChange={handleFotoUpload} style={{fontSize:13,flex:1}}/>
                {fotoUrl && <button className="btn btn-secondary btn-sm" onClick={()=>setFotoUrl(null)}>Rimuovi</button>}
              </div>
              <p style={{fontSize:12,color:'#9ca3af',marginTop:8}}>Formati accettati: JPG, PNG.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setBadgeLav(null)}>Chiudi</button>
              <button className="btn btn-primary" onClick={downloadBadgePDF}>⬇ Scarica PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Actions({row, canEdit, onEdit, onDelete}) {
  if (!canEdit) return null;
  return (
    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
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

function TableLavoratori({rows,canEdit,onEdit,onDelete,onBadge}) {
  return <table><thead><tr><th>Cognome e nome</th><th>Mansione</th><th>Ruoli sicurezza</th><th>C.F.</th><th>Turni</th><th>Stato</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={7}/>:rows.map(r=><tr key={r.id}>
      <td style={{fontWeight:600}}>{r.cognome} {r.nome}</td>
      <td>{r.mansione||'—'}</td>
      <td>{r.ruoli_sicurezza?.length>0?r.ruoli_sicurezza.map((x,i)=><span key={i} className="badge badge-info" style={{marginRight:3,fontSize:11}}>{x.replace('Addetto ','')}</span>):'—'}</td>
      <td style={{fontSize:13}}>{r.codice_fiscale||'—'}</td>
      <td><span className={`badge ${r.fa_turni?'badge-warning':'badge-gray'}`}>{r.fa_turni?'Sì':'No'}</span></td>
      <td><span className={`badge ${r.attivo?'badge-ok':'badge-gray'}`}>{r.attivo?'Attivo':'Non attivo'}</span></td>
      <td>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          <Actions row={r} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete}/>
          <button className="btn btn-success btn-sm" onClick={()=>onBadge(r)}>QR Badge</button>
        </div>
      </td>
    </tr>)}</tbody></table>;
}

function TableFormazione({rows,canEdit,onEdit,onDelete}) {
  return <table><thead><tr><th>Lavoratore</th><th>Corso</th><th>Ente</th><th>Ore</th><th>Completato</th><th>Scadenza</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={7}/>:rows.map(r=><tr key={r.id}>
      <td style={{fontWeight:600}}>{r.cognome} {r.nome}</td>
      <td>{r.tipo_corso}</td><td>{r.ente_formatore||'—'}</td><td>{r.ore_corso||'—'}</td>
      <td>{formatDate(r.data_completamento)}</td>
      <td>{r.scadenza?<Scad data={r.scadenza}/>:'—'}</td>
      <td><Actions row={r} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete}/></td>
    </tr>)}</tbody></table>;
}

function TableVisite({rows,canEdit,onEdit,onDelete}) {
  return <table><thead><tr><th>Lavoratore</th><th>Medico</th><th>Data visita</th><th>Giudizio</th><th>Scadenza</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={6}/>:rows.map(r=><tr key={r.id}>
      <td style={{fontWeight:600}}>{r.cognome} {r.nome}</td>
      <td>{r.medico_competente||'—'}</td>
      <td>{formatDate(r.data_visita)}</td>
      <td><span className="badge badge-info">{r.giudizio}</span></td>
      <td><Scad data={r.scadenza}/></td>
      <td><Actions row={r} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete}/></td>
    </tr>)}</tbody></table>;
}

function TableNomine({rows,canEdit,onEdit,onDelete}) {
  return <table><thead><tr><th>Tipo nomina</th><th>Nominato</th><th>Data nomina</th><th>Scadenza</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={5}/>:rows.map(r=><tr key={r.id}>
      <td><span className="badge badge-info">{r.tipo}</span></td>
      <td style={{fontWeight:600}}>{r.nominato}</td>
      <td>{formatDate(r.data_nomina)}</td>
      <td>{r.scadenza?<Scad data={r.scadenza}/>:'Senza scadenza'}</td>
      <td><Actions row={r} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete}/></td>
    </tr>)}</tbody></table>;
}

function TableAttrezzature({rows,canEdit,onEdit,onDelete}) {
  return <table><thead><tr><th>Attrezzatura</th><th>Marca/modello</th><th>Matricola</th><th>Ultima verifica</th><th>Prossima verifica</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={6}/>:rows.map(r=><tr key={r.id}>
      <td style={{fontWeight:600}}>{r.nome}</td>
      <td>{r.marca_modello||'—'}</td><td>{r.matricola||'—'}</td>
      <td>{formatDate(r.ultima_verifica)}</td>
      <td>{r.prossima_verifica?<Scad data={r.prossima_verifica}/>:'—'}</td>
      <td><Actions row={r} canEdit={canEdit} onEdit={onEdit} onDelete={onDelete}/></td>
    </tr>)}</tbody></table>;
}

function TableDocumenti({rows,canEdit,onDelete}) {
  return <table><thead><tr><th>Documento</th><th>Tipo</th><th>Caricato il</th><th>Scadenza</th><th>Link</th><th></th></tr></thead>
    <tbody>{rows.length===0?<EmptyRow cols={6}/>:rows.map(r=><tr key={r.id}>
      <td style={{fontWeight:600}}>{r.nome}</td>
      <td><span className="badge badge-gray">{r.tipo}</span></td>
      <td>{formatDate(r.data_upload)}</td>
      <td>{r.scadenza?<Scad data={r.scadenza}/>:'—'}</td>
      <td>{r.url?<a href={r.url} target="_blank" rel="noreferrer" style={{color:'#0f3460',fontSize:13}}>Apri →</a>:'—'}</td>
      <td>{canEdit&&<button className="btn btn-danger btn-sm" onClick={()=>onDelete(r.id)}>Elimina</button>}</td>
    </tr>)}</tbody></table>;
}

function FormLavoratore({form, f, ruoliList}) {
  const ruoli = form.ruoli_sicurezza || [];
  function toggleRuolo(r) {
    const nuovi = ruoli.includes(r) ? ruoli.filter(x=>x!==r) : [...ruoli, r];
    f('ruoli_sicurezza', nuovi);
  }
  return <>
    <div style={{fontWeight:600,fontSize:14,marginBottom:12,color:'#0f3460'}}>Dati anagrafici</div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" value={form.nome||''} onChange={e=>f('nome',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Cognome *</label><input className="form-input" value={form.cognome||''} onChange={e=>f('cognome',e.target.value)}/></div>
    </div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Data di nascita</label><input className="form-input" type="date" value={form.data_nascita?.split('T')[0]||''} onChange={e=>f('data_nascita',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Luogo di nascita</label><input className="form-input" value={form.luogo_nascita||''} onChange={e=>f('luogo_nascita',e.target.value)}/></div>
    </div>
    <div className="form-group"><label className="form-label">Codice fiscale</label><input className="form-input" value={form.codice_fiscale||''} onChange={e=>f('codice_fiscale',e.target.value.toUpperCase())} style={{textTransform:'uppercase'}}/></div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Telefono</label><input className="form-input" value={form.telefono||''} onChange={e=>f('telefono',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email||''} onChange={e=>f('email',e.target.value)}/></div>
    </div>
    <div style={{fontWeight:600,fontSize:14,margin:'16px 0 12px',color:'#0f3460'}}>Dati lavorativi</div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Mansione</label><input className="form-input" value={form.mansione||''} onChange={e=>f('mansione',e.target.value)}/></div>
      <div className="form-group"><label className="form-label">Reparto</label><input className="form-input" value={form.reparto||''} onChange={e=>f('reparto',e.target.value)}/></div>
    </div>
    <div className="form-group"><label className="form-label">Data assunzione</label><input className="form-input" type="date" value={form.data_assunzione?.split('T')[0]||''} onChange={e=>f('data_assunzione',e.target.value)}/></div>
    <div className="form-grid">
      <div className="form-group"><label className="form-label">Fa i turni?</label>
        <select className="form-input" value={form.fa_turni?'true':'false'} onChange={e=>f('fa_turni',e.target.value==='true')}>
          <option value="false">No</option><option value="true">Sì</option>
        </select>
      </div>
      <div className="form-group"><label className="form-label">Stato</label>
        <select className="form-input" value={form.attivo===false?'false':'true'} onChange={e=>f('attivo',e.target.value==='true')}>
          <option value="true">Attivo</option><option value="false">Non attivo</option>
        </select>
      </div>
    </div>
    {form.fa_turni && <div className="form-group"><label className="form-label">Note turni</label><input className="form-input" value={form.turno_note||''} onChange={e=>f('turno_note',e.target.value)} placeholder="es. Mattina/Pomeriggio/Notte"/></div>}
    <div style={{fontWeight:600,fontSize:14,margin:'16px 0 12px',color:'#0f3460'}}>Ruoli sicurezza</div>
    <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:14}}>
      {ruoliList.map(r=>(
        <div key={r} onClick={()=>toggleRuolo(r)} style={{
          padding:'6px 12px',borderRadius:20,cursor:'pointer',fontSize:13,fontWeight:500,
          background:ruoli.includes(r)?'#0f3460':'#f1f5f9',
          color:ruoli.includes(r)?'#fff':'#374151',
          border:`1px solid ${ruoli.includes(r)?'#0f3460':'#e2e8f0'}`,
          transition:'all 0.15s'
        }}>{r}</div>
      ))}
    </div>
    <div style={{fontWeight:600,fontSize:14,margin:'16px 0 12px',color:'#0f3460'}}>Formazione pregressa</div>
    <div className="form-group">
      <label className="form-label">Corsi già in possesso al momento dell'assunzione</label>
      <textarea className="form-input" rows="3" value={form.formazione_pregressa||''} onChange={e=>f('formazione_pregressa',e.target.value)} placeholder="es. Formazione generale 4h (2020), Primo soccorso (2022)..."/>
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
    <div className="form-group"><label className="form-label">Nominato *</label><input className="form-input" value={form.nominato||''} onChange={e=>f('nominato',e.target.value)}/></div>
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
      <div className="form-group"><label className="form-label">Matricola</label><input className="form-input" value={form.matricola||''} onChange={e=>f('matricola',e.target.value)}/></div>
    </div>
    <div className="form-group"><label className="form-label">Tipo verifica</label><input className="form-input" value={form.tipo_verifica||''} onChange={e=>f('tipo_verifica',e.target.value)} placeholder="es. Verifica INAIL"/></div>
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
    <div className="form-group"><label className="form-label">URL documento (opz.)</label><input className="form-input" type="url" value={form.url||''} onChange={e=>f('url',e.target.value)} placeholder="https://drive.google.com/..."/></div>
    <div className="form-group"><label className="form-label">Scadenza (opz.)</label><input className="form-input" type="date" value={form.scadenza?.split('T')[0]||''} onChange={e=>f('scadenza',e.target.value)}/></div>
    <div className="form-group"><label className="form-label">Note</label><textarea className="form-input" rows="2" value={form.note||''} onChange={e=>f('note',e.target.value)}/></div>
  </>;
}
