// src/components/TurnosTable.js
import React from 'react';

const TARIFA_HORA = 3750;        // Debe coincidir con el backend
const TARIFA_HORA_EXTRA = 4750;  // Debe coincidir con el backend

const TurnosTable = ({
  turnos,
  cargandoTurnos,
  calcularHoras,
  calcularHorasExtra,
  turnoEliminandoId,
  onEliminarTurno,
  onEditarTurno, // opcional: función para editar turno
}) => {
  const formatearMoneda = (valor) => {
    if (valor == null) return '-';
    return valor.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    });
  };

  // Totales del periodo (por empleado / filtros)
  const totales = turnos.reduce(
    (acc, t) => {
      // Horas base (trabajadas)
      let horasTrab;
      if (typeof t.horas_trabajadas === 'number') {
        horasTrab = t.horas_trabajadas;
      } else {
        const val = calcularHoras(t.hora_entrada, t.hora_salida);
        horasTrab = isNaN(parseFloat(val)) ? 0 : parseFloat(val);
      }

      // Horas extra
      let horasExtra;
      if (typeof t.horas_extra === 'number') {
        horasExtra = t.horas_extra;
      } else {
        const val = calcularHorasExtra(t.hora_entrada, t.hora_salida);
        horasExtra = isNaN(parseFloat(val)) ? 0 : parseFloat(val);
      }

      // Total dinero horas extra (preferimos backend)
      const valorExtra =
        typeof t.valor_horas_extra === 'number'
          ? t.valor_horas_extra
          : horasExtra * TARIFA_HORA_EXTRA;

      // Valor fijo (horas normales)
      const valorFijo =
        typeof t.valor_fijo === 'number'
          ? t.valor_fijo
          : horasTrab * TARIFA_HORA;

      // Sueldo total del turno
      const sueldo =
        typeof t.sueldo_total === 'number'
          ? t.sueldo_total
          : valorExtra + valorFijo;

      return {
        horasTrab: acc.horasTrab + horasTrab,
        horasExtra: acc.horasExtra + horasExtra,
        valorExtra: acc.valorExtra + valorExtra,
        valorFijo: acc.valorFijo + valorFijo,
        sueldo: acc.sueldo + sueldo,
      };
    },
    {
      horasTrab: 0,
      horasExtra: 0,
      valorExtra: 0,
      valorFijo: 0,
      sueldo: 0,
    }
  );

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
              <th className="text-left py-2 pr-4">Valor hora extra</th>
              <th className="text-left py-2 pr-4">Total horas extra</th>
              <th className="text-left py-2 pr-4">Valor fijo</th>
              <th className="text-left py-2 pr-4">Total turno</th>
              <th className="text-left py-2 pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno) => {
              // Cálculos por fila (coherentes con backend)
              const horasTrab =
                typeof turno.horas_trabajadas === 'number'
                  ? turno.horas_trabajadas
                  : (() => {
                      const val = calcularHoras(
                        turno.hora_entrada,
                        turno.hora_salida
                      );
                      return isNaN(parseFloat(val)) ? 0 : parseFloat(val);
                    })();

              const horasExtra =
                typeof turno.horas_extra === 'number'
                  ? turno.horas_extra
                  : (() => {
                      const val = calcularHorasExtra(
                        turno.hora_entrada,
                        turno.hora_salida
                      );
                      return isNaN(parseFloat(val)) ? 0 : parseFloat(val);
                    })();

              const totalHorasExtraDinero =
                typeof turno.valor_horas_extra === 'number'
                  ? turno.valor_horas_extra
                  : horasExtra * TARIFA_HORA_EXTRA;

              const valorFijo =
                typeof turno.valor_fijo === 'number'
                  ? turno.valor_fijo
                  : horasTrab * TARIFA_HORA;

              const totalTurno =
                typeof turno.sueldo_total === 'number'
                  ? turno.sueldo_total
                  : totalHorasExtraDinero + valorFijo;

              return (
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
                    {horasTrab ? horasTrab.toFixed(2) : '-'}
                  </td>
                  <td className="py-2 pr-4">
                    {horasExtra ? horasExtra.toFixed(2) : '-'}
                  </td>
                  <td className="py-2 pr-4">
                    {formatearMoneda(TARIFA_HORA_EXTRA)}
                  </td>
                  <td className="py-2 pr-4">
                    {formatearMoneda(totalHorasExtraDinero)}
                  </td>
                  <td className="py-2 pr-4">
                    {formatearMoneda(valorFijo)}
                  </td>
                  <td className="py-2 pr-4">
                    {formatearMoneda(totalTurno)}
                  </td>
                  <td className="py-2 pr-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEditarTurno && onEditarTurno(turno)
                      }
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-medium"
                    >
                      Editar
                    </button>
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
              );
            })}
          </tbody>

          {/* Fila de totales del periodo */}
          <tfoot>
            <tr className="border-t border-zinc-700 bg-zinc-900/60 font-semibold">
              <td className="py-2 pr-4" colSpan={8}>
                Totales del periodo
              </td>
              {/* Valor hora extra (unidad) */}
              <td className="py-2 pr-4">
                {formatearMoneda(TARIFA_HORA_EXTRA)}
              </td>
              {/* Total dinero horas extra */}
              <td className="py-2 pr-4">
                {formatearMoneda(totales.valorExtra)}
              </td>
              {/* Total valor fijo */}
              <td className="py-2 pr-4">
                {formatearMoneda(totales.valorFijo)}
              </td>
              {/* Sueldo total periodo */}
              <td className="py-2 pr-4">
                {formatearMoneda(totales.sueldo)}
              </td>
              {/* Acciones */}
              <td className="py-2 pr-4" />
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
};

export default TurnosTable;
