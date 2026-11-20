import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Fingerprint, Search, ArrowLeft, Delete, LogIn, LogOut, CircleCheck, CircleAlert, RefreshCw, MapPin, LoaderCircle,
} from 'lucide-react';
import kioscoApi from '../../kioscoApi';
import BrandLogo from '../BrandLogo';
import {
  formatearDuracion, formatearHoraCorta, mensajeError, obtenerUbicacion, formatearDistancia,
} from '../../helpers/asistencia';

const PIN_MIN = 4;
const PIN_MAX = 6;
const SEGUNDOS_RESULTADO = 6;
const SEGUNDOS_INACTIVIDAD = 30;
const REFRESCO_EMPLEADOS_MS = 5 * 60 * 1000;
// Una ubicación más antigua que esto se vuelve a pedir antes de marcar
const MAX_EDAD_UBICACION_MS = 60 * 1000;
const GEO_INICIAL = { estado: 'inactivo', pos: null, mensaje: '' };

const Reloj = () => {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="text-center">
      <p className="font-display text-5xl sm:text-6xl md:text-7xl font-light text-white tabular-nums tracking-[0.06em]">
        {ahora.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
      </p>
      <p className="text-neutral-400 mt-1 first-letter:uppercase">
        {ahora.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
};

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'limpiar', '0', 'borrar'];

const KioscoAsistencia = () => {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [seleccionado, setSeleccionado] = useState(null);
  const [pin, setPin] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [cuentaAtras, setCuentaAtras] = useState(SEGUNDOS_RESULTADO);
  const [geocercaActiva, setGeocercaActiva] = useState(false);
  const [geo, setGeo] = useState(GEO_INICIAL);
  // El servidor tarda en responder (p. ej. despertando en el plan gratuito)
  const [servidorLento, setServidorLento] = useState(false);

  const ultimaActividad = useRef(Date.now());
  const registrarActividad = () => { ultimaActividad.current = Date.now(); };

  const cargarEmpleados = useCallback(async () => {
    const aviso = setTimeout(() => setServidorLento(true), 4000);
    try {
      setErrorCarga('');
      const [resEmp, resConfig] = await Promise.all([
        kioscoApi.get('/kiosco/empleados'),
        kioscoApi.get('/kiosco/config'),
      ]);
      setEmpleados(resEmp.data);
      setGeocercaActiva(!!resConfig.data.geocerca_activa);
    } catch (err) {
      setErrorCarga('No se pudo conectar con el servidor. Reintentando…');
    } finally {
      clearTimeout(aviso);
      setServidorLento(false);
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEmpleados();
    const t = setInterval(cargarEmpleados, REFRESCO_EMPLEADOS_MS);
    return () => clearInterval(t);
  }, [cargarEmpleados]);

  // Reintento rápido si falló la conexión
  useEffect(() => {
    if (!errorCarga) return undefined;
    const t = setTimeout(cargarEmpleados, 10000);
    return () => clearTimeout(t);
  }, [errorCarga, cargarEmpleados]);

  const reiniciar = useCallback(() => {
    setSeleccionado(null);
    setPin('');
    setError('');
    setResultado(null);
    setBusqueda('');
    setGeo(GEO_INICIAL);
  }, []);

  const solicitarUbicacion = useCallback(async () => {
    setGeo((g) => ({ ...g, estado: 'buscando', mensaje: '' }));
    try {
      const pos = await obtenerUbicacion();
      setGeo({ estado: 'lista', pos, mensaje: '' });
      return pos;
    } catch (err) {
      setGeo({ estado: 'error', pos: null, mensaje: err.message });
      throw err;
    }
  }, []);

  // Pide la ubicación apenas se elige a la persona: estará lista al terminar de escribir el PIN
  useEffect(() => {
    if (seleccionado && geocercaActiva && !resultado) solicitarUbicacion().catch(() => {});
  }, [seleccionado, geocercaActiva, resultado, solicitarUbicacion]);

  // Volver al inicio si alguien deja el PIN a medio escribir
  useEffect(() => {
    if (!seleccionado || resultado) return undefined;
    const t = setInterval(() => {
      if (Date.now() - ultimaActividad.current > SEGUNDOS_INACTIVIDAD * 1000) reiniciar();
    }, 1000);
    return () => clearInterval(t);
  }, [seleccionado, resultado, reiniciar]);

  // Cuenta regresiva de la pantalla de resultado
  useEffect(() => {
    if (!resultado) return undefined;
    setCuentaAtras(SEGUNDOS_RESULTADO);
    const t = setInterval(() => {
      setCuentaAtras((s) => {
        if (s <= 1) { clearInterval(t); reiniciar(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resultado, reiniciar]);

  const pulsarTecla = useCallback((tecla) => {
    registrarActividad();
    setError('');
    if (tecla === 'borrar') setPin((p) => p.slice(0, -1));
    else if (tecla === 'limpiar') setPin('');
    else setPin((p) => (p.length < PIN_MAX ? p + tecla : p));
  }, []);

  const marcar = useCallback(async (tipo) => {
    if (!seleccionado || pin.length < PIN_MIN || enviando) return;
    registrarActividad();
    try {
      setEnviando(true);
      setError('');
      let ubicacion;
      if (geocercaActiva) {
        let pos = geo.pos;
        if (!pos || Date.now() - pos.obtenida_en > MAX_EDAD_UBICACION_MS) {
          try {
            pos = await solicitarUbicacion();
          } catch (e) {
            setError(e.message);
            return;
          }
        }
        ubicacion = { lat: pos.lat, lng: pos.lng, precision_m: pos.precision_m };
      }
      const aviso = setTimeout(() => setServidorLento(true), 4000);
      const res = await kioscoApi.post('/kiosco/marcar', { empleado_id: seleccionado.id, pin, tipo, ubicacion })
        .finally(() => { clearTimeout(aviso); setServidorLento(false); });
      setResultado(res.data);
    } catch (err) {
      setError(mensajeError(err, err.code === 'ECONNABORTED' || !err.response
        ? 'Sin conexión con el servidor. Intenta de nuevo.'
        : 'No se pudo registrar la marca.'));
      setPin('');
    } finally {
      setEnviando(false);
    }
  }, [seleccionado, pin, enviando, geocercaActiva, geo.pos, solicitarUbicacion]);

  // Teclado físico: dígitos, Backspace, Escape
  useEffect(() => {
    if (!seleccionado || resultado) return undefined;
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) pulsarTecla(e.key);
      else if (e.key === 'Backspace') pulsarTecla('borrar');
      else if (e.key === 'Escape') reiniciar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [seleccionado, resultado, pulsarTecla, reiniciar]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es');
    if (!q) return empleados;
    const norm = (s) => s.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '');
    return empleados.filter((e) => norm(e.nombre).includes(norm(q)));
  }, [empleados, busqueda]);

  // ---------------- Render ----------------

  const contenedor = (children) => (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-10 relative overflow-hidden bg-canvas">
      <div className="absolute inset-0 bg-glow pointer-events-none" />
      <div className="relative w-full max-w-3xl flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <BrandLogo size="lg" />
          <h1 className="eyebrow flex items-center gap-2">
            <Fingerprint size={12} /> Registro de asistencia
          </h1>
        </div>
        <Reloj />
        {children}
      </div>
    </div>
  );

  // Paso 3: resultado
  if (resultado) {
    const esEntrada = resultado.tipo === 'entrada';
    const a = resultado.asistencia;
    return contenedor(
      <div className="card w-full max-w-md p-8 text-center animate-scale-in" role="status" aria-live="polite">
        <CircleCheck className={`w-20 h-20 mx-auto mb-4 ${esEntrada ? 'text-emerald-400' : 'text-amber-400'}`} />
        <p className="font-display text-2xl font-normal tracking-wide text-white">
          {esEntrada ? '¡Bienvenido/a' : '¡Hasta pronto'}, {resultado.empleado.nombre.split(' ')[0]}!
        </p>
        <p className="text-neutral-300 mt-3 text-lg">
          {esEntrada ? 'Entrada' : 'Salida'} registrada a las{' '}
          <span className="font-semibold text-white">
            {formatearHoraCorta(esEntrada ? a.entrada : a.salida)}
          </span>
        </p>
        {a.evento_nombre && (
          <p className="text-neutral-400 mt-2">
            Evento: <span className="font-semibold text-white">{a.evento_nombre}</span>
          </p>
        )}
        {!esEntrada && (
          <p className="text-neutral-400 mt-2">
            Tiempo trabajado: <span className="font-semibold text-white">{formatearDuracion(a.horas)}</span>
            <span className="block text-xs mt-1">Entrada a las {formatearHoraCorta(a.entrada)}</span>
          </p>
        )}
        {(() => {
          const u = esEntrada ? a.ubicacion_entrada : a.ubicacion_salida;
          return u?.distancia_m != null && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500 mt-4">
              <MapPin size={13} /> Ubicación verificada · a {formatearDistancia(u.distancia_m)} del local
            </p>
          );
        })()}
        <button onClick={reiniciar} className="btn-secondary mt-6 w-full py-3">
          Listo ({cuentaAtras})
        </button>
      </div>
    );
  }

  // Paso 2: PIN
  if (seleccionado) {
    const puedeMarcar = pin.length >= PIN_MIN && !enviando;
    return contenedor(
      <div className="card w-full max-w-md p-6 animate-slide-up">
        <button onClick={reiniciar} className="btn-ghost btn-sm -ml-2 mb-3">
          <ArrowLeft size={16} /> Cambiar persona
        </button>
        <p className="text-center text-neutral-400 text-sm">Hola,</p>
        <p className={`text-center font-display text-2xl font-normal tracking-wide text-white ${geocercaActiva ? 'mb-2' : 'mb-5'}`}>{seleccionado.nombre}</p>

        {geocercaActiva && (
          <div className="flex justify-center mb-5 min-h-[1.5rem]" aria-live="polite">
            {geo.estado === 'buscando' && (
              <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                <LoaderCircle size={13} className="animate-spin" /> Verificando tu ubicación…
              </span>
            )}
            {geo.estado === 'lista' && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-300/90">
                <MapPin size={13} /> Ubicación lista (±{geo.pos.precision_m} m)
              </span>
            )}
            {geo.estado === 'error' && (
              <span className="flex flex-col items-center gap-1.5 text-xs text-amber-300 text-center max-w-xs">
                <span className="flex items-start gap-1.5"><MapPin size={13} className="shrink-0 mt-0.5" /> {geo.mensaje}</span>
                <button type="button" className="btn-ghost btn-xs" onClick={() => { registrarActividad(); solicitarUbicacion().catch(() => {}); }}>
                  <RefreshCw size={12} /> Reintentar
                </button>
              </span>
            )}
          </div>
        )}

        <p className="label text-center">Ingresa tu PIN</p>
        <div className="flex justify-center gap-3 mb-4" aria-label={`PIN: ${pin.length} dígitos ingresados`}>
          {Array.from({ length: PIN_MAX }).map((_, i) => (
            <span
              key={i}
              className={`w-4 h-4 rounded-full border transition-all ${
                i < pin.length ? 'bg-white border-white scale-110' : 'border-neutral-600'
              } ${i >= PIN_MIN && i >= pin.length ? 'opacity-40' : ''}`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 animate-slide-down" role="alert">
            <CircleAlert size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-5">
          {TECLAS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => pulsarTecla(t)}
              disabled={enviando}
              aria-label={t === 'borrar' ? 'Borrar último dígito' : t === 'limpiar' ? 'Limpiar PIN' : t}
              className={`h-16 rounded-2xl text-2xl font-semibold transition-all active:scale-95 disabled:opacity-40 ${
                t.length > 1
                  ? 'bg-neutral-800/40 text-neutral-400 text-sm hover:bg-neutral-800'
                  : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700/50'
              }`}
            >
              {t === 'borrar' ? <Delete className="mx-auto" /> : t === 'limpiar' ? 'Limpiar' : t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => marcar('entrada')} disabled={!puedeMarcar} className="btn-success py-4 text-base">
            <LogIn size={20} /> Entrada
          </button>
          <button
            onClick={() => marcar('salida')}
            disabled={!puedeMarcar}
            className="btn py-4 text-base bg-amber-600 hover:bg-amber-500 text-white active:scale-[0.98] focus:ring-amber-500"
          >
            <LogOut size={20} /> Salida
          </button>
        </div>
        {enviando && (
          <p className="text-center text-xs text-neutral-500 mt-3" role="status">
            {servidorLento ? 'El servidor se está iniciando, puede tardar hasta un minuto…' : 'Registrando…'}
          </p>
        )}
      </div>
    );
  }

  // Paso 1: elegir empleado
  return contenedor(
    <div className="w-full animate-fade-in">
      {errorCarga && (
        <div className="flex items-center justify-center gap-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
          <RefreshCw size={16} className="animate-spin" /> {errorCarga}
        </div>
      )}
      <div className="relative mb-4 max-w-md mx-auto">
        <Search className="w-5 h-5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Busca tu nombre"
          className="input pl-11 py-3 text-base"
          aria-label="Buscar técnico"
        />
      </div>

      {cargando && servidorLento && (
        <p className="text-center text-sm text-neutral-400 mb-4 flex items-center justify-center gap-2" role="status">
          <RefreshCw size={14} className="animate-spin" /> Iniciando el servidor, puede tardar hasta un minuto…
        </p>
      )}
      {cargando ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-center text-neutral-500 py-10">
          {empleados.length === 0
            ? 'Aún no hay técnicos habilitados. El administrador debe asignar un PIN a cada técnico.'
            : 'No se encontró ese nombre.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {filtrados.map((emp) => (
            <button
              key={emp.id}
              onClick={() => { registrarActividad(); setSeleccionado(emp); }}
              className="card-hover px-4 py-5 text-left text-white font-medium text-base active:scale-[0.98] transition-transform"
            >
              {emp.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default KioscoAsistencia;
