// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  // Si luego usas auth:
  // headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
});

export default api;

