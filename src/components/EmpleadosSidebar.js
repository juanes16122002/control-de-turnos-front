import React, { useState } from 'react';
import { Users, Plus, X, Check, Pencil, Trash2, UserCheck, DollarSign } from 'lucide-react';

const EmpleadosSidebar = ({
  empleados,
  empleadoSeleccionado,
  cargandoEmpleados,
  mostrandoFormEmpleado,
  setMostrandoFormEmpleado,
  nuevoNombre,
  setNuevoNombre,
  cargandoNuevo,
  onCrearEmpleado,
  onSelectEmpleado,
  onEliminarEmpleado,
  empleadoEliminandoId,
  onRenombrarEmpleado,
  empleadoRenombrandoId,
  onActualizarEmpleado,
}) => {
  const [editandoId, setEditandoId] = useState(null);
  const [nombreEditando, setNombreEditando] = useState('');
  const [tarifaHoraEditando, setTarifaHoraEditando] = useState('');
  const [tarifaHoraExtraEditando, setTarifaHoraExtraEditando] = useState('');

  const handleSubmitNuevo = (e) => {
    onCrearEmpleado(e);
  };

  const empezarEdicion = (empleado) => {
    setEditandoId(empleado.id);
    setNombreEditando(empleado.nombre);
    setTarifaHoraEditando(empleado.tarifa_hora ?? '');
    setTarifaHoraExtraEditando(empleado.tarifa_hora_extra ?? '');
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNombreEditando('');
    setTarifaHoraEditando('');
    setTarifaHoraExtraEditando('');
  };

  const handleGuardarEdicion = async (empleadoId) => {
    const payload = {};
    if (nombreEditando.trim()) payload.nombre = nombreEditando.trim();
    if (tarifaHoraEditando !== '') payload.tarifa_hora = Number(tarifaHoraEditando);
    if (tarifaHoraExtraEditando !== '') payload.tarifa_hora_extra = Number(tarifaHoraExtraEditando);

    if (Object.keys(payload).length === 0) return;

    if (onActualizarEmpleado) {
      await onActualizarEmpleado(empleadoId, payload);
    } else if (payload.nombre && onRenombrarEmpleado) {
      await onRenombrarEmpleado(empleadoId, payload.nombre);
    }
    cancelarEdicion();
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 border-r border-slate-800/50 bg-slate-900/30 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-sm font-semibold text-slate-200">Empleados</h2>
          </div>
          <button
            onClick={() => setMostrandoFormEmpleado((v) => !v)}
            className="btn-primary btn-xs"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>
        <p className="text-[11px] text-slate-500 ml-[42px]">
          {empleados.length} empleado{empleados.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {mostrandoFormEmpleado && (
          <form onSubmit={handleSubmitNuevo} className="glass rounded-xl p-3 mb-3 animate-slide-down space-y-2">
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Nombre del empleado"
              className="input text-xs"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={cargandoNuevo || !nuevoNombre.trim()}
                className="btn-success btn-xs flex-1"
              >
                {cargandoNuevo ? (
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <Check size={12} /> Guardar
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setMostrandoFormEmpleado(false); setNuevoNombre(''); }}
                className="btn-ghost btn-xs"
              >
                <X size={12} />
              </button>
            </div>
          </form>
        )}

        {cargandoEmpleados ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : empleados.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No hay empleados registrados</p>
          </div>
        ) : (
          empleados.map((empleado) => {
            const enEdicion = editandoId === empleado.id;
            const estaSeleccionado = empleadoSeleccionado?.id === empleado.id;
            const estaEliminando = empleadoEliminandoId === empleado.id;
            const estaRenombrando = empleadoRenombrandoId === empleado.id;

            return (
              <div key={empleado.id} className="animate-fade-in">
                {!enEdicion ? (
                  <div
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                      estaSeleccionado
                        ? 'bg-indigo-500/10 border-indigo-500/20 shadow-sm'
                        : 'bg-slate-900/40 border-transparent hover:bg-slate-800/40 hover:border-slate-700/30'
                    }`}
                  >
                    <button
                      onClick={() => onSelectEmpleado(empleado)}
                      className="flex-1 flex items-center gap-2.5 min-w-0"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          estaSeleccionado
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                        }`}
                      >
                        {empleado.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-sm font-medium truncate block ${estaSeleccionado ? 'text-indigo-200' : 'text-slate-300'}`}>
                          {empleado.nombre}
                        </span>
                        {empleado.tarifa_hora && (
                          <span className="text-[10px] text-slate-500">
                            ${Number(empleado.tarifa_hora).toLocaleString('es-CL')}/h
                          </span>
                        )}
                      </div>
                    </button>

                    {estaSeleccionado && <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => empezarEdicion(empleado)}
                        className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-500 hover:text-amber-400 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => onEliminarEmpleado(empleado.id)}
                        disabled={estaEliminando}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        {estaEliminando ? (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="glass rounded-xl p-3 animate-scale-in space-y-2">
                    <input
                      type="text"
                      value={nombreEditando}
                      onChange={(e) => setNombreEditando(e.target.value)}
                      className="input text-xs"
                      placeholder="Nombre"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400 font-medium mb-1 block">Tarifa hora normal</label>
                        <div className="relative">
                          <DollarSign className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" size={12} />
                          <input
                            type="number"
                            value={tarifaHoraEditando}
                            onChange={(e) => setTarifaHoraEditando(e.target.value)}
                            className="input text-xs pl-7"
                            placeholder="Ej: 4750"
                            min="0"
                            step="100"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-400 font-medium mb-1 block">Tarifa hora extra</label>
                        <div className="relative">
                          <DollarSign className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" size={12} />
                          <input
                            type="number"
                            value={tarifaHoraExtraEditando}
                            onChange={(e) => setTarifaHoraExtraEditando(e.target.value)}
                            className="input text-xs pl-7"
                            placeholder="Ej: 4750"
                            min="0"
                            step="100"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleGuardarEdicion(empleado.id)}
                        disabled={estaRenombrando}
                        className="btn-success btn-xs flex-1"
                      >
                        {estaRenombrando ? (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <><Check size={12} /> Guardar</>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={cancelarEdicion}
                        className="btn-ghost btn-xs"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default EmpleadosSidebar;
