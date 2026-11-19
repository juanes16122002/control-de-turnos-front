import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: BASE_URL });

const leerToken = () => localStorage.getItem('authToken');

api.interceptors.request.use((config) => {
  const token = leerToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function cerrarSesionLocal(motivo) {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  if (window.location.pathname !== '/login') {
    window.location.href = motivo ? `/login?motivo=${encodeURIComponent(motivo)}` : '/login';
  }
}

// Ejecuta `fn` con un candado compartido entre TODAS las pestañas del navegador (Web Locks API).
// Así solo una pestaña renueva a la vez; las demás esperan y reutilizan el token nuevo.
function conCandadoEntrePestanas(fn) {
  if (navigator.locks?.request) return navigator.locks.request('basel-renovar-sesion', fn);
  return fn(); // navegadores antiguos: el margen de gracia del servidor cubre la carrera
}

// Promesa compartida dentro de esta pestaña: varias peticiones con 401 → una sola renovación
let renovacionEnCurso = null;

/**
 * Obtiene un token de acceso vigente distinto de `tokenRechazado`.
 * Si otra pestaña ya renovó mientras tanto, usa ese token sin volver a renovar.
 */
function obtenerTokenNuevo(tokenRechazado) {
  if (!renovacionEnCurso) {
    renovacionEnCurso = conCandadoEntrePestanas(async () => {
      const actual = leerToken();
      if (actual && actual !== tokenRechazado) return actual; // otra pestaña ya renovó

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw Object.assign(new Error('sin refresh token'), { motivo: 'expirada' });

      try {
        // axios "limpio": sin interceptores, para no entrar en bucle
        const res = await axios.post(`${BASE_URL}/refresh-token`, { refreshToken });
        localStorage.setItem('authToken', res.data.token);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        return res.data.token;
      } catch (err) {
        // ¿Otra pestaña sin Web Locks renovó justo ahora? Entonces ese token sirve
        const tras = leerToken();
        if (tras && tras !== tokenRechazado && tras !== actual) return tras;
        throw Object.assign(err, { motivo: err.response?.status === 401 ? 'expirada' : undefined });
      }
    }).finally(() => { renovacionEnCurso = null; });
  }
  return renovacionEnCurso;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const tokenUsado = (original.headers?.Authorization || '').replace(/^Bearer\s+/, '') || null;
    try {
      const token = await obtenerTokenNuevo(tokenUsado);
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (err) {
      cerrarSesionLocal(err.motivo);
      return Promise.reject(error);
    }
  }
);

export default api;
