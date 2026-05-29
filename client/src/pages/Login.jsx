import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { lingue, t, setLingua, getLingua } from '../i18n/traduzioni.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lingua, setLinguaState] = useState(getLingua());

  function handleLingua(codice) {
    setLingua(codice);
    setLinguaState(codice);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(form.email, form.password);
      login(res.user, res.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        {/* Selettore lingua */}
        <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:24,flexWrap:'wrap'}}>
          {lingue.map(l => (
            <button
              key={l.code}
              onClick={() => handleLingua(l.code)}
              style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'5px 12px', borderRadius:20, cursor:'pointer',
                border: lingua === l.code ? '2px solid #0f3460' : '1.5px solid #e2e8f0',
                background: lingua === l.code ? '#eff6ff' : '#f8fafc',
                fontSize:12, fontWeight:600,
                color: lingua === l.code ? '#0f3460' : '#6b7280',
                transition:'all 0.15s'
              }}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>

        <div className="login-logo">
          <h1>SLV Sicurezza</h1>
          <p>Gestionale sicurezza sul lavoro</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required
              value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required
              value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))} />
          </div>
          {error && <div style={{color:'#dc2626',fontSize:13,marginBottom:12}}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{width:'100%',justifyContent:'center',padding:'11px'}}>
            {loading ? t(lingua, 'caricamento') : 'Accedi'}
          </button>
        </form>

        <p style={{marginTop:20,fontSize:11,color:'#9ca3af',textAlign:'center'}}>
          SLV Sicurezza · Salvatore Vitale
        </p>
      </div>
    </div>
  );
}
