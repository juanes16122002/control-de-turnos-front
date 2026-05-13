import React, { useState } from 'react';
import { Pencil, Trash2, Plus, X, Check, CalendarDays, Building2, FileSpreadsheet, FileText } from 'lucide-react';

const TurnoFiltersBar = ({
  empleadoSeleccionado,
  empresas,
  empresaFiltro,
  setEmpresaFiltro,
  mesSeleccionado,
  setMesSeleccionado,
  fechaDesdeExport,
  setFechaDesdeExport,
  fechaHastaExport,
  setFechaHastaExport,
  onClickAgregarTurno,
  onExportExcel,
  onExportPDF,
  puedeExportar,
  nuevaEmpresa,
  setNuevaEmpresa,
  editandoEmpresaId,
  setEditandoEmpresaId,
  editandoEmpresaNombre,
  setEditandoEmpresaNombre,
  onCrearEmpresa,
  onRenombrarEmpresa,
  onEliminarEmpresa,
}) => {
  const [gestionando, setGestionando] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <CalendarDays className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
            <input
              id="mes"
              type="month"
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="input input-icon py-1.5 text-xs w-40"
            />
          </div>
        </div>

        <div className="relative">
          <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
          <select
            value={empresaFiltro}
            onChange={(e) => setEmpresaFiltro(e.target.value)}
            className="select py-1.5 text-xs w-40 pl-10"
          >
            <option value="">Todas las empresas</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.nombre}</option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-slate-700/50 hidden md:block" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={fechaDesdeExport}
              onChange={(e) => setFechaDesdeExport(e.target.value)}
              className="input py-1.5 text-xs w-36"
              placeholder="Desde"
            />
            <span className="text-slate-600 text-xs">a</span>
            <input
              type="date"
              value={fechaHastaExport}
              onChange={(e) => setFechaHastaExport(e.target.value)}
              className="input py-1.5 text-xs w-36"
              placeholder="Hasta"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClickAgregarTurno}
            disabled={!empleadoSeleccionado}
            className="btn-success btn-sm"
          >
            <Plus size={14} />
            Agregar turno
          </button>

          <div className="flex gap-1">
            <button
              onClick={onExportExcel}
              disabled={!puedeExportar}
              className="btn-secondary btn-xs"
            >
              <FileSpreadsheet size={14} />
              Excel
            </button>
            <button
              onClick={onExportPDF}
              disabled={!puedeExportar}
              className="btn-secondary btn-xs"
            >
              <FileText size={14} />
              PDF
            </button>
          </div>

          <button
            onClick={() => setGestionando(!gestionando)}
            className={`btn-ghost btn-xs ${gestionando ? 'text-indigo-400' : ''}`}
          >
            <Building2 size={14} />
            Empresas
          </button>
        </div>
      </div>

      {gestionando && (
        <div className="glass rounded-xl p-4 animate-slide-down">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Gestionar empresas</h3>
            <button onClick={() => setGestionando(false)} className="btn-ghost btn-xs">
              <X size={12} />
            </button>
          </div>

          <form onSubmit={onCrearEmpresa} className="flex gap-2 mb-4">
            <input
              type="text"
              value={nuevaEmpresa}
              onChange={(e) => setNuevaEmpresa(e.target.value)}
              placeholder="Nombre de la nueva empresa"
              className="input text-xs flex-1"
            />
            <button type="submit" disabled={!nuevaEmpresa.trim()} className="btn-success btn-xs">
              <Plus size={14} /> Agregar
            </button>
          </form>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {empresas.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No hay empresas registradas</p>
            ) : (
              empresas.map((emp) => (
                <div key={emp.id} className="flex items-center gap-2 bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/30">
                  {editandoEmpresaId === emp.id ? (
                    <>
                      <input
                        type="text"
                        value={editandoEmpresaNombre}
                        onChange={(e) => setEditandoEmpresaNombre(e.target.value)}
                        className="input text-xs flex-1"
                        autoFocus
                      />
                      <button onClick={() => onRenombrarEmpresa(emp.id)} className="btn-ghost btn-xs text-emerald-400">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditandoEmpresaId(null)} className="btn-ghost btn-xs">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-slate-300">{emp.nombre}</span>
                      <button
                        onClick={() => { setEditandoEmpresaId(emp.id); setEditandoEmpresaNombre(emp.nombre); }}
                        className="btn-ghost btn-xs text-amber-400"
                      >
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => onEliminarEmpresa(emp.id)} className="btn-ghost btn-xs text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TurnoFiltersBar;
