import React, { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import api from '../../api';
import Modal from './Modal';
import NuevoTecnicoInline from '../tecnicos/NuevoTecnicoInline';
import { formatearFechaISO, inputLocalAIso, isoAInputLocal, mensajeError } from '../../helpers/asistencia';

const EVENTO_AUTO = '__auto__';

// Crear una asistencia manual (asistencia = null) o corregir una existente
const AsistenciaFormModal = ({ asistencia, empleados, eventos = [], onClose, onGuardado, onTecnicoCreado }) => {
  const editando = !!asistencia;
  // Al crear, por defecto el evento se resuelve en el servidor según la asignación del empleado
  const [eventoId, setEventoId] = useState(editando ? String(asistencia.evento_id || '') : EVENTO_AUTO);
  const [empleadoId, setEmpleadoId] = useState(asistencia?.empleado_id || '');
  const [entrada, setEntrada] = useState(isoAInputLocal(asistencia?.entrada));
  const [salida, setSalida] = useState(isoAInputLocal(asistencia?.salida));
  const [observacion, setObservacion] = useState(asistencia?.observacion || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!editando && !empleadoId) return setError('Selecciona un técnico');
    if (!entrada) return setError('La entrada es obligatoria');
    if (salida && new Date(salida) <= new Date(entrada)) {
      return setError('La salida debe ser posterior a la entrada');
    }

    const payload = {
      entrada: inputLocalAIso(entrada),
      salida: inputLocalAIso(salida),
      observacion: observacion.trim() || null,
    };
    if (eventoId !== EVENTO_AUTO) payload.evento_id = eventoId ? Number(eventoId) : null;

    try {
      setGuardando(true);
      const res = editando
        ? await api.put(`/asistencias/${asistencia.id}`, payload)
        : await api.post('/asistencias', { ...payload, empleado_id: Number(empleadoId) });
      onGuardado(res.data);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar la asistencia'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={editando ? `Corregir asistencia · ${asistencia.empleado_nombre}` : 'Registrar asistencia manual'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!editando && (
          <div>
            <label className="label" htmlFor="asis-emp">Técnico</label>
            <select id="asis-emp" className="select" value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)}>
              <option value="">Selecciona…</option>
              {empleados.map((emp) => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
            </select>
            <NuevoTecnicoInline
              className="mt-2"
              onCreado={(tec) => {
                onTecnicoCreado?.(tec);
                setEmpleadoId(String(tec.id));
              }}
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="asis-entrada">Entrada</label>
            <input id="asis-entrada" type="datetime-local" className="input" value={entrada} onChange={(e) => setEntrada(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="asis-salida">Salida <span className="normal-case text-neutral-600">(opcional)</span></label>
            <input id="asis-salida" type="datetime-local" className="input" value={salida} onChange={(e) => setSalida(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="asis-evento">Evento</label>
          <select id="asis-evento" className="select" value={eventoId} onChange={(e) => setEventoId(e.target.value)}>
            {!editando && <option value={EVENTO_AUTO}>Automático (según los eventos asignados al técnico)</option>}
            <option value="">Sin evento</option>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.nombre} · {ev.empresa_nombre} ({formatearFechaISO(ev.fecha_inicio)})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="asis-obs">Observación</label>
          <textarea
            id="asis-obs"
            className="input min-h-[72px]"
            maxLength={500}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Ej: olvidó marcar la salida, se corrigió según supervisor"
          />
        </div>
        <p className="text-xs text-neutral-500">Los cambios hechos aquí quedan marcados como registro <b>manual (admin)</b>.</p>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <CircleAlert size={16} /> {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={guardando} className="btn-primary">
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AsistenciaFormModal;
