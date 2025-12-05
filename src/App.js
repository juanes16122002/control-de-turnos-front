import React, { useState } from 'react';
import api from './api';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom';

import Home from './Home';
import AllTurnos from './components/AllTurnos';

// =======================
//   COMPONENTE LOGIN
// =======================
const Login = () => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/login', {
        usuario,
        contrasena,
      });

      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        navigate('/home');
      }
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-zinc-800">
      <div className="w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-xl p-8 backdrop-blur">
        <h2 className="text-2xl font-semibold text-white text-center mb-6">
          Iniciar sesión
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="usuario"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Usuario
            </label>
            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div>
            <label
              htmlFor="contrasena"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

// =======================
//   CONTENIDO CON RUTAS
// =======================
const AppContent = () => {
  const location = useLocation();

  // Rutas donde NO queremos mostrar el navbar
  const ocultarNavbar =
    location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar superior (solo cuando no estamos en login) */}
      {!ocultarNavbar && (
        <nav className="bg-zinc-950 border-b border-zinc-800 px-4 py-2 flex gap-4 text-sm text-zinc-200">
          <Link
            to="/home"
            className="hover:text-white transition-colors"
          >
            Turnos por empleado
          </Link>
          <Link
            to="/turnos"
            className="hover:text-white transition-colors"
          >
            Todos los turnos
          </Link>
        </nav>
      )}

      {/* Contenido principal */}
      <div className="flex-1">
        <Routes>
          {/* Login en raíz y /login */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Home por empleado */}
          <Route path="/home" element={<Home />} />

          {/* Vista global de todos los turnos */}
          <Route path="/turnos" element={<AllTurnos />} />
        </Routes>
      </div>
    </div>
  );
};

// =======================
//        APP
// =======================
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
