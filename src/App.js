import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Building2, CalendarPlus, CalendarRange, ClipboardList, HardHat, LogOut, LayoutDashboard, Fingerprint, Menu, X } from 'lucide-react';

import Login from './components/Login';
import Home from './Home';
import AllTurnos from './components/AllTurnos';
import Dashboard from './components/Dashboard';
import ProtectedRoute, { olvidarVerificacion } from './components/ProtectedRoute';
import AsistenciasAdmin from './components/asistencia/AsistenciasAdmin';
import EventosAdmin from './components/eventos/EventosAdmin';
import EmpresasAdmin from './components/empresas/EmpresasAdmin';
import TecnicosAdmin from './components/tecnicos/TecnicosAdmin';
import KioscoAsistencia from './components/asistencia/KioscoAsistencia';
import BrandLogo from './components/BrandLogo';
import api from './api';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/home', label: 'Agregar turno', icon: CalendarPlus },
  { path: '/turnos', label: 'Todos los turnos', icon: ClipboardList },
  { path: '/eventos', label: 'Eventos', icon: CalendarRange },
  { path: '/tecnicos', label: 'Técnicos', icon: HardHat },
  { path: '/empresas', label: 'Empresas', icon: Building2 },
  { path: '/asistencias', label: 'Asistencia', icon: Fingerprint },
];

const MEDIA_ESCRITORIO = '(min-width: 1024px)';

function useEsEscritorio() {
  const [es, setEs] = useState(() => window.matchMedia(MEDIA_ESCRITORIO).matches);
  useEffect(() => {
    const mq = window.matchMedia(MEDIA_ESCRITORIO);
    const onChange = (e) => setEs(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return es;
}

/**
 * Menú del panel. En escritorio (lg+) es una columna fija; en celular/tablet es un
 * panel deslizable que se abre desde la barra superior.
 */
const Sidebar = ({ abierto, onCerrar, esEscritorio }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const primerEnlace = useRef(null);

  // Al abrir en celular, el foco va al menú (accesibilidad con lector de pantalla/teclado)
  useEffect(() => {
    if (abierto && !esEscritorio) primerEnlace.current?.focus();
  }, [abierto, esEscritorio]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/logout', { refreshToken });
      }
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      olvidarVerificacion();
      navigate('/login');
    }
  };

  const oculto = !esEscritorio && !abierto;

  return (
    <aside
      id="menu-panel"
      aria-label="Menú principal"
      {...(!esEscritorio && { role: 'dialog', 'aria-modal': abierto ? 'true' : undefined })}
      // Cerrado en celular: fuera de pantalla y fuera del orden de tabulación
      inert={oculto ? true : undefined}
      className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-canvas lg:bg-black/40 border-r border-white/[0.06]
        flex flex-col shrink-0 transition-transform duration-300 ease-out pt-safe pb-safe
        lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:translate-x-0
        ${abierto ? 'translate-x-0 shadow-2xl shadow-black' : '-translate-x-full'}`}
    >
      <div className="px-6 pt-7 pb-6 border-b border-white/[0.06] flex items-start justify-between">
        <div>
          <BrandLogo size="md" />
          <p className="eyebrow mt-5">Control de turnos</p>
        </div>
        {!esEscritorio && (
          <button type="button" onClick={onCerrar} className="btn-ghost btn-sm -mr-2" aria-label="Cerrar menú">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              ref={i === 0 ? primerEnlace : undefined}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 px-3.5 py-3 lg:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
                isActive
                  ? 'bg-white/[0.06] text-white'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]'
              }`}
            >
              {/* Indicador activo: trazo blanco fino, eco del trazo del logo */}
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-px bg-white" aria-hidden="true" />}
              <Icon className={isActive ? 'text-white' : ''} size={18} strokeWidth={1.75} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-neutral-800/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-3 lg:py-2.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

// Estructura del panel (menú + contenido). Va DENTRO de ProtectedRoute: nada del panel,
// ni siquiera el menú, se pinta hasta que el servidor confirma la sesión.
const PanelLayout = () => {
  const esEscritorio = useEsEscritorio();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();
  const botonMenu = useRef(null);
  const seccion = navItems.find((n) => n.path === location.pathname)?.label || '';

  const cerrarMenu = useCallback(() => {
    setMenuAbierto(false);
    botonMenu.current?.focus();
  }, []);

  // Al navegar o pasar a escritorio, el menú deslizable se cierra
  useEffect(() => { setMenuAbierto(false); }, [location.pathname, esEscritorio]);

  // Menú abierto en celular: Escape cierra y el fondo no se desplaza
  useEffect(() => {
    if (!menuAbierto) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') cerrarMenu(); };
    window.addEventListener('keydown', onKey);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowPrevio;
    };
  }, [menuAbierto, cerrarMenu]);

  return (
    <div className="min-h-screen bg-canvas bg-grid lg:flex">
      {/* Barra superior (solo celular/tablet) */}
      <header className="lg:hidden sticky top-0 z-30 pt-safe bg-canvas/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="h-14 px-2 flex items-center gap-2">
          <button
            ref={botonMenu}
            type="button"
            onClick={() => setMenuAbierto(true)}
            className="btn-ghost w-11 h-11 p-0"
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            aria-controls="menu-panel"
          >
            <Menu size={22} />
          </button>
          <BrandLogo size="sm" subtitulo={false} />
          {seccion && <span className="ml-auto mr-2 eyebrow text-neutral-400 truncate">{seccion}</span>}
        </div>
      </header>

      {/* Fondo oscuro detrás del menú abierto en celular */}
      {!esEscritorio && (
        <div
          className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${menuAbierto ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={cerrarMenu}
          aria-hidden="true"
        />
      )}

      <Sidebar abierto={menuAbierto} onCerrar={cerrarMenu} esEscritorio={esEscritorio} />

      {/* min-w-0: permite que tablas anchas hagan scroll dentro de su tarjeta en vez de ensanchar la página */}
      <main className="flex-1 min-w-0 pb-safe">
        <Outlet />
      </main>
    </div>
  );
};

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      {/* Kiosco público: los trabajadores se identifican con su PIN, sin iniciar sesión */}
      <Route path="/asistencia" element={<KioscoAsistencia />} />

      {/* Panel de administración: una sola verificación de sesión para todas sus rutas */}
      <Route element={<ProtectedRoute><PanelLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/home" element={<Home />} />
        <Route path="/turnos" element={<AllTurnos />} />
        <Route path="/eventos" element={<EventosAdmin />} />
        <Route path="/empresas" element={<EmpresasAdmin />} />
        <Route path="/tecnicos" element={<TecnicosAdmin />} />
        <Route path="/asistencias" element={<AsistenciasAdmin />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Router>
);

export default App;
