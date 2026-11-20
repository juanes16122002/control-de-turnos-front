import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarRange, Plus, Pencil, Trash2, Users, Building2, Fingerprint, CircleAlert, RefreshCw,
} from 'lucide-react';
import api from '../../api';
import EventoFormModal from './EventoFormModal';
import { formatearFechaISO, hoyISO, mensajeError } from '../../helpers/asistencia';

const VISTAS = [
  { id: 'proximos', label: 'En curso y próximos' },
  { id: 'pasados', label: 'Pasados' },
  { id: 'todos', label: 'Todos' },
];

function rangoFechas(e) {
  return e.fecha_inicio === e.fecha_fin
    ? formatearFechaISO(e.fecha_inicio)
    : `${formatearFechaISO(e.fecha_inicio)} al ${formatearFechaISO(e.fecha_fin)}`;
}

const EstadoBadge = ({ evento, hoy }) => {
  if (evento.fecha_inicio <= hoy && evento.fecha_fin >= hoy) return <span className="badge-emerald">En curso</span>;
  if (evento.fecha_inicio > hoy) return <span className="badge-brand">Próximo</span>;
  return <span className="badge bg-neutral-800 text-neutral-400 border border-neutral-700">Finalizado</span>;
};

const EventosAdmin = () => {
  const navigate = useNavigate();
  // "Ver eventos" desde Empresas llega con ?empresa=ID
  const [searchParams] = useSearchParams();
  const empresaInicial = searchParams.get('empresa') || '';
  const [eventos, setEventos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [vista, setVista] = useState(empresaInicial ? 'todos' : 'proximos');
  const [empresaFiltro, setEmpresaFiltro] = useState(empresaInicial);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null); // { evento } | { evento: null }
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const hoy = hoyISO();

  const mostrarAviso = (msg) => {
    setAviso(msg);
    setTimeout(() => setAviso(''), 5000);
  };

  const cargarEventos = useCallback(async () => {
    const params = {};
    if (vista === 'proximos') params.desde = hoy;
    if (vista === 'pasados') params.hasta = hoy;
    if (empresaFiltro) params.empresa_id = empresaFiltro;
    try {
      setCargando(true);
      const res = await api.get('/eventos', { params });
      // "Pasados" incluye solo los ya terminados; los próximos se ordenan del más cercano al más lejano
      let data = res.data;
      if (vista === 'pasados') data = data.filter((e) => e.fecha_fin < hoy);
      if (vista === 'proximos') data = [...data].reverse();
      setEventos(data);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los eventos'));
    } finally {
      setCargando(false);
    }
  }, [vista, empresaFiltro, hoy]);

  useEffect(() => { cargarEventos(); }, [cargarEventos]);

  useEffect(() => {
    api.get('/empresas').then((r) => setEmpresas(r.data)).catch(() => setError('No se pudieron cargar las empresas'));
    api.get('/empleados').then((r) => setEmpleados(r.data)).catch(() => setError('No se pudieron cargar los técnicos'));
  }, []);

  const abrirEdicion = async (ev) => {
    try {
      const res = await api.get(`/eventos/${ev.id}`);
      setModal({ evento: res.data });
    } catch (err) {
      setError(mensajeError(err, 'No se pudo abrir el evento'));
    }
  };

  const eliminar = async (ev) => {
    const extra = ev.total_asistencias > 0
      ? ` Sus ${ev.total_asistencias} asistencia(s) se conservan, pero quedarán sin evento.`
      : '';
    if (!window.confirm(`¿Eliminar el evento "${ev.nombre}"?${extra}`)) return;
    try {
      await api.delete(`/eventos/${ev.id}`);
      mostrarAviso('Evento eliminado');
      cargarEventos();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo eliminar el evento'));
    }
  };

  const verAsistencias = (ev) => navigate(`/asistencias?evento=${ev.id}`);

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="icon-tile">
            <CalendarRange className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="page-title">Eventos</h1>
            <p className="text-sm text-neutral-400">Cada evento pertenece a una productora y tiene su equipo asignado</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost hidden sm:inline-flex" onClick={cargarEventos} title="Actualizar" aria-label="Actualizar"><RefreshCw size={16} /></button>
          <button className="btn-primary flex-1 sm:flex-none" onClick={() => setModal({ evento: null })}><Plus size={16} /> Nuevo evento</button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <span className="flex items-center gap-2"><CircleAlert size={16} /> {error}</span>
          <button className="btn-ghost btn-xs" onClick={() => setError('')}>Cerrar</button>
        </div>
      )}
      {aviso && (
        <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 animate-slide-down">{aviso}</div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 border-b border-neutral-800/60 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={vista === v.id}
              onClick={() => setVista(v.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                vista === v.id ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <select className="select py-1.5 text-xs sm:w-56 sm:ml-auto" value={empresaFiltro} onChange={(e) => setEmpresaFiltro(e.target.value)} aria-label="Filtrar por empresa">
          <option value="">Todas las empresas</option>
          {empresas.map((emp) => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
        </select>
      </div>

      {cargando && eventos.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      )}

      {!cargando && eventos.length === 0 && (
        <div className="card p-10 text-center">
          <CalendarRange className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
          <p className="text-neutral-400">No hay eventos para mostrar.</p>
          <button className="btn-secondary mt-4" onClick={() => setModal({ evento: null })}><Plus size={16} /> Crear el primero</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {eventos.map((ev) => (
          <div key={ev.id} className="card p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-white font-medium truncate" title={ev.nombre}>{ev.nombre}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{rangoFechas(ev)}</p>
              </div>
              <EstadoBadge evento={ev} hoy={hoy} />
            </div>
            <div className="space-y-1.5 text-sm text-neutral-300">
              <p className="flex items-center gap-2"><Building2 size={14} className="text-neutral-500" /> {ev.empresa_nombre}</p>
              <p className="flex items-center gap-2"><Users size={14} className="text-neutral-500" /> {ev.total_empleados} técnico(s) asignado(s)</p>
              <p className="flex items-center gap-2"><Fingerprint size={14} className="text-neutral-500" /> {ev.total_asistencias} asistencia(s) registrada(s)</p>
            </div>
            {ev.descripcion && <p className="text-xs text-neutral-500 line-clamp-2">{ev.descripcion}</p>}
            <div className="flex gap-2 mt-auto pt-1">
              <button className="btn-secondary btn-sm flex-1" onClick={() => verAsistencias(ev)}>
                <Fingerprint size={14} /> Ver asistencias
              </button>
              <button className="btn-ghost btn-sm" onClick={() => abrirEdicion(ev)} aria-label={`Editar ${ev.nombre}`} title="Editar y asignar técnicos">
                <Pencil size={14} />
              </button>
              <button className="btn-ghost btn-sm text-red-400 hover:text-red-300" onClick={() => eliminar(ev)} aria-label={`Eliminar ${ev.nombre}`} title="Eliminar">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <EventoFormModal
          evento={modal.evento}
          empresas={empresas}
          empleados={empleados}
          onClose={() => setModal(null)}
          onEmpresaCreada={(emp) => setEmpresas((prev) => [...prev, emp].sort((a, b) => a.nombre.localeCompare(b.nombre)))}
          onTecnicoCreado={(tec) => setEmpleados((prev) => [...prev, tec].sort((a, b) => a.nombre.localeCompare(b.nombre)))}
          onGuardado={(ev) => {
            const asociadas = ev.asistencias_asociadas > 0
              ? ` Se asociaron ${ev.asistencias_asociadas} asistencia(s) ya marcadas.`
              : '';
            mostrarAviso(`${modal.evento ? 'Evento actualizado' : 'Evento creado'}.${asociadas}`);
            setModal(null);
            cargarEventos();
          }}
        />
      )}
    </div>
  );
};

export default EventosAdmin;
