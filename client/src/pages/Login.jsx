import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        <div className="login-logo">
          <h1>SLV Sicurezza</h1>
          <p>Gestionale sicurezza sul lavoro</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required
              value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required
              value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} />
          </div>
          {error && <div style={{color:'#dc2626',fontSize:13,marginBottom:12}}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{width:'100%',justifyContent:'center',padding:'10px'}}>
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
        <p style={{marginTop:20,fontSize:11,color:'#9ca3af',textAlign:'center'}}>
          SLV Sicurezza · Salvatore Vitale
        </p>
      </div>
    </div>
  );
}
