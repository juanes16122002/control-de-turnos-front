// src/components/EmpleadosSidebar.js
import React, { useState } from 'react';

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
  // 🔹 nuevas props (opcionales)
  onRenombrarEmpleado,       // función (id, nuevoNombre)
  empleadoRenombrandoId,     // id que se está renombrando (para deshabilitar)
}) => {
  const [editandoId, setEditandoId] = useState(null);
  const [nombreEditando, setNombreEditando] = useState('');

  const handleSubmitNuevo = (e) => {
    onCrearEmpleado(e);
  };

  const empezarEdicion = (empleado) => {
    setEditandoId(empleado.id);
    setNombreEditando(empleado.nombre);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNombreEditando('');
  };

  const handleGuardarEdicion = async (empleadoId) => {
    if (!nombreEditando.trim()) return;
    if (onRenombrarEmpleado) {
      await onRenombrarEmpleado(empleadoId, nombreEditando.trim());
    }
    cancelarEdicion();
  };

  return (
    <aside className="w-full md:w-1/4 border-r border-zinc-800 bg-zinc-950/60 backdrop-blur p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Empleados</h2>
        <button
          onClick={() => setMostrandoFormEmpleado((v) => !v)}
          className="text-xs px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
        >
          + Agregar
        </button>
      </div>

      {/* Formulario para nuevo empleado */}
      {mostrandoFormEmpleado && (
        <form onSubmit={handleSubmitNuevo} className="mb-4 space-y-2">
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Nombre del empleado"
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={cargandoNuevo || !nuevoNombre.trim()}
              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-sm font-medium"
            >
              {cargandoNuevo ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrandoFormEmpleado(false);
                setNuevoNombre('');
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargandoEmpleados ? (
        <p className="text-sm text-zinc-400">Cargando empleados...</p>
      ) : (
        <ul className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
          {empleados.map((empleado) => {
            const enEdicion = editandoId === empleado.id;
            const estaEliminando = empleadoEliminandoId === empleado.id;
            const estaRenombrando = empleadoRenombrandoId === empleado.id;

            return (
              <li key={empleado.id}>
                <div className="flex flex-col gap-1 bg-zinc-900/70 rounded-lg p-2">
                  {!enEdicion ? (
                    // Vista normal (sin edición)
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectEmpleado(empleado)}
                        className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          empleadoSeleccionado?.id === empleado.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200'
                        }`}
                      >
                        {empleado.nombre}
                      </button>

                      {/* Botón editar nombre */}
                      <button
                        type="button"
                        onClick={() => empezarEdicion(empleado)}
                        className="px-2 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-[11px]"
                      >
                        ✏️
                      </button>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => onEliminarEmpleado(empleado.id)}
                        disabled={estaEliminando}
                        className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-[11px]"
                      >
                        {estaEliminando ? '...' : 'X'}
                      </button>
                    </div>
                  ) : (
                    // Modo edición del nombre
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={nombreEditando}
                        onChange={(e) => setNombreEditando(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleGuardarEdicion(empleado.id)}
                          disabled={estaRenombrando || !nombreEditando.trim()}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-xs font-medium"
                        >
                          {estaRenombrando ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelarEdicion}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}

          {empleados.length === 0 && !cargandoEmpleados && (
            <li className="text-sm text-zinc-400">
              No hay empleados registrados.
            </li>
          )}
        </ul>
      )}
    </aside>
  );
};

export default EmpleadosSidebar;
