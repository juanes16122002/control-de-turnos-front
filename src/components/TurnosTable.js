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
          <TableIcon className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">No hay turnos registrados para este mes / empresa</p>
        </div>
      ) : (
        <>
          {/* Celular: tarjetas (la tabla de 13 columnas no cabe) */}
          <ul className="md:hidden divide-y divide-neutral-800/40" aria-label="Turnos">
            {turnos.map((turno) => {
              const v = calcularValoresTurno(turno);
              const hora = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
              return (
                <li key={turno.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{turno.nombre_evento || 'Sin evento'}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {turno.fecha || (turno.hora_entrada && new Date(turno.hora_entrada).toLocaleDateString())}
                        {turno.area ? ` · ${turno.area}` : ''}
                      </p>
                    </div>
                    <p className="text-base font-semibold text-neutral-100 tabular-nums shrink-0">{formatearMoneda(v.sueldoTotal)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
                    {turno.empresa_nombre ? <span className="badge-brand">{turno.empresa_nombre}</span> : <span>Sin empresa</span>}
                    <span className="font-mono tabular-nums">{hora(turno.hora_entrada)} – {hora(turno.hora_salida)}</span>
                    <span>{(v.horasTrab || 0).toFixed(2)} h</span>
                    {v.horasExtra > 0 && <span className="text-amber-400">+{v.horasExtra.toFixed(2)} h extra</span>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => onEditarTurno && onEditarTurno(turno)} className="btn-secondary btn-sm flex-1">
                      <Pencil size={14} /> Editar
                    </button>
                    {onDuplicarTurno && (
                      <button type="button" onClick={() => onDuplicarTurno(turno.id)} className="btn-secondary btn-sm flex-1">
                        <Copy size={14} /> Duplicar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEliminarTurno(turno.id)}
                      disabled={turnoEliminandoId === turno.id}
                      className="btn-ghost btn-sm text-red-400"
                      aria-label={`Eliminar turno del ${turno.fecha || ''}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <dl className="md:hidden grid grid-cols-2 gap-3 p-4 border-t border-neutral-700/50 bg-neutral-800/30 text-sm">
            <div><dt className="text-xs text-neutral-500">Horas trabajadas</dt><dd className="font-semibold">{totales.horasTrab.toFixed(2)}</dd></div>
            <div><dt className="text-xs text-neutral-500">Horas extra</dt><dd className="font-semibold text-amber-400">{totales.horasExtra.toFixed(2)}</dd></div>
            <div><dt className="text-xs text-neutral-500">Valor fijo</dt><dd className="font-semibold">{formatearMoneda(totales.valorFijo)}</dd></div>
            <div><dt className="text-xs text-neutral-500">Total del periodo</dt><dd className="font-semibold text-emerald-400">{formatearMoneda(totales.sueldo)}</dd></div>
          </dl>

          {/* Tablet y escritorio: tabla completa */}
          <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-neutral-800/40 text-neutral-400 text-xs uppercase tracking-wider">
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
            <tbody className="divide-y divide-neutral-800/40">
              {turnos.map((turno, idx) => {
                const v = calcularValoresTurno(turno);
                return (
                  <tr
                    key={turno.id}
                    className="group hover:bg-neutral-800/20 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <td className="py-2.5 px-4 text-neutral-200 whitespace-nowrap">
                      {turno.fecha || (turno.hora_entrada && new Date(turno.hora_entrada).toLocaleDateString())}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-300 whitespace-nowrap">
                      {turno.empresa_nombre ? (
                        <span className="badge-brand">{turno.empresa_nombre}</span>
                      ) : (
                        <span className="text-neutral-500">Sin empresa</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-300 whitespace-nowrap">{turno.nombre_evento || '-'}</td>
                    <td className="py-2.5 px-4 text-neutral-300 whitespace-nowrap">{turno.area || '-'}</td>
                    <td className="py-2.5 px-4 text-neutral-300 whitespace-nowrap font-mono text-xs">
                      {turno.hora_entrada
                        ? new Date(turno.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-300 whitespace-nowrap font-mono text-xs">
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
                    <td className="py-2.5 px-4 text-right whitespace-nowrap text-neutral-400">
                      {formatearMoneda(turno.tarifa_hora_extra)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {v.valorExtra ? <span className="text-amber-400">{formatearMoneda(v.valorExtra)}</span> : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {formatearMoneda(v.valorFijo)}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap font-semibold text-neutral-200">
                      {formatearMoneda(v.sueldoTotal)}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex gap-1 justify-center acciones-hover">
                        <button
                          type="button"
                          onClick={() => onEditarTurno && onEditarTurno(turno)}
                          className="btn-ghost btn-xs text-amber-400"
                          aria-label="Editar turno"
                        >
                          <Pencil size={12} />
                        </button>
                        {onDuplicarTurno && (
                          <button
                            type="button"
                            onClick={() => onDuplicarTurno(turno.id)}
                            className="btn-ghost btn-xs text-neutral-300"
                            aria-label="Duplicar turno"
                          >
                            <Copy size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => onEliminarTurno(turno.id)}
                          disabled={turnoEliminandoId === turno.id}
                          className="btn-ghost btn-xs text-red-400"
                          aria-label="Eliminar turno"
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
              <tr className="bg-neutral-800/40 border-t border-neutral-700/50">
                <td className="py-3 px-4 font-semibold text-neutral-200" colSpan={6}>
                  Totales del periodo
                </td>
                <td className="py-3 px-4 text-right font-semibold">
                  {totales.horasTrab.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-amber-400">
                  {totales.horasExtra.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-right text-neutral-400">
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
        </>
      )}
    </div>
  );
};

export default TurnosTable;
