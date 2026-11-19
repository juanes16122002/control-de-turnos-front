import React, { useCallback, useEffect, useState } from 'react';
import {
  Fingerprint, UserCheck, Clock, ExternalLink, Plus, RefreshCw, FileSpreadsheet, Search,
  Pencil, Trash2, ArrowRightLeft, LogOut, TriangleAlert, CircleAlert, ChevronLeft, ChevronRight,
  MessageSquare, KeyRound, ClipboardList, MapPin, QrCode,
} from 'lucide-react';
import api from '../../api';
import AsistenciaFormModal from './AsistenciaFormModal';
import ConvertirTurnoModal from './ConvertirTurnoModal';
import PinsEmpleados from './PinsEmpleados';
import GeocercaConfig from './GeocercaConfig';
import QrKioscoModal from './QrKioscoModal';
import {
  formatearDuracion, formatearFechaISO, formatearHoraCorta, formatearFechaCorta, horasDesde,
  haceDiasISO, hoyISO, mensajeError, HORAS_ALERTA_ABIERTA, formatearDistancia, urlMapa,
} from '../../helpers/asistencia';

const TABS = [
  { id: 'activas', label: 'En turno ahora', icon: UserCheck },
  { id: 'historial', label: 'Historial', icon: ClipboardList },
  { id: 'pins', label: 'PIN del kiosco', icon: KeyRound },
  { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
];

const OrigenBadge = ({ origen }) => {
  if (!origen) return null;
  return origen === 'kiosco'
    ? <span className="badge-brand">kiosco</span>
    : <span className="badge-amber" title="Registrado o corregido por el administrador">manual</span>;
};

// Dónde se hizo la marca (si el kiosco envió ubicación): enlace al mapa con la distancia al local
const UbicacionBadge = ({ u }) => {
  if (!u) return null;
  const titulo = `Precisión ±${u.precision_m ?? '?'} m · ver en el mapa`;
  return (
    <a href={urlMapa(u.lat, u.lng)} target="_blank" rel="noopener noreferrer" title={titulo}
      className="inline-flex items-center gap-0.5 text-[11px] text-neutral-500 hover:text-white ml-1 align-middle px-1 py-2 -my-2 md:p-0 md:my-0">
      <MapPin size={11} />{u.distancia_m != null ? formatearDistancia(u.distancia_m) : ''}
    </a>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
    <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] sm:text-xs leading-tight text-neutral-500 uppercase tracking-wider sm:truncate">{label}</p>
      <p className={`text-lg sm:text-xl font-bold ${color} truncate`}>{value}</p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------

const ActivasPanel = ({ activas, cargando, onCerrar, onEditar }) => {
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  if (cargando && activas.length === 0) {
    return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>;
  }
  if (activas.length === 0) {
    return (
      <div className="card p-10 text-center">
        <UserCheck className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
        <p className="text-neutral-400">Nadie está marcado como trabajando en este momento.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {activas.map((a) => {
        const horas = horasDesde(a.entrada, ahora);
        const alerta = horas >= HORAS_ALERTA_ABIERTA;
        return (
          <div key={a.id} className={`card p-4 ${alerta ? 'border-amber-500/40' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{a.empleado_nombre}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Entrada {formatearFechaCorta(a.entrada)} a las {formatearHoraCorta(a.entrada)} <OrigenBadge origen={a.origen_entrada} />
                </p>
              </div>
              <span className={`flex items-center gap-1.5 text-sm font-semibold tabular-nums whitespace-nowrap shrink-0 ${alerta ? 'text-amber-300' : 'text-emerald-300'}`}>
                <span className={`w-2 h-2 rounded-full ${alerta ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                {formatearDuracion(horas)}
              </span>
            </div>
            {alerta && (
              <p className="flex items-center gap-1.5 text-xs text-amber-300/90 mt-2">
                <TriangleAlert size={13} /> Más de {HORAS_ALERTA_ABIERTA} h abierta: ¿olvidó marcar la salida?
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button className="btn-secondary btn-sm flex-1" onClick={() => onCerrar(a)}>
                <LogOut size={14} /> Marcar salida ahora
              </button>
              <button className="btn-ghost btn-sm" onClick={() => onEditar(a)} title="Corregir horas">
                <Pencil size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------

const AsistenciasAdmin = () => {
  const [tab, setTab] = useState('activas');
  const [empleados, setEmpleados] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [activas, setActivas] = useState([]);
  const [cargandoActivas, setCargandoActivas] = useState(true);

  const [filtros, setFiltros] = useState({ desde: haceDiasISO(6), hasta: hoyISO(), empleado_id: '', estado: '' });
  const [historial, setHistorial] = useState({ data: [], total: 0, totalPages: 1, page: 1, resumen: { abiertas: 0, horasCerradas: 0 } });
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [exportando, setExportando] = useState(false);

  const [modalForm, setModalForm] = useState(null); // { asistencia } | { asistencia: null }
  const [modalConvertir, setModalConvertir] = useState(null);
  const [modalQr, setModalQr] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const mostrarAviso = (msg) => {
    setAviso(msg);
    setTimeout(() => setAviso(''), 4000);
  };

  const cargarEmpleados = useCallback(async () => {
    try {
      const res = await api.get('/empleados');
      setEmpleados(res.data);
    } catch (err) {
      setError('No se pudieron cargar los empleados');
    }
  }, []);

  const cargarActivas = useCallback(async () => {
    try {
      setCargandoActivas(true);
      const res = await api.get('/asistencias/activas');
      setActivas(res.data);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las asistencias activas'));
    } finally {
      setCargandoActivas(false);
    }
  }, []);

  const parametrosFiltro = useCallback(() => {
    const p = {};
    Object.entries(filtros).forEach(([k, v]) => { if (v) p[k] = v; });
    return p;
  }, [filtros]);

  const cargarHistorial = useCallback(async (page = 1) => {
    if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
      setError('La fecha "desde" no puede ser mayor que "hasta"');
      return;
    }
    try {
      setCargandoHistorial(true);
      setError('');
      const res = await api.get('/asistencias', { params: { ...parametrosFiltro(), page } });
      setHistorial(res.data);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo cargar el historial'));
    } finally {
      setCargandoHistorial(false);
    }
  }, [filtros, parametrosFiltro]);

  useEffect(() => {
    cargarEmpleados();
    cargarActivas();
    api.get('/empresas').then((r) => setEmpresas(r.data)).catch(() => {});
    const t = setInterval(cargarActivas, 60000);
    return () => clearInterval(t);
  }, [cargarEmpleados, cargarActivas]);

  useEffect(() => {
    if (tab === 'historial') cargarHistorial(1);
    // Solo al entrar al tab; los cambios de filtro se aplican con "Buscar"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const refrescarTodo = () => {
    cargarActivas();
    if (tab === 'historial') cargarHistorial(historial.page);
  };

  // --- Acciones ---

  const cerrarAhora = async (a) => {
    if (!window.confirm(`¿Registrar la salida de ${a.empleado_nombre} con la hora actual?`)) return;
    try {
      await api.post(`/asistencias/${a.id}/cerrar`, { observacion: a.observacion || 'Salida registrada por el administrador' });
      mostrarAviso(`Salida registrada para ${a.empleado_nombre}`);
      refrescarTodo();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo registrar la salida'));
    }
  };

  const eliminar = async (a) => {
    if (!window.confirm(`¿Eliminar la asistencia de ${a.empleado_nombre} del ${formatearFechaISO(a.fecha)}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/asistencias/${a.id}`);
      mostrarAviso('Asistencia eliminada');
      refrescarTodo();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo eliminar la asistencia'));
    }
  };

  const exportarExcel = async () => {
    try {
      setExportando(true);
      const res = await api.get('/asistencias/excel', { params: parametrosFiltro(), responseType: 'blob' });
      const label = filtros.desde && filtros.hasta ? `${filtros.desde}_a_${filtros.hasta}` : 'completo';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `asistencias_${label}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('No se pudo exportar a Excel');
    } finally {
      setExportando(false);
    }
  };

  const abrirKiosco = () => window.open('/asistencia', '_blank', 'noopener');

  // --- Render ---

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="icon-tile">
            <Fingerprint className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="page-title">Control de asistencia</h1>
            <p className="text-sm text-neutral-400">Entradas y salidas marcadas por los trabajadores</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <button className="btn-ghost hidden sm:inline-flex" onClick={refrescarTodo} title="Actualizar" aria-label="Actualizar"><RefreshCw size={16} /></button>
          <button className="btn-secondary" onClick={() => setModalQr(true)}><QrCode size={16} /> Código QR</button>
          <button className="btn-secondary" onClick={abrirKiosco}><ExternalLink size={16} /> Abrir kiosco</button>
          <button className="btn-primary col-span-2 sm:col-auto" onClick={() => setModalForm({ asistencia: null })}><Plus size={16} /> Registro manual</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard icon={UserCheck} label="Trabajando ahora" value={activas.length} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard
          icon={TriangleAlert}
          label={`Abiertas > ${HORAS_ALERTA_ABIERTA} h`}
          value={activas.filter((a) => horasDesde(a.entrada) >= HORAS_ALERTA_ABIERTA).length}
          color="text-amber-400" bg="bg-amber-500/10"
        />
        <StatCard
          icon={KeyRound}
          label="Con PIN de kiosco"
          value={`${empleados.filter((e) => e.tiene_pin).length} / ${empleados.length}`}
          color="text-white" bg="bg-white/[0.06]"
        />
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

      <div className="flex gap-1 border-b border-neutral-800/60 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            role="tab"
            aria-selected={tab === id}
            className={`flex items-center gap-2 px-4 py-3 sm:py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
              tab === id ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Icon size={16} /> {label}
            {id === 'activas' && activas.length > 0 && <span className="badge-emerald">{activas.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'activas' && (
        <ActivasPanel
          activas={activas}
          cargando={cargandoActivas}
          onCerrar={cerrarAhora}
          onEditar={(a) => setModalForm({ asistencia: a })}
        />
      )}

      {tab === 'ubicacion' && <GeocercaConfig onError={setError} />}

      {tab === 'pins' && (
        <PinsEmpleados empleados={empleados} onCambio={cargarEmpleados} onError={setError} />
      )}

      {tab === 'historial' && (
        <div className="space-y-4">
          <div className="card p-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
            <div>
              <label className="label">Desde</label>
              <input type="date" className="input py-1.5 text-xs" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} />
            </div>
            <div>
              <label className="label">Hasta</label>
              <input type="date" className="input py-1.5 text-xs" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} />
            </div>
            <div>
              <label className="label">Empleado</label>
              <select className="select py-1.5 text-xs w-full sm:w-48" value={filtros.empleado_id} onChange={(e) => setFiltros({ ...filtros, empleado_id: e.target.value })}>
                <option value="">Todos</option>
                {empleados.map((emp) => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="select py-1.5 text-xs w-full sm:w-36" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
                <option value="">Todas</option>
                <option value="abiertas">En curso</option>
                <option value="cerradas">Cerradas</option>
              </select>
            </div>
            <button className="btn-primary btn-sm py-2" onClick={() => cargarHistorial(1)} disabled={cargandoHistorial}>
              <Search size={14} /> Buscar
            </button>
            <button className="btn-secondary btn-sm py-2 sm:ml-auto" onClick={exportarExcel} disabled={exportando || historial.total === 0}>
              <FileSpreadsheet size={14} /> {exportando ? 'Exportando…' : 'Excel'}
            </button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
            <span><b className="text-white">{historial.total}</b> registros</span>
            <span><b className="text-white">{formatearDuracion(historial.resumen.horasCerradas)}</b> trabajadas (cerradas)</span>
            {historial.resumen.abiertas > 0 && <span><b className="text-emerald-300">{historial.resumen.abiertas}</b> en curso</span>}
          </div>

          {/* Celular: tarjetas */}
          <ul className="md:hidden space-y-3" aria-label="Historial de asistencia">
            {cargandoHistorial && historial.data.length === 0 && <li className="skeleton h-28 rounded-xl" />}
            {!cargandoHistorial && historial.data.length === 0 && (
              <li className="card p-8 text-center text-neutral-500 text-sm">No hay asistencias para estos filtros</li>
            )}
            {historial.data.map((a) => (
              <li key={a.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{a.empleado_nombre}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{formatearFechaISO(a.fecha)}</p>
                  </div>
                  {a.turno_id
                    ? <span className="badge-brand shrink-0">Turno #{a.turno_id}</span>
                    : a.abierta
                      ? <span className="badge-emerald shrink-0">En curso</span>
                      : <span className="badge bg-neutral-800 text-neutral-300 border border-neutral-700 shrink-0">Cerrada</span>}
                </div>
                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-neutral-500">Entrada</dt>
                    <dd className="text-neutral-100 tabular-nums">{formatearHoraCorta(a.entrada)}</dd>
                    <dd className="mt-1 flex flex-wrap items-center gap-1"><OrigenBadge origen={a.origen_entrada} /><UbicacionBadge u={a.ubicacion_entrada} /></dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-neutral-500">Salida</dt>
                    <dd className="text-neutral-100 tabular-nums">
                      {a.salida ? formatearHoraCorta(a.salida) : '—'}
                      {a.salida && formatearFechaCorta(a.salida) !== formatearFechaCorta(a.entrada) && <span className="text-xs text-neutral-500 ml-1">+1</span>}
                    </dd>
                    {a.salida && <dd className="mt-1 flex flex-wrap items-center gap-1"><OrigenBadge origen={a.origen_salida} /><UbicacionBadge u={a.ubicacion_salida} /></dd>}
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-neutral-500">Horas</dt>
                    <dd className="text-neutral-100 tabular-nums">{formatearDuracion(a.horas)}</dd>
                  </div>
                </dl>
                {a.observacion && (
                  <p className="text-xs text-neutral-400 flex gap-1.5"><MessageSquare size={13} className="shrink-0 mt-0.5" /> {a.observacion}</p>
                )}
                <div className="flex gap-2">
                  {!a.turno_id && !a.abierta && (
                    <button className="btn-secondary btn-sm flex-1" onClick={() => setModalConvertir(a)}>
                      <ArrowRightLeft size={14} /> Convertir en turno
                    </button>
                  )}
                  {a.abierta && (
                    <button className="btn-secondary btn-sm flex-1" onClick={() => cerrarAhora(a)}>
                      <LogOut size={14} /> Marcar salida
                    </button>
                  )}
                  {!a.turno_id && (
                    <button className="btn-ghost btn-sm" onClick={() => setModalForm({ asistencia: a })} aria-label={`Corregir asistencia de ${a.empleado_nombre}`}>
                      <Pencil size={16} />
                    </button>
                  )}
                  <button className="btn-ghost btn-sm text-red-400" onClick={() => eliminar(a)} aria-label={`Eliminar asistencia de ${a.empleado_nombre}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Tablet y escritorio: tabla */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-800/60">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3">Entrada</th>
                  <th className="px-4 py-3">Salida</th>
                  <th className="px-4 py-3">Horas</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                {cargandoHistorial && historial.data.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8"><div className="skeleton h-6" /></td></tr>
                )}
                {!cargandoHistorial && historial.data.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-neutral-500">No hay asistencias para estos filtros</td></tr>
                )}
                {historial.data.map((a) => (
                  <tr key={a.id} className="hover:bg-neutral-800/20">
                    <td className="px-4 py-3 text-neutral-300 whitespace-nowrap">{formatearFechaISO(a.fecha)}</td>
                    <td className="px-4 py-3 text-white">
                      {a.empleado_nombre}
                      {a.observacion && (
                        <span title={a.observacion} aria-label={`Observación: ${a.observacion}`} className="cursor-help">
                          <MessageSquare size={13} className="inline ml-1.5 text-neutral-500" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-neutral-200 tabular-nums">{formatearHoraCorta(a.entrada)}</span> <OrigenBadge origen={a.origen_entrada} /><UbicacionBadge u={a.ubicacion_entrada} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.salida ? (
                        <>
                          <span className="text-neutral-200 tabular-nums">{formatearHoraCorta(a.salida)}</span>
                          {formatearFechaCorta(a.salida) !== formatearFechaCorta(a.entrada) && (
                            <span className="text-xs text-neutral-500 ml-1">(+1 día)</span>
                          )}{' '}
                          <OrigenBadge origen={a.origen_salida} /><UbicacionBadge u={a.ubicacion_salida} />
                        </>
                      ) : <span className="text-neutral-600">—</span>}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-neutral-200 whitespace-nowrap">
                      <Clock size={13} className="inline mr-1 text-neutral-500" />{formatearDuracion(a.horas)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.turno_id
                        ? <span className="badge-brand">Turno #{a.turno_id}</span>
                        : a.abierta
                          ? <span className="badge-emerald">En curso</span>
                          : <span className="badge bg-neutral-800 text-neutral-300 border border-neutral-700">Cerrada</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {!a.turno_id && !a.abierta && (
                          <button className="btn-ghost btn-xs text-white" onClick={() => setModalConvertir(a)} title="Convertir en turno">
                            <ArrowRightLeft size={14} /> Turno
                          </button>
                        )}
                        {a.abierta && (
                          <button className="btn-ghost btn-xs" onClick={() => cerrarAhora(a)} title="Marcar salida ahora"><LogOut size={14} /></button>
                        )}
                        {!a.turno_id && (
                          <button className="btn-ghost btn-xs" onClick={() => setModalForm({ asistencia: a })} title="Corregir"><Pencil size={14} /></button>
                        )}
                        <button className="btn-ghost btn-xs text-red-400 hover:text-red-300" onClick={() => eliminar(a)} title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {historial.totalPages > 1 && (
            <div className="flex items-center justify-between sm:justify-center gap-3">
              <button className="btn-secondary btn-sm" disabled={historial.page <= 1 || cargandoHistorial} onClick={() => cargarHistorial(historial.page - 1)}>
                <ChevronLeft size={14} /> Anterior
              </button>
              <span className="text-sm text-neutral-400">Página {historial.page} de {historial.totalPages}</span>
              <button className="btn-secondary btn-sm" disabled={historial.page >= historial.totalPages || cargandoHistorial} onClick={() => cargarHistorial(historial.page + 1)}>
                Siguiente <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {modalForm && (
        <AsistenciaFormModal
          asistencia={modalForm.asistencia}
          empleados={empleados}
          onClose={() => setModalForm(null)}
          onGuardado={() => {
            mostrarAviso(modalForm.asistencia ? 'Asistencia corregida' : 'Asistencia registrada');
            setModalForm(null);
            refrescarTodo();
          }}
        />
      )}
      {modalQr && <QrKioscoModal onClose={() => setModalQr(false)} />}
      {modalConvertir && (
        <ConvertirTurnoModal
          asistencia={modalConvertir}
          empresas={empresas}
          onClose={() => setModalConvertir(null)}
          onConvertido={({ turno }) => {
            mostrarAviso(`Turno #${turno.id} creado. Ya aparece en "Todos los turnos".`);
            setModalConvertir(null);
            refrescarTodo();
          }}
        />
      )}
    </div>
  );
};

export default AsistenciasAdmin;
