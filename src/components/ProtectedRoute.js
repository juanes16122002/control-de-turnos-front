import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';

// Token ya validado contra el servidor en esta pestaña: evita llamar a /perfil en cada navegación.
// La seguridad real está en el backend (cada endpoint verifica el JWT); esto solo evita
// mostrar el panel vacío a quien tenga un token inexistente, alterado o vencido.
let tokenVerificado = null;

export function olvidarVerificacion() {
  tokenVerificado = null;
}

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const [estado, setEstado] = useState(() => (!token ? 'denegado' : token === tokenVerificado ? 'ok' : 'verificando'));

  useEffect(() => {
    if (estado !== 'verificando') return undefined;
    let activo = true;
    api.get('/perfil')
      // El interceptor de api.js renueva el token si venció; se guarda el vigente
      .then(() => { tokenVerificado = localStorage.getItem('authToken'); if (activo) setEstado('ok'); })
      .catch((err) => {
        if (!activo) return;
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          tokenVerificado = null;
          setEstado('denegado');
        } else {
          // Servidor caído o sin red: no se puede confirmar la sesión. Se muestra el panel
          // (sin datos: cada llamada a la API seguirá exigiendo un token válido).
          setEstado('ok');
        }
      });
    return () => { activo = false; };
  }, [estado]);

  // Si en otra pestaña se cierra la sesión (o vence), esta también sale del panel
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'authToken' && !e.newValue) {
        tokenVerificado = null;
        setEstado('denegado');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (estado === 'denegado') return <Navigate to="/login" replace />;

  if (estado === 'verificando') {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Verificando sesión">
        <span className="w-6 h-6 rounded-full border-2 border-white/15 border-t-white animate-spin" />
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
