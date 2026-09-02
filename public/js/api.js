// Minimal fetch wrapper. Client-side code NEVER makes authorization
// decisions itself (e.g. it doesn't decide "you're staff so show X") based
// on anything the server hasn't returned — it only reflects what the API
// says. The server is the sole source of truth for who can do what.
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.error || `Request failed (${res.status})`;
    const error = new Error(message);
    error.details = data.details;
    error.status = res.status;
    throw error;
  }

  return data;
}

window.api = { apiRequest, getToken, setToken };
