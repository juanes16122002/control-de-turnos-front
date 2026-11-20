import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HardHat, Plus, X, Check, UserCheck, Search, Settings2 } from 'lucide-react';

/**
 * Lista lateral de técnicos en "Agregar turno": sirve para elegir a quién se le cargan turnos
 * y para agregar uno rápido. Editar tarifas o eliminar se hace en la sección Técnicos.
 */
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
}) => {
  const [busqueda, setBusqueda] = useState('');
  const filtrados = empleados.filter((e) => e.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()));

  return (
    <aside className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-neutral-800/50 bg-neutral-900/30 flex flex-col shrink-0" aria-label="Técnicos">
      <div className="p-4 border-b border-neutral-800/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/15 flex items-center justify-center">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-200">Técnicos</h2>
              <p className="text-[11px] text-neutral-500">{empleados.length} técnico{empleados.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => setMostrandoFormEmpleado((v) => !v)} className="btn-primary btn-xs">
            <Plus size={14} /> Nuevo
          </button>
        </div>

        {mostrandoFormEmpleado && (
          <form onSubmit={onCrearEmpleado} className="glass rounded-xl p-3 animate-slide-down space-y-2">
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setMostrandoFormEmpleado(false); setNuevoNombre(''); } }}
              placeholder="Nombre y apellido del técnico"
              aria-label="Nombre del nuevo técnico"
              className="input text-xs"
              maxLength={200}
              autoFocus
            />
            <div className="flex gap-2">
              <button type="submit" disabled={cargandoNuevo || !nuevoNombre.trim()} className="btn-success btn-xs flex-1">
                <Check size={12} /> {cargandoNuevo ? 'Creando…' : 'Crear y seleccionar'}
              </button>
              <button type="button" onClick={() => { setMostrandoFormEmpleado(false); setNuevoNombre(''); }} className="btn-ghost btn-xs" aria-label="Cancelar">
                <X size={12} />
              </button>
            </div>
          </form>
        )}

        {empleados.length > 6 && (
          <div className="relative">
            <Search size={14} className="text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input className="input py-1.5 text-xs pl-9" placeholder="Buscar técnico" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar técnico" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 max-h-[45vh] md:max-h-none">
        {cargandoEmpleados ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 w-full" />)}
          </div>
        ) : empleados.length === 0 ? (
          <div className="text-center py-8">
            <HardHat className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
            <p className="text-xs text-neutral-500">No hay técnicos registrados</p>
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-6">Sin resultados</p>
        ) : (
          filtrados.map((empleado) => {
            const estaSeleccionado = empleadoSeleccionado?.id === empleado.id;
            return (
              <button
                key={empleado.id}
                onClick={() => onSelectEmpleado(empleado)}
                aria-current={estaSeleccionado ? 'true' : undefined}
                className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 border animate-fade-in ${
                  estaSeleccionado
                    ? 'bg-white/[0.06] border-white/15 shadow-sm'
                    : 'bg-neutral-900/40 border-transparent hover:bg-neutral-800/40 hover:border-neutral-700/30'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  estaSeleccionado ? 'bg-white/10 text-white' : 'bg-neutral-800 text-neutral-400 group-hover:bg-neutral-700'
                }`}>
                  {empleado.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-sm font-medium truncate block ${estaSeleccionado ? 'text-white' : 'text-neutral-300'}`}>
                    {empleado.nombre}
                  </span>
                  {empleado.tarifa_hora != null && (
                    <span className="text-[10px] text-neutral-500">${Number(empleado.tarifa_hora).toLocaleString('es-CL')}/h</span>
                  )}
                </div>
                {estaSeleccionado && <UserCheck className="w-3.5 h-3.5 text-white shrink-0" />}
              </button>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-neutral-800/30">
        <Link to="/tecnicos" className="btn-ghost btn-sm w-full justify-center" title="Editar tarifas, eliminar y ver la actividad de cada técnico">
          <Settings2 size={14} /> Gestionar técnicos
        </Link>
      </div>
    </aside>
  );
};

export default EmpleadosSidebar;
