// src/components/TurnosTable.js
import React from 'react';

const TurnosTable = ({
  turnos,
  cargandoTurnos,
  calcularHoras,
  calcularHorasExtra,
  turnoEliminandoId,
  onEliminarTurno,
}) => {
  return (
    <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 overflow-x-auto">
      {cargandoTurnos ? (
        <p className="text-sm text-zinc-400">Cargando turnos...</p>
      ) : turnos.length === 0 ? (
        <p className="text-sm text-zinc-400">
          No hay turnos registrados para este mes / empresa.
        </p>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-zinc-400 border-b border-zinc-800">
              <th className="text-left py-2 pr-4">Fecha</th>
              <th className="text-left py-2 pr-4">Empresa</th>
              <th className="text-left py-2 pr-4">Evento</th>
              <th className="text-left py-2 pr-4">Área</th>
              <th className="text-left py-2 pr-4">Hora entrada</th>
              <th className="text-left py-2 pr-4">Hora salida</th>
              <th className="text-left py-2 pr-4">Horas trabajadas</th>
              <th className="text-left py-2 pr-4">Horas extra</th>
              <th className="text-left py-2 pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno) => (
              <tr key={turno.id} className="border-b border-zinc-800/60">
                <td className="py-2 pr-4">
                  {turno.fecha ||
                    (turno.hora_entrada &&
                      new Date(turno.hora_entrada).toLocaleDateString())}
                </td>
                <td className="py-2 pr-4">
                  {turno.empresa_nombre || 'Sin empresa'}
                </td>
                <td className="py-2 pr-4">
                  {turno.nombre_evento || '-'}
                </td>
                <td className="py-2 pr-4">
                  {turno.area || '-'}
                </td>
                <td className="py-2 pr-4">
                  {turno.hora_entrada
                    ? new Date(turno.hora_entrada).toLocaleTimeString(
                        [],
                        { hour: '2-digit', minute: '2-digit' }
                      )
                    : '-'}
                </td>
                <td className="py-2 pr-4">
                  {turno.hora_salida
                    ? new Date(turno.hora_salida).toLocaleTimeString(
                        [],
                        { hour: '2-digit', minute: '2-digit' }
                      )
                    : '-'}
                </td>
                <td className="py-2 pr-4">
                  {calcularHoras(turno.hora_entrada, turno.hora_salida)}
                </td>
                <td className="py-2 pr-4">
                  {calcularHorasExtra(
                    turno.hora_entrada,
                    turno.hora_salida
                  )}
                </td>
                <td className="py-2 pr-4">
                  <button
                    onClick={() => onEliminarTurno(turno.id)}
                    disabled={turnoEliminandoId === turno.id}
                    className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-xs font-medium"
                  >
                    {turnoEliminandoId === turno.id
                      ? 'Eliminando...'
                      : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TurnosTable;
