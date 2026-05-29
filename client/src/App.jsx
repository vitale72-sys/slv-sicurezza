import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useContext, useState, useEffect } from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Aziende from './pages/Aziende.jsx';
import AziendaDettaglio from './pages/AziendaDettaglio.jsx';
import Utenti from './pages/Utenti.jsx';
import Calendario from './pages/Calendario.jsx';
import SchedaDipendente from './pages/SchedaDipendente.jsx';
import Layout from './components/Layout.jsx';
import { WhistleblowingPubblico } from './pages/Whistleblowing.jsx';
import { EseguiQuiz } from './pages/Quiz.jsx';

export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('slv_user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    setLoading(false);
  }, []);

  function login(userData, token) {
    localStorage.setItem('slv_token', token);
    localStorage.setItem('slv_user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('slv_token');
    localStorage.removeItem('slv_user');
    setUser(null);
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:16}}>Caricamento...</div>;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/segnala/:aziendaId" element={<WhistleblowingPubblico />} />
          <Route path="/quiz/:quizId/:lavoratoreId" element={<EseguiQuiz />} />
          <Route path="/dipendente/:id" element={<SchedaDipendente />} />
          <Route element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="aziende" element={<Aziende />} />
            <Route path="aziende/:id" element={<AziendaDettaglio />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="utenti" element={<Utenti />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
