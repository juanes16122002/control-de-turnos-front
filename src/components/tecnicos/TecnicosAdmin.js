import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HardHat, Plus, Pencil, Trash2, Check, X, Search, CalendarRange, ClipboardList, Fingerprint,
  CircleAlert, ShieldCheck, ShieldOff, DollarSign,
} from 'lucide-react';
import api from '../../api';
import { mensajeError } from '../../helpers/asistencia';

const ordenar = (lista) => [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
const pesos = (v) => (v == null ? '—' : `$${Number(v).toLocaleString('es-CL')}`);
const aNumero = (v) => (v === '' || v == null ? undefined : Number(v));

const CampoTarifa = ({ id, label, value, onChange }) => (
  <div>
    <label className="label" htmlFor={id}>{label}</label>
    <div className="relative">
      <DollarSign size={14} className="text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input id={id} type="number" min="0" step="50" inputMode="numeric" className="input pl-8" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Por defecto" />
    </div>
  </div>
);

const TecnicosAdmin = () => {
  const navigate = useNavigate();
  const inputNombre = useRef(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevo, setNuevo] = useState({ nombre: '', tarifa_hora: '', tarifa_hora_extra: '' });
  const [creando, setCreando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [edicion, setEdicion] = useState(null); // { id, nombre, tarifa_hora, tarifa_hora_extra }
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const mostrarAviso = (msg) => {
    setAviso(msg);
    setTimeout(() => setAviso(''), 4000);
  };

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const res = await api.get('/empleados');
      setTecnicos(res.data);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los técnicos'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const crear = async (e) => {
    e.preventDefault();
    const nombre = nuevo.nombre.trim();
    if (!nombre) return;
    try {
      setCreando(true);
      setError('');
      const res = await api.post('/empleados', {
        nombre,
        tarifa_hora: aNumero(nuevo.tarifa_hora),
        tarifa_hora_extra: aNumero(nuevo.tarifa_hora_extra),
      });
      setTecnicos((prev) => ordenar([...prev, { total_turnos: 0, total_eventos: 0, total_asistencias: 0, ...res.data }]));
      setNuevo({ nombre: '', tarifa_hora: '', tarifa_hora_extra: '' });
      mostrarAviso(`Técnico "${res.data.nombre}" agregado. Asígnale un PIN en Asistencia → PIN del kiosco para que pueda marcar.`);
      inputNombre.current?.focus();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear el técnico'));
    } finally {
      setCreando(false);
    }
  };

  const empezarEdicion = (t) => setEdicion({
    id: t.id,
    nombre: t.nombre,
    tarifa_hora: t.tarifa_hora ?? '',
    tarifa_hora_extra: t.tarifa_hora_extra ?? '',
  });

  const guardarEdicion = async (e) => {
    e.preventDefault();
    const nombre = edicion.nombre.trim();
    if (!nombre) return setError('El nombre no puede quedar vacío');
    const payload = { nombre };
    if (edicion.tarifa_hora !== '') payload.tarifa_hora = Number(edicion.tarifa_hora);
    if (edicion.tarifa_hora_extra !== '') payload.tarifa_hora_extra = Number(edicion.tarifa_hora_extra);
    try {
      setGuardando(true);
      setError('');
      const res = await api.put(`/empleados/${edicion.id}`, payload);
      setTecnicos((prev) => ordenar(prev.map((t) => (t.id === edicion.id ? { ...t, ...res.data } : t))));
      setEdicion(null);
      mostrarAviso('Técnico actualizado. Las tarifas nuevas se aplican a los turnos que se creen o editen desde ahora.');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo actualizar el técnico'));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (t) => {
    const perdidas = [
      t.total_turnos > 0 && `${t.total_turnos} turno(s)`,
      t.total_asistencias > 0 && `${t.total_asistencias} asistencia(s)`,
    ].filter(Boolean);
    const detalle = perdidas.length > 0
      ? `\n\nTambién se eliminarán ${perdidas.join(' y ')}. Esta acción no se puede deshacer.`
      : '\n\nEsta acción no se puede deshacer.';
    if (!window.confirm(`¿Eliminar al técnico "${t.nombre}"?${detalle}`)) return;
    try {
      setError('');
      await api.delete(`/empleados/${t.id}`);
      setTecnicos((prev) => prev.filter((x) => x.id !== t.id));
      mostrarAviso('Técnico eliminado');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo eliminar el técnico'));
    }
  };

  const filtrados = tecnicos.filter((t) => t.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()));

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="icon-tile">
          <HardHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="page-title">Técnicos</h1>
          <p className="text-sm text-neutral-400">Personal que trabaja en los eventos: sus tarifas, PIN del kiosco y actividad.</p>
        </div>
      </div>

      {/* Agregar: siempre a la vista, arriba de la lista */}
      <form onSubmit={crear} className="card p-4 sm:p-5 space-y-3">
        <p className="label mb-0">Agregar técnico</p>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem_10rem_auto] gap-3 sm:items-end">
          <div>
            <label className="label" htmlFor="tec-nombre">Nombre y apellido</label>
            <input
              id="tec-nombre"
              ref={inputNombre}
              className="input"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              placeholder="Ej: Camila Rojas"
              maxLength={200}
              autoFocus
            />
          </div>
          <CampoTarifa id="tec-tarifa" label="Tarifa hora" value={nuevo.tarifa_hora} onChange={(v) => setNuevo({ ...nuevo, tarifa_hora: v })} />
          <CampoTarifa id="tec-tarifa-extra" label="Tarifa hora extra" value={nuevo.tarifa_hora_extra} onChange={(v) => setNuevo({ ...nuevo, tarifa_hora_extra: v })} />
          <button type="submit" className="btn-primary" disabled={!nuevo.nombre.trim() || creando}>
            <Plus size={16} /> {creando ? 'Agregando…' : 'Agregar'}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          Las tarifas son opcionales (si las dejas vacías se usa la tarifa por defecto). También puedes crear técnicos
          al vuelo con <b className="text-neutral-300">Nuevo técnico</b> al asignar un evento o al registrar una asistencia.
        </p>
      </form>

      {error && (
        <div className="flex items-center justify-between gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <span className="flex items-center gap-2"><CircleAlert size={16} className="shrink-0" /> {error}</span>
          <button className="btn-ghost btn-xs" onClick={() => setError('')}>Cerrar</button>
        </div>
      )}
      {aviso && (
        <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 animate-slide-down">{aviso}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-400">
          <b className="text-white">{tecnicos.length}</b> técnico(s) · <b className="text-white">{tecnicos.filter((t) => t.tiene_pin).length}</b> con PIN
        </p>
        {tecnicos.length > 5 && (
          <div className="relative">
            <Search size={14} className="text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input className="input py-1.5 text-xs pl-9 w-56" placeholder="Buscar técnico" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar técnico" />
          </div>
        )}
      </div>

      <div className="card divide-y divide-neutral-800/60">
        {cargando && tecnicos.length === 0 && <div className="p-4"><div className="skeleton h-10" /></div>}
        {!cargando && tecnicos.length === 0 && (
          <div className="p-10 text-center">
            <HardHat className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-400">Aún no hay técnicos. Agrega el primero arriba.</p>
          </div>
        )}
        {!cargando && tecnicos.length > 0 && filtrados.length === 0 && (
          <p className="px-4 py-6 text-sm text-neutral-500 text-center">Sin resultados</p>
        )}
        {filtrados.map((t) => (
          <div key={t.id} className="px-4 py-3">
            {edicion?.id === t.id ? (
              <form onSubmit={guardarEdicion} onKeyDown={(e) => { if (e.key === 'Escape') setEdicion(null); }}
                className="grid grid-cols-1 sm:grid-cols-[1fr_9rem_9rem_auto] gap-3 sm:items-end">
                <div>
                  <label className="label" htmlFor={`ed-nombre-${t.id}`}>Nombre</label>
                  <input id={`ed-nombre-${t.id}`} className="input" value={edicion.nombre} maxLength={200}
                    onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })} autoFocus />
                </div>
                <CampoTarifa id={`ed-tarifa-${t.id}`} label="Tarifa hora" value={edicion.tarifa_hora} onChange={(v) => setEdicion({ ...edicion, tarifa_hora: v })} />
                <CampoTarifa id={`ed-extra-${t.id}`} label="Tarifa extra" value={edicion.tarifa_hora_extra} onChange={(v) => setEdicion({ ...edicion, tarifa_hora_extra: v })} />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary btn-sm" disabled={guardando}><Check size={14} /> {guardando ? 'Guardando…' : 'Guardar'}</button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setEdicion(null)} aria-label="Cancelar"><X size={14} /></button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[12rem]">
                  <p className="text-sm text-white font-medium flex items-center gap-2">
                    {t.nombre}
                    {t.tiene_pin
                      ? <span className="badge-emerald" title="Puede marcar en el kiosco"><ShieldCheck size={11} /> PIN</span>
                      : <span className="badge bg-neutral-800 text-neutral-400 border border-neutral-700" title="Sin PIN no aparece en el kiosco"><ShieldOff size={11} /> Sin PIN</span>}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>{pesos(t.tarifa_hora)}/h · extra {pesos(t.tarifa_hora_extra)}/h</span>
                    <span className="inline-flex items-center gap-1"><ClipboardList size={12} /> {t.total_turnos ?? 0} turno(s)</span>
                    <span className="inline-flex items-center gap-1"><CalendarRange size={12} /> {t.total_eventos ?? 0} evento(s)</span>
                    <span className="inline-flex items-center gap-1"><Fingerprint size={12} /> {t.total_asistencias ?? 0} asistencia(s)</span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="btn-ghost btn-sm" onClick={() => navigate(`/home?tecnico=${t.id}`)} title="Ver y agregar sus turnos">
                    <ClipboardList size={14} /> Turnos
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => empezarEdicion(t)} aria-label={`Editar ${t.nombre}`} title="Editar nombre y tarifas">
                    <Pencil size={14} />
                  </button>
                  <button className="btn-ghost btn-sm text-red-400 hover:text-red-300" onClick={() => eliminar(t)} aria-label={`Eliminar ${t.nombre}`} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TecnicosAdmin;
