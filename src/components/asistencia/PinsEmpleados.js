import React, { useState } from 'react';
import { KeyRound, Shuffle, ShieldCheck, ShieldOff, Search, CircleCheck } from 'lucide-react';
import api from '../../api';
import { mensajeError } from '../../helpers/asistencia';

const generarPin = () => {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return String(arr[0] % 10000).padStart(4, '0');
};

const PinsEmpleados = ({ empleados, onCambio, onError }) => {
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [pin, setPin] = useState('');
  const [guardando, setGuardando] = useState(false);
  // Se muestra una sola vez tras guardarlo: el servidor no puede devolverlo (solo guarda el hash)
  const [pinRecienAsignado, setPinRecienAsignado] = useState(null);

  const filtrados = empleados.filter((e) =>
    e.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  const abrir = (emp) => {
    setEditandoId(emp.id);
    setPin(generarPin());
    setPinRecienAsignado(null);
  };

  const guardar = async (emp) => {
    if (!/^\d{4,6}$/.test(pin)) return onError('El PIN debe tener entre 4 y 6 dígitos');
    try {
      setGuardando(true);
      await api.put(`/empleados/${emp.id}/pin`, { pin });
      setPinRecienAsignado({ id: emp.id, nombre: emp.nombre, pin });
      setEditandoId(null);
      onCambio();
    } catch (err) {
      onError(mensajeError(err, 'No se pudo asignar el PIN'));
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async (emp) => {
    if (!window.confirm(`¿Quitar el PIN de ${emp.nombre}? Ya no podrá marcar asistencia en el kiosco.`)) return;
    try {
      await api.delete(`/empleados/${emp.id}/pin`);
      if (pinRecienAsignado?.id === emp.id) setPinRecienAsignado(null);
      onCambio();
    } catch (err) {
      onError(mensajeError(err, 'No se pudo quitar el PIN'));
    }
  };

  const conPin = empleados.filter((e) => e.tiene_pin).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-400">
          <span className="text-white font-semibold">{conPin}</span> de {empleados.length} técnicos pueden marcar en el kiosco.
          Solo quienes tienen PIN aparecen en él.
        </p>
        <div className="relative">
          <Search size={14} className="text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input className="input py-1.5 text-xs pl-9 w-56" placeholder="Buscar técnico" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      </div>

      {pinRecienAsignado && (
        <div className="flex items-start gap-3 text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 animate-slide-down">
          <CircleCheck size={18} className="shrink-0 mt-0.5 text-emerald-400" />
          <div>
            PIN de <b>{pinRecienAsignado.nombre}</b>:{' '}
            <span className="font-mono text-lg font-bold text-white tracking-widest">{pinRecienAsignado.pin}</span>
            <p className="text-xs text-emerald-300/70 mt-0.5">
              Entrégaselo ahora: por seguridad no se puede volver a consultar (solo reasignar).
            </p>
          </div>
        </div>
      )}

      <div className="card divide-y divide-neutral-800/60">
        {filtrados.map((emp) => (
          <div key={emp.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-[10rem]">
              <p className="text-sm text-white">{emp.nombre}</p>
            </div>
            {emp.tiene_pin
              ? <span className="badge-emerald"><ShieldCheck size={12} /> Con PIN</span>
              : <span className="badge bg-neutral-800 text-neutral-400 border border-neutral-700"><ShieldOff size={12} /> Sin PIN</span>}

            {editandoId === emp.id ? (
              <div className="flex items-center gap-2">
                <input
                  className="input py-1.5 w-28 font-mono tracking-widest text-center"
                  value={pin}
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  aria-label={`Nuevo PIN para ${emp.nombre}`}
                  autoFocus
                />
                <button className="btn-ghost btn-sm" onClick={() => setPin(generarPin())} title="Generar otro PIN aleatorio">
                  <Shuffle size={14} />
                </button>
                <button className="btn-primary btn-sm" disabled={guardando} onClick={() => guardar(emp)}>Guardar</button>
                <button className="btn-ghost btn-sm" onClick={() => setEditandoId(null)}>Cancelar</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button className="btn-secondary btn-sm" onClick={() => abrir(emp)}>
                  <KeyRound size={14} /> {emp.tiene_pin ? 'Reasignar' : 'Asignar PIN'}
                </button>
                {emp.tiene_pin && (
                  <button className="btn-ghost btn-sm text-red-400 hover:text-red-300" onClick={() => quitar(emp)}>Quitar</button>
                )}
              </div>
            )}
          </div>
        ))}
        {filtrados.length === 0 && <p className="px-4 py-6 text-sm text-neutral-500 text-center">Sin resultados</p>}
      </div>
    </div>
  );
};

export default PinsEmpleados;
