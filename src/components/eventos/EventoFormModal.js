import React, { useMemo, useState } from 'react';
import { CircleAlert, Search, Check } from 'lucide-react';
import api from '../../api';
import Modal from '../asistencia/Modal';
import EmpresaSelect from '../empresas/EmpresaSelect';
import NuevoTecnicoInline from '../tecnicos/NuevoTecnicoInline';
import { hoyISO, mensajeError } from '../../helpers/asistencia';

// Crear (evento = null) o editar un evento: datos, productora y empleados asignados
const EventoFormModal = ({ evento, empresas, empleados, onClose, onGuardado, onEmpresaCreada, onTecnicoCreado }) => {
  const editando = !!evento;
  const [nombre, setNombre] = useState(evento?.nombre || '');
  const [empresaId, setEmpresaId] = useState(evento?.empresa_id ? String(evento.empresa_id) : '');
  const [fechaInicio, setFechaInicio] = useState(evento?.fecha_inicio || hoyISO());
  const [fechaFin, setFechaFin] = useState(evento?.fecha_fin || evento?.fecha_inicio || hoyISO());
  const [descripcion, setDescripcion] = useState(evento?.descripcion || '');
  const [seleccionados, setSeleccionados] = useState(() => new Set((evento?.empleados || []).map((e) => e.id)));
  const [busqueda, setBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? empleados.filter((e) => e.nombre.toLowerCase().includes(q)) : empleados;
  }, [empleados, busqueda]);

  const todosFiltradosMarcados = filtrados.length > 0 && filtrados.every((e) => seleccionados.has(e.id));

  const alternar = (id) => {
    setSeleccionados((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const alternarFiltrados = () => {
    setSeleccionados((prev) => {
      const s = new Set(prev);
      filtrados.forEach((e) => (todosFiltradosMarcados ? s.delete(e.id) : s.add(e.id)));
      return s;
    });
  };

  const cambiarInicio = (valor) => {
    setFechaInicio(valor);
    // Evento de un día por defecto: el término sigue al inicio si quedaba antes
    if (!fechaFin || fechaFin < valor) setFechaFin(valor);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim()) return setError('El nombre del evento es obligatorio');
    if (!fechaInicio) return setError('La fecha de inicio es obligatoria');
    if (fechaFin && fechaFin < fechaInicio) return setError('La fecha de término no puede ser anterior a la de inicio');
    if (!empresaId) return setError('Selecciona la empresa (productora) del evento, o créala con "Nueva"');

    try {
      setGuardando(true);
      const payload = {
        nombre: nombre.trim(),
        empresa_id: Number(empresaId),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || fechaInicio,
        descripcion: descripcion.trim() || null,
        empleados: [...seleccionados],
      };
      const res = editando
        ? await api.put(`/eventos/${evento.id}`, payload)
        : await api.post('/eventos', payload);
      onGuardado(res.data);
    } catch (err) {
      setError(mensajeError(err, 'No se pudo guardar el evento'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo={editando ? `Editar evento · ${evento.nombre}` : 'Nuevo evento'} onClose={onClose} ancho="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="ev-nombre">Nombre del evento</label>
          <input id="ev-nombre" className="input" maxLength={200} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus placeholder="Ej: Fiesta de fin de año" />
        </div>

        <div>
          <label className="label" htmlFor="ev-empresa">Empresa (productora)</label>
          <EmpresaSelect
            id="ev-empresa"
            empresas={empresas}
            value={empresaId}
            onChange={setEmpresaId}
            onCreada={onEmpresaCreada}
            placeholder="Selecciona…"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="ev-inicio">Fecha de inicio</label>
            <input id="ev-inicio" type="date" className="input" value={fechaInicio} onChange={(e) => cambiarInicio(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="ev-fin">Fecha de término</label>
            <input id="ev-fin" type="date" className="input" min={fechaInicio} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="ev-desc">Descripción <span className="normal-case text-neutral-600">(opcional)</span></label>
          <textarea id="ev-desc" className="input min-h-[60px]" maxLength={1000} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>

        <fieldset>
          <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
            <legend className="label mb-0">
              Técnicos asignados <span className="normal-case text-neutral-400">({seleccionados.size})</span>
            </legend>
            <div className="relative">
              <Search size={14} className="text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input className="input py-1.5 text-xs pl-9 w-48" placeholder="Buscar técnico" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar técnico" />
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800/60 max-h-64 overflow-y-auto divide-y divide-neutral-800/40">
            {filtrados.length > 0 && (
              <label className="flex items-center gap-3 px-3 py-2 text-xs text-neutral-400 cursor-pointer hover:bg-white/[0.03] sticky top-0 bg-neutral-950/95 backdrop-blur">
                <input type="checkbox" checked={todosFiltradosMarcados} onChange={alternarFiltrados} className="accent-white" />
                {busqueda ? 'Marcar / desmarcar los resultados' : 'Marcar / desmarcar todos'}
              </label>
            )}
            {filtrados.map((emp) => (
              <label key={emp.id} className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-white/[0.03]">
                <input type="checkbox" checked={seleccionados.has(emp.id)} onChange={() => alternar(emp.id)} className="accent-white" />
                <span className="flex-1 text-neutral-200">{emp.nombre}</span>
                {!emp.tiene_pin && <span className="text-[11px] text-neutral-500" title="Sin PIN no puede marcar en el kiosco">sin PIN</span>}
                {seleccionados.has(emp.id) && <Check size={14} className="text-emerald-400" />}
              </label>
            ))}
            {filtrados.length === 0 && (
              <p className="px-3 py-4 text-sm text-neutral-500 text-center">
                {empleados.length === 0 ? 'Aún no hay técnicos: crea el primero abajo.' : 'Sin resultados'}
              </p>
            )}
          </div>
          <NuevoTecnicoInline
            className="mt-2"
            onCreado={(tec) => {
              onTecnicoCreado?.(tec);
              setSeleccionados((prev) => new Set(prev).add(tec.id));
              setBusqueda('');
            }}
          />
          <p className="text-xs text-neutral-500 mt-2">
            Cuando un técnico asignado marca su entrada en una de las fechas del evento, la asistencia queda asociada
            a este evento automáticamente. Las marcas que ya hizo en esas fechas también se asocian al guardar.
          </p>
        </fieldset>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <CircleAlert size={16} /> {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={guardando} className="btn-primary">
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear evento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EventoFormModal;
