import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Pencil, Trash2, Check, X, Search, CalendarRange, ClipboardList, CircleAlert,
} from 'lucide-react';
import api from '../../api';
import { mensajeError } from '../../helpers/asistencia';

const ordenar = (lista) => [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

const EmpresasAdmin = () => {
  const navigate = useNavigate();
  const inputNueva = useRef(null);
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nueva, setNueva] = useState('');
  const [creando, setCreando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const mostrarAviso = (msg) => {
    setAviso(msg);
    setTimeout(() => setAviso(''), 4000);
  };

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const res = await api.get('/empresas');
      setEmpresas(res.data);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las empresas'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const crear = async (e) => {
    e.preventDefault();
    const nombre = nueva.trim();
    if (!nombre) return;
    try {
      setCreando(true);
      setError('');
      const res = await api.post('/empresas', { nombre });
      setEmpresas((prev) => ordenar([...prev, { total_eventos: 0, total_turnos: 0, ...res.data }]));
      setNueva('');
      mostrarAviso(`Empresa "${res.data.nombre}" agregada`);
      inputNueva.current?.focus();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la empresa'));
    } finally {
      setCreando(false);
    }
  };

  const empezarEdicion = (emp) => {
    setEditandoId(emp.id);
    setEditandoNombre(emp.nombre);
  };

  const guardarNombre = async (emp) => {
    const nombre = editandoNombre.trim();
    if (!nombre) return setError('El nombre no puede quedar vacío');
    if (nombre === emp.nombre) return setEditandoId(null);
    try {
      setError('');
      await api.put(`/empresas/${emp.id}`, { nombre });
      setEmpresas((prev) => ordenar(prev.map((e) => (e.id === emp.id ? { ...e, nombre } : e))));
      setEditandoId(null);
      mostrarAviso('Nombre actualizado');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo renombrar la empresa'));
    }
  };

  const eliminar = async (emp) => {
    const turnos = emp.total_turnos > 0 ? ` Sus ${emp.total_turnos} turno(s) quedarán sin empresa.` : '';
    if (!window.confirm(`¿Eliminar la empresa "${emp.nombre}"?${turnos}`)) return;
    try {
      setError('');
      await api.delete(`/empresas/${emp.id}`);
      setEmpresas((prev) => prev.filter((e) => e.id !== emp.id));
      mostrarAviso('Empresa eliminada');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo eliminar la empresa'));
    }
  };

  const filtradas = empresas.filter((e) => e.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()));

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="icon-tile">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="page-title">Empresas</h1>
          <p className="text-sm text-neutral-400">Productoras para las que se trabaja. Cada evento y turno se asocia a una.</p>
        </div>
      </div>

      {/* Agregar: siempre a la vista, arriba de la lista */}
      <form onSubmit={crear} className="card p-4 sm:p-5">
        <label className="label" htmlFor="nueva-empresa">Agregar empresa</label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="nueva-empresa"
            ref={inputNueva}
            className="input flex-1"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            placeholder="Ej: Productora Andes"
            maxLength={200}
            autoFocus
          />
          <button type="submit" className="btn-primary" disabled={!nueva.trim() || creando}>
            <Plus size={16} /> {creando ? 'Agregando…' : 'Agregar'}
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          También puedes crearlas al vuelo con el botón <b className="text-neutral-300">Nueva</b> junto al selector de empresa
          al crear un evento o un turno.
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
        <p className="text-sm text-neutral-400"><b className="text-white">{empresas.length}</b> empresa(s)</p>
        {empresas.length > 5 && (
          <div className="relative">
            <Search size={14} className="text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input className="input py-1.5 text-xs pl-9 w-56" placeholder="Buscar empresa" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar empresa" />
          </div>
        )}
      </div>

      <div className="card divide-y divide-neutral-800/60">
        {cargando && empresas.length === 0 && <div className="p-4"><div className="skeleton h-10" /></div>}
        {!cargando && empresas.length === 0 && (
          <div className="p-10 text-center">
            <Building2 className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
            <p className="text-neutral-400">Aún no hay empresas. Agrega la primera arriba.</p>
          </div>
        )}
        {!cargando && empresas.length > 0 && filtradas.length === 0 && (
          <p className="px-4 py-6 text-sm text-neutral-500 text-center">Sin resultados</p>
        )}
        {filtradas.map((emp) => {
          const tieneEventos = emp.total_eventos > 0;
          return (
            <div key={emp.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              {editandoId === emp.id ? (
                <form className="flex flex-1 gap-2 min-w-[14rem]" onSubmit={(e) => { e.preventDefault(); guardarNombre(emp); }}>
                  <input
                    className="input py-1.5 flex-1"
                    value={editandoNombre}
                    onChange={(e) => setEditandoNombre(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditandoId(null); }}
                    maxLength={200}
                    aria-label={`Nuevo nombre para ${emp.nombre}`}
                    autoFocus
                  />
                  <button type="submit" className="btn-primary btn-sm"><Check size={14} /> Guardar</button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setEditandoId(null)} aria-label="Cancelar"><X size={14} /></button>
                </form>
              ) : (
                <>
                  <div className="flex-1 min-w-[10rem]">
                    <p className="text-sm text-white font-medium">{emp.nombre}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 flex flex-wrap gap-x-3">
                      <span className="inline-flex items-center gap-1"><CalendarRange size={12} /> {emp.total_eventos ?? 0} evento(s)</span>
                      <span className="inline-flex items-center gap-1"><ClipboardList size={12} /> {emp.total_turnos ?? 0} turno(s)</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {tieneEventos && (
                      <button className="btn-ghost btn-sm" onClick={() => navigate(`/eventos?empresa=${emp.id}`)}>
                        <CalendarRange size={14} /> Ver eventos
                      </button>
                    )}
                    <button className="btn-ghost btn-sm" onClick={() => empezarEdicion(emp)} aria-label={`Renombrar ${emp.nombre}`} title="Renombrar">
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn-ghost btn-sm text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={() => eliminar(emp)}
                      disabled={tieneEventos}
                      aria-label={`Eliminar ${emp.nombre}`}
                      title={tieneEventos ? 'Tiene eventos: elimínalos o cámbialos de empresa primero' : 'Eliminar'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmpresasAdmin;
