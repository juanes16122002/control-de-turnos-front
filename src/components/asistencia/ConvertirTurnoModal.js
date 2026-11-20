import React, { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import api from '../../api';
import Modal from './Modal';
import { formatearDuracion, formatearFechaISO, formatearHoraCorta, mensajeError } from '../../helpers/asistencia';

// Crea un turno (con cálculo de sueldo) a partir de una asistencia cerrada
const ConvertirTurnoModal = ({ asistencia, empresas, onClose, onConvertido }) => {
  // Si la asistencia pertenece a un evento, el turno parte con su nombre y su productora
  const [nombreEvento, setNombreEvento] = useState(asistencia.evento_nombre || '');
  const [area, setArea] = useState('');
  const [empresaId, setEmpresaId] = useState(asistencia.empresa_id ? String(asistencia.empresa_id) : '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!nombreEvento.trim() || !area.trim()) return setError('El evento y el área son obligatorios');
    try {
      setGuardando(true);
      const res = await api.post(`/asistencias/${asistencia.id}/convertir`, {
        nombre_evento: nombreEvento.trim(),
        area: area.trim(),
        empresa_id: empresaId ? Number(empresaId) : null,
      });
      onConvertido(res.data);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo convertir en turno'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Convertir asistencia en turno" onClose={onClose}>
      <div className="rounded-xl bg-neutral-800/40 border border-neutral-700/50 px-4 py-3 mb-4 text-sm">
        <p className="text-white font-medium">{asistencia.empleado_nombre}</p>
        <p className="text-neutral-400">
          {formatearFechaISO(asistencia.fecha)} · {formatearHoraCorta(asistencia.entrada)} – {formatearHoraCorta(asistencia.salida)}
          {' '}· <span className="text-neutral-200">{formatearDuracion(asistencia.horas)}</span>
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="conv-evento">Evento</label>
          <input id="conv-evento" className="input" value={nombreEvento} onChange={(e) => setNombreEvento(e.target.value)} autoFocus={!asistencia.evento_nombre} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="conv-area">Área</label>
            <input id="conv-area" className="input" value={area} onChange={(e) => setArea(e.target.value)} autoFocus={!!asistencia.evento_nombre} />
          </div>
          <div>
            <label className="label" htmlFor="conv-empresa">Empresa</label>
            <select id="conv-empresa" className="select" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
              <option value="">Sin empresa</option>
              {empresas.map((emp) => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          El turno se calcula con la tarifa del técnico (8 h base y el resto como extra). Una vez convertida,
          la asistencia queda bloqueada para edición.
        </p>
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <CircleAlert size={16} /> {error}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={guardando} className="btn-primary">
            {guardando ? 'Creando turno…' : 'Crear turno'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ConvertirTurnoModal;
