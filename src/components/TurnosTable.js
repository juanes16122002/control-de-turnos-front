import React from 'react';
import {
  calcularValoresTurno,
  formatearMoneda,
} from '../helpers/horas';
import { Pencil, Trash2, TableIcon, Copy } from 'lucide-react';

const TurnosTable = ({
  turnos,
  cargandoTurnos,
  turnoEliminandoId,
  onEliminarTurno,
  onEditarTurno,
  onDuplicarTurno,
}) => {
  const totales = turnos.reduce(
    (acc, t) => {
      const v = calcularValoresTurno(t);
      return {
        horasTrab: acc.horasTrab + v.horasTrab,
        horasExtra: acc.horasExtra + v.horasExtra,
        valorExtra: acc.valorExtra + v.valorExtra,
        valorFijo: acc.valorFijo + v.valorFijo,
        sueldo: acc.sueldo + v.sueldoTotal,
      };
    },
    { horasTrab: 0, horasExtra: 0, valorExtra: 0, valorFijo: 0, sueldo: 0 }
  );

  return (
    <div className="card overflow-hidden">
      {cargandoTurnos ? (
        <div className="p-8 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-8 w-full" />
          ))}
        </div>
      ) : turnos.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <TableIcon className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No hay turnos registrados para este mes / empresa</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-800/40 text-slate-400 text-xs uppercase tracking-wider">
                <th className="text-left font-medium py-3 px-4">Fecha</th>
                <th className="text-left font-medium py-3 px-4">Empresa</th>
                <th className="text-left font-medium py-3 px-4">Evento</th>
                <th className="text-left font-medium py-3 px-4">Área</th>
                <th className="text-left font-medium py-3 px-4">Entrada</th>
                <th className="text-left font-medium py-3 px-4">Salida</th>
                <th className="text-right font-medium py-3 px-4">Hrs trab.</th>
                <th className="text-right font-medium py-3 px-4">Hrs extra</th>
                <th className="text-right font-medium py-3 px-4">Valor h. extra</th>
                <th className="text-right font-medium py-3 px-4">Total h. extra</th>
                <th className="text-right font-medium py-3 px-4">Valor fijo</th>
                <th className="text-right font-medium py-3 px-4">Total turno</th>
                <th className="text-center font-medium py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {turnos.map((turno, idx) => {
                const v = calcularValoresTurno(turno);
                return (
                  <tr
                    key={turno.id}
                    className="group hover:bg-slate-800/20 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="py-2.5 px-4 text-slate-200 whitespace-nowrap">
                      {turno.fecha || (turno.hora_entrada && new Date(turno.hora_entrada).toLocaleDateString())}
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                      {turno.empresa_nombre ? (
                        <span className="badge-blue">{turno.empresa_nombre}</span>
                      ) : (
                        <span className="text-slate-500">Sin empresa</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">{turno.nombre_evento || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">{turno.area || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap font-mono text-xs">
                      {turno.hora_entrada
                        ? new Date(turno.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap font-mono text-xs">
                      {turno.hora_salida
                        ? new Date(turno.hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {v.horasTrab ? <span className="font-medium">{v.horasTrab.toFixed(2)}</span> : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {v.horasExtra ? <span className="text-amber-400 font-medium">{v.horasExtra.toFixed(2)}</span> : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap text-slate-400">
                      {formatearMoneda(turno.tarifa_hora_extra)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {v.valorExtra ? <span className="text-amber-400">{formatearMoneda(v.valorExtra)}</span> : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {formatearMoneda(v.valorFijo)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap font-semibold text-slate-200">
                      {formatearMoneda(v.sueldoTotal)}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => onEditarTurno && onEditarTurno(turno)}
                          className="btn-ghost btn-xs text-amber-400"
                        >
                          <Pencil size={12} />
                        </button>
                        {onDuplicarTurno && (
                          <button
                            type="button"
                            onClick={() => onDuplicarTurno(turno.id)}
                            className="btn-ghost btn-xs text-blue-400"
                          >
                            <Copy size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => onEliminarTurno(turno.id)}
                          disabled={turnoEliminandoId === turno.id}
                          className="btn-ghost btn-xs text-red-400"
                        >
                          {turnoEliminandoId === turno.id ? (
                            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800/40 border-t border-slate-700/50">
                <td className="py-3 px-4 font-semibold text-slate-200" colSpan={6}>
                  Totales del periodo
                </td>
                <td className="py-3 px-4 text-right font-semibold">
                  {totales.horasTrab.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-amber-400">
                  {totales.horasExtra.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-slate-400">
                  {'—'}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-amber-400">
                  {formatearMoneda(totales.valorExtra)}
                </td>
                <td className="py-3 px-4 text-right font-semibold">
                  {formatearMoneda(totales.valorFijo)}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                  {formatearMoneda(totales.sueldo)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default TurnosTable;
