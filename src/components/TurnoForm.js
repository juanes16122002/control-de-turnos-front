// src/components/TurnoForm.js
import React from 'react';
import { Calendar, Clock, Building2, Tag } from 'lucide-react';

const TurnoForm = ({
  empresas,
  empresaTurno,
  setEmpresaTurno,
  fechaTurno,
  setFechaTurno,
  horaEntradaTurno,
  setHoraEntradaTurno,
  horaSalidaTurno,
  setHoraSalidaTurno,
  nombreEvento,
  setNombreEvento,
  areaTurno,
  setAreaTurno,
  cargandoTurnoNuevo,
  onSubmit,
  onCancel,
}) => {
  const handleSubmit = (e) => {
    onSubmit(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 bg-zinc-900/80 border border-zinc-700 rounded-2xl p-4 flex flex-col md:flex-row gap-4 flex-wrap"
    >
      {/* Fecha */}
      <div className="flex flex-col">
        <label className="text-sm text-zinc-300 mb-1">Fecha</label>
        <div className="relative">
          <Calendar className="w-4 h-4 text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="date"
            value={fechaTurno}
            onChange={(e) => setFechaTurno(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-9 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Hora entrada */}
      <div className="flex flex-col">
        <label className="text-sm text-zinc-300 mb-1">Hora entrada</label>
        <div className="relative">
          <Clock className="w-4 h-4 text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="time"
            value={horaEntradaTurno}
            onChange={(e) => setHoraEntradaTurno(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-9 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Hora salida */}
      <div className="flex flex-col">
        <label className="text-sm text-zinc-300 mb-1">
          Hora salida (opcional)
        </label>
        <div className="relative">
          <Clock className="w-4 h-4 text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="time"
            value={horaSalidaTurno}
            onChange={(e) => setHoraSalidaTurno(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-9 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Evento */}
      <div className="flex flex-col flex-1 min-w-[220px]">
        <label className="text-sm text-zinc-300 mb-1">
          Nombre del evento
        </label>
        <div className="relative">
          <Tag className="w-4 h-4 text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={nombreEvento}
            onChange={(e) => setNombreEvento(e.target.value)}
            placeholder="Ej: Matrimonio Pérez, Evento corporativo..."
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-9 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Área */}
      <div className="flex flex-col flex-1 min-w-[220px]">
        <label className="text-sm text-zinc-300 mb-1">Área</label>
        <div className="relative">
          <Tag className="w-4 h-4 text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={areaTurno}
            onChange={(e) => setAreaTurno(e.target.value)}
            placeholder="Ej: Sonido, Iluminación, Logística..."
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-9 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Empresa */}
      <div className="flex flex-col">
        <label className="text-sm text-zinc-300 mb-1">Empresa</label>
        <div className="relative">
          <Building2 className="w-4 h-4 text-white absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={empresaTurno}
            onChange={(e) => setEmpresaTurno(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-9 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona empresa</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col justify-end gap-2">
        <button
          type="submit"
          disabled={cargandoTurnoNuevo}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-sm font-medium"
        >
          {cargandoTurnoNuevo ? 'Guardando...' : 'Guardar turno'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default TurnoForm;
