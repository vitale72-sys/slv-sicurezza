import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

const icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  aziende: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  utenti: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>SLV Sicurezza</h1>
          <p>Gestionale sicurezza</p>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({isActive}) => `nav-item${isActive?' active':''}`}>
            {icons.dashboard} Dashboard
          </NavLink>
          <NavLink to="/aziende" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            {icons.aziende} Aziende clienti
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/utenti" className={({isActive}) => `nav-item${isActive?' active':''}`}>
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
        <Outlet />
      </div>
    </div>
  );
}
