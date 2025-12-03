// src/components/TurnoFiltersBar.js
import React from 'react';

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
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
      {/* Mes para la vista */}
      <div className="flex flex-col">
        <label htmlFor="mes" className="text-sm text-zinc-300 mb-1">
          Mes (para vista)
        </label>
        <input
          id="mes"
          type="month"
          value={mesSeleccionado}
          onChange={(e) => setMesSeleccionado(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filtro empresa */}
      <div className="flex flex-col">
        <label className="text-sm text-zinc-300 mb-1">
          Empresa (filtro)
        </label>
        <select
          value={empresaFiltro}
          onChange={(e) => setEmpresaFiltro(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas</option>
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Rango de fechas para exportar */}
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex flex-col">
          <label className="text-sm text-zinc-300 mb-1">
            Desde (exportar)
          </label>
          <input
            type="date"
            value={fechaDesdeExport}
            onChange={(e) => setFechaDesdeExport(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-zinc-300 mb-1">
            Hasta (exportar)
          </label>
          <input
            type="date"
            value={fechaHastaExport}
            onChange={(e) => setFechaHastaExport(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Botón agregar turno */}
      <button
        onClick={onClickAgregarTurno}
        disabled={!empleadoSeleccionado}
        className="w-full md:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-sm font-medium"
      >
        Agregar turno
      </button>

      {/* Botones exportar */}
      <div className="flex gap-2">
        <button
          onClick={onExportExcel}
          disabled={!puedeExportar}
          className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-xs font-medium"
        >
          Exportar Excel
        </button>
        <button
          onClick={onExportPDF}
          disabled={!puedeExportar}
          className="px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-900 text-xs font-medium"
        >
          Exportar PDF
        </button>
      </div>
    </div>
  );
};

export default TurnoFiltersBar;
