import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, CalendarDays, Building2, FileSpreadsheet, FileText } from 'lucide-react';

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
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0 sm:flex-none">
            <CalendarDays className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
            <input
              id="mes"
              type="month"
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="input input-icon py-1.5 text-xs w-full sm:w-40"
            />
          </div>
        </div>

        <div className="relative">
          <Building2 className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
          <select
            value={empresaFiltro}
            onChange={(e) => setEmpresaFiltro(e.target.value)}
            className="select py-1.5 text-xs w-full sm:w-40 pl-10"
          >
            <option value="">Todas las empresas</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.nombre}</option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-neutral-700/50 hidden md:block" />

        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <input
              type="date"
              value={fechaDesdeExport}
              onChange={(e) => setFechaDesdeExport(e.target.value)}
              className="input py-1.5 text-xs w-full sm:w-36 min-w-0 flex-1"
              placeholder="Desde"
              aria-label="Exportar desde"
            />
            <span className="text-neutral-600 text-xs">a</span>
            <input
              type="date"
              value={fechaHastaExport}
              onChange={(e) => setFechaHastaExport(e.target.value)}
              className="input py-1.5 text-xs w-full sm:w-36 min-w-0 flex-1"
              placeholder="Hasta"
              aria-label="Exportar hasta"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <Link to="/empresas" className="btn-ghost btn-xs" title="Agregar, renombrar o eliminar empresas">
            <Building2 size={14} />
            Gestionar empresas
          </Link>
        </div>
      </div>

    </div>
  );
};

export default TurnoFiltersBar;
