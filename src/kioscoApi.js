import axios from 'axios';

// Cliente SIN interceptores de autenticación para el kiosco público.
// No se usa `api.js` porque su interceptor redirige a /login ante un 401,
// y en el kiosco un 401 significa "PIN incorrecto".
const kioscoApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  // Holgado: en el plan gratuito de Render el servidor puede tardar ~1 min en despertar
  timeout: 75000,
});

export default kioscoApi;
