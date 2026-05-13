import React from 'react';
import { Calendar, Clock, Building2, Tag, X } from 'lucide-react';

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
  modoEdicion,
}) => {
  const handleSubmit = (e) => {
    onSubmit(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card p-5 mb-6 animate-slide-down"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">
          {modoEdicion ? 'Editar turno' : 'Nuevo turno'}
        </h3>
        <button type="button" onClick={onCancel} className="btn-ghost btn-xs">
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="label">Fecha</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
            <input
              type="date"
              value={fechaTurno}
              onChange={(e) => setFechaTurno(e.target.value)}
              className="input input-icon"
            />
          </div>
        </div>

        <div>
          <label className="label">Hora entrada</label>
          <p className="text-[10px] text-slate-500 mb-1.5 -mt-1">Inicio del turno</p>
          <div className="relative">
            <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
            <input
              type="time"
              value={horaEntradaTurno}
              onChange={(e) => setHoraEntradaTurno(e.target.value)}
              className="input input-icon"
            />
          </div>
        </div>

        <div>
          <label className="label">Hora salida</label>
          <p className="text-[10px] text-slate-500 mb-1.5 -mt-1">Término del turno</p>
          <div className="relative">
            <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
            <input
              type="time"
              value={horaSalidaTurno}
              onChange={(e) => setHoraSalidaTurno(e.target.value)}
              className="input input-icon"
            />
          </div>
        </div>

        <div>
          <label className="label">Empresa</label>
          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
            <select
              value={empresaTurno}
              onChange={(e) => setEmpresaTurno(e.target.value)}
              className="select pl-10"
            >
              <option value="">Selecciona empresa</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Nombre del evento</label>
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
            <input
              type="text"
              value={nombreEvento}
              onChange={(e) => setNombreEvento(e.target.value)}
              placeholder="Ej: Matrimonio Pérez"
              className="input input-icon"
            />
          </div>
        </div>

        <div>
          <label className="label">Área</label>
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
            <input
              type="text"
              value={areaTurno}
              onChange={(e) => setAreaTurno(e.target.value)}
              placeholder="Ej: Sonido, Iluminación"
              className="input input-icon"
            />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={cargandoTurnoNuevo}
            className="btn-success flex-1"
          >
            {cargandoTurnoNuevo ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando...
              </span>
            ) : (
              modoEdicion ? 'Actualizar turno' : 'Guardar turno'
            )}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
};

export default TurnoForm;
