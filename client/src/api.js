const BASE = '/api';

function getToken() {
  return localStorage.getItem('slv_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Errore del server');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  initAdmin: (email, password) => request('/auth/init', { method: 'POST', body: { email, password } }),
  getUsers: () => request('/auth/users'),
  createUser: (data) => request('/auth/users', { method: 'POST', body: data }),
  deleteUser: (id) => request(`/auth/users/${id}`, { method: 'DELETE' }),

  // Aziende
  getAziende: () => request('/aziende'),
  getAzienda: (id) => request(`/aziende/${id}`),
  createAzienda: (data) => request('/aziende', { method: 'POST', body: data }),
  updateAzienda: (id, data) => request(`/aziende/${id}`, { method: 'PUT', body: data }),
  deleteAzienda: (id) => request(`/aziende/${id}`, { method: 'DELETE' }),

  // Lavoratori
  getLavoratori: (aziendaId) => request(`/lavoratori/azienda/${aziendaId}`),
  createLavoratore: (data) => request('/lavoratori', { method: 'POST', body: data }),
  updateLavoratore: (id, data) => request(`/lavoratori/${id}`, { method: 'PUT', body: data }),
  deleteLavoratore: (id) => request(`/lavoratori/${id}`, { method: 'DELETE' }),
  importLavoratoriCSV: (aziendaId, lavoratori) => request('/lavoratori/import-csv', { method: 'POST', body: { azienda_id: aziendaId, lavoratori } }),

  // Formazione
  getFormazione: (aziendaId) => request(`/formazione/azienda/${aziendaId}`),
  createFormazione: (data) => request('/formazione', { method: 'POST', body: data }),
  updateFormazione: (id, data) => request(`/formazione/${id}`, { method: 'PUT', body: data }),
  deleteFormazione: (id) => request(`/formazione/${id}`, { method: 'DELETE' }),

  // Visite
  getVisite: (aziendaId) => request(`/visite/azienda/${aziendaId}`),
  createVisita: (data) => request('/visite', { method: 'POST', body: data }),
  updateVisita: (id, data) => request(`/visite/${id}`, { method: 'PUT', body: data }),
  deleteVisita: (id) => request(`/visite/${id}`, { method: 'DELETE' }),

  // Nomine
  getNomine: (aziendaId) => request(`/nomine/azienda/${aziendaId}`),
  createNomina: (data) => request('/nomine', { method: 'POST', body: data }),
  updateNomina: (id, data) => request(`/nomine/${id}`, { method: 'PUT', body: data }),
  deleteNomina: (id) => request(`/nomine/${id}`, { method: 'DELETE' }),

  // Attrezzature
  getAttrezzature: (aziendaId) => request(`/attrezzature/azienda/${aziendaId}`),
  createAttrezzatura: (data) => request('/attrezzature', { method: 'POST', body: data }),
  updateAttrezzatura: (id, data) => request(`/attrezzature/${id}`, { method: 'PUT', body: data }),
  deleteAttrezzatura: (id) => request(`/attrezzature/${id}`, { method: 'DELETE' }),

  // Documenti
  getDocumenti: (aziendaId) => request(`/documenti/azienda/${aziendaId}`),
  createDocumento: (data) => request('/documenti', { method: 'POST', body: data }),
  deleteDocumento: (id) => request(`/documenti/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardScadenze: (giorni = 90) => request(`/dashboard/scadenze?giorni=${giorni}`),
  getDashboardRiepilogo: () => request('/dashboard/riepilogo'),
};

export function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('it-IT');
}

export function scadenzaStatus(dataStr) {
  if (!dataStr) return 'ok';
  const oggi = new Date();
  const data = new Date(dataStr);
  const diff = (data - oggi) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'scaduta';
  if (diff <= 30) return 'presto';
  return 'ok';
}

export function scadenzaBadge(dataStr) {
  const s = scadenzaStatus(dataStr);
  if (s === 'scaduta') return { cls: 'badge-danger', label: 'Scaduta' };
  if (s === 'presto') return { cls: 'badge-warning', label: 'In scadenza' };
  return { cls: 'badge-ok', label: 'Valida' };
}
