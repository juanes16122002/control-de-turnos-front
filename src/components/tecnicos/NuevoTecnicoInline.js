import React, { useState } from 'react';
import { UserPlus, Check, X } from 'lucide-react';
import api from '../../api';
import { mensajeError } from '../../helpers/asistencia';

/**
 * Botón "Nuevo técnico" que se despliega en un campo para crearlo sin salir del formulario.
 * Al crearlo llama a `onCreado(tecnico)`; el padre decide si lo selecciona o lo marca.
 */
const NuevoTecnicoInline = ({ onCreado, className = '' }) => {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cerrar = () => {
    setAbierto(false);
    setNombre('');
    setError('');
  };

  const crear = async () => {
    const limpio = nombre.trim();
    if (!limpio) return setError('Escribe el nombre del técnico');
    try {
      setGuardando(true);
      setError('');
      const res = await api.post('/empleados', { nombre: limpio });
      onCreado(res.data);
      cerrar();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear el técnico'));
    } finally {
      setGuardando(false);
    }
  };

  // Enter crea sin enviar el formulario que lo contiene; Escape cancela sin cerrar el modal
  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); crear(); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(); }
  };

  if (!abierto) {
    return (
      <button type="button" className={`btn-secondary btn-sm ${className}`} onClick={() => setAbierto(true)}>
        <UserPlus size={14} /> Nuevo técnico
      </button>
    );
  }

  return (
    <div className={className}>
      <div className="flex gap-2">
        <input
          className="input py-1.5 flex-1"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nombre y apellido del técnico"
          aria-label="Nombre del nuevo técnico"
          maxLength={200}
          autoFocus
        />
        <button type="button" className="btn-primary btn-sm shrink-0" onClick={crear} disabled={guardando}>
          <Check size={14} /> {guardando ? 'Creando…' : 'Crear'}
        </button>
        <button type="button" className="btn-ghost btn-sm shrink-0" onClick={cerrar} aria-label="Cancelar nuevo técnico">
          <X size={14} />
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
      <p className="text-[11px] text-neutral-500 mt-1.5">Se crea con la tarifa por defecto; puedes cambiarla en Técnicos. Para marcar en el kiosco necesita un PIN.</p>
    </div>
  );
};

export default NuevoTecnicoInline;
