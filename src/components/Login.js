import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../api';
import { BrandLogoImage } from './BrandLogo';

const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sesionExpirada = params.get('motivo') === 'expirada';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const response = await api.post('/login', { usuario, contrasena });
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        navigate('/home');
      }
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-canvas px-4">
      {/* Fondo plano del color exacto del logo + halo blanco muy tenue */}
      <div className="absolute inset-0 bg-glow pointer-events-none" />

      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <BrandLogoImage className="w-64 max-w-full" />
          <span className="w-10 h-px bg-white/20 mt-8 mb-4" aria-hidden="true" />
          <h1 className="eyebrow text-neutral-400">Control de turnos</h1>
        </div>

        <div className="glass rounded-xl p-8 shadow-2xl shadow-black/60 animate-slide-up">
          {sesionExpirada && !error && (
            <div className="text-sm text-neutral-300 bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 mb-5" role="status">
              Tu sesión expiró. Inicia sesión nuevamente.
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="label" htmlFor="usuario">Usuario</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
                <input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="input input-icon"
                  placeholder="Ingresa tu usuario"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="contrasena">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
                <input
                  id="contrasena"
                  type={showPass ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="input input-icon"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 animate-slide-down">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="btn-primary w-full py-2.5"
            >
              {cargando ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
