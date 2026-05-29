import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  aziende: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  calendario: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  utenti: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() { logout(); navigate('/login'); }
  function closeMenu() { setMenuOpen(false); }

  return (
    <div className="layout">
      {/* Overlay mobile */}
      <div className={`sidebar-overlay${menuOpen?' visible':''}`} onClick={closeMenu}/>

      <aside className={`sidebar${menuOpen?' open':''}`}>
        <div className="sidebar-logo">
          <h1>SLV Sicurezza</h1>
          <p>Gestionale sicurezza</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({isActive})=>`nav-item${isActive?' active':''}`} onClick={closeMenu}>
            {icons.dashboard} Dashboard
          </NavLink>
          <NavLink to="/aziende" className={({isActive})=>`nav-item${isActive?' active':''}`} onClick={closeMenu}>
            {icons.aziende} Aziende clienti
          </NavLink>
          <NavLink to="/calendario" className={({isActive})=>`nav-item${isActive?' active':''}`} onClick={closeMenu}>
            {icons.calendario} Calendario scadenze
          </NavLink>
          {user?.role==='admin' && (
            <NavLink to="/utenti" className={({isActive})=>`nav-item${isActive?' active':''}`} onClick={closeMenu}>
              {icons.utenti} Utenti portale
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.nome || user?.email}</div>
          <button className="btn-logout" onClick={handleLogout}>Esci</button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button className="hamburger" onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="topbar-title">SLV Sicurezza</span>
          </div>
          <span style={{fontSize:13,color:'#6b7280',display:'none'}} className="topbar-user">{user?.nome}</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
