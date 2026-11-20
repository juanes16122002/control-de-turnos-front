import React, { useState } from 'react';
import { Building2, Plus, Check, X } from 'lucide-react';
import api from '../../api';
import { mensajeError } from '../../helpers/asistencia';

/**
 * Selector de empresa con botón "Nueva" a la vista: permite crear la empresa sin salir
 * del formulario. Al crearla queda seleccionada y se avisa al padre con `onCreada`.
 */
const EmpresaSelect = ({ id, empresas, value, onChange, onCreada, placeholder = 'Selecciona empresa', conIcono = false }) => {
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cancelar = () => {
    setCreando(false);
    setNombre('');
    setError('');
  };

  const crear = async () => {
    const limpio = nombre.trim();
    if (!limpio) return setError('Escribe el nombre de la empresa');
    try {
      setGuardando(true);
      setError('');
      const res = await api.post('/empresas', { nombre: limpio });
      onCreada?.(res.data);
      onChange(String(res.data.id));
      cancelar();
    } catch (err) {
      setError(mensajeError(err, 'No se pudo crear la empresa'));
    } finally {
      setGuardando(false);
    }
  };

  // Enter crea la empresa sin enviar el formulario que contiene al selector
  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); crear(); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelar(); }
  };

  if (creando) {
    return (
      <div>
        <div className="flex gap-2">
          <input
            id={id}
            className="input flex-1"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Nombre de la nueva empresa"
            maxLength={200}
            autoFocus
          />
          <button type="button" className="btn-primary btn-sm shrink-0" onClick={crear} disabled={guardando}>
            <Check size={14} /> {guardando ? 'Creando…' : 'Crear'}
          </button>
          <button type="button" className="btn-ghost btn-sm shrink-0" onClick={cancelar} aria-label="Cancelar nueva empresa">
            <X size={14} />
          </button>
        </div>
        {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1 min-w-0">
        {conIcono && (
          <Building2 className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
        )}
        <select id={id} className={`select ${conIcono ? 'pl-10' : ''}`} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{empresas.length === 0 ? 'Aún no hay empresas: crea una →' : placeholder}</option>
          {empresas.map((emp) => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
        </select>
      </div>
      <button type="button" className="btn-secondary btn-sm shrink-0" onClick={() => setCreando(true)} title="Crear una empresa nueva">
        <Plus size={14} /> Nueva
      </button>
    </div>
  );
};

export default EmpresaSelect;
