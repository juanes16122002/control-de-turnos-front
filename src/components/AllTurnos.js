// src/components/AllTurnos.js
import React, { useEffect, useState } from 'react';
import api from '../api';

const TARIFA_HORA = 3750; // Debe coincidir con el backend

const AllTurnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [empleadoFiltro, setEmpleadoFiltro] = useState(''); // '' = todos
  const [empresaFiltro, setEmpresaFiltro] = useState('');   // '' = todas

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState('');

  // =========================
  // Helpers de horas
  // =========================
  const obtenerHorasTotales = (horaEntrada, horaSalida) => {
    if (!horaEntrada || !horaSalida) return null;

    const ini = new Date(horaEntrada);
    let fin = new Date(horaSalida);

    // Si la salida es <= entrada, asumimos que cruzó la medianoche
    if (fin <= ini) {
      fin = new Date(fin.getTime() + 24 * 60 * 60 * 1000);
    }

    const diffMs = fin - ini;
    if (diffMs <= 0) return null;
    return diffMs / (1000 * 60 * 60); // horas decimales
  };

  // Para compatibilidad en caso de que el backend no tenga horas_trabajadas
  const calcularHorasBaseFront = (horaEntrada, horaSalida) => {
    const horas = obtenerHorasTotales(horaEntrada, horaSalida);
    if (horas === null) return '-';
    const base = Math.min(horas, 8); // máximo 8 horas
    return base.toFixed(2);
  };

  const calcularHorasExtraFront = (horaEntrada, horaSalida) => {
    const horas = obtenerHorasTotales(horaEntrada, horaSalida);
    if (horas === null) return '-';
    const base = Math.min(horas, 8);
    const extra = Math.max(horas - base, 0);
    return extra.toFixed(2);
  };

  const formatearMoneda = (valor) => {
    if (valor == null) return '-';
    return valor.toLocaleString('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    });
  };

  // =========================
  // Carga inicial de combos
  // =========================
  useEffect(() => {
    const cargarEmpleadosYEmpresas = async () => {
      try {
        setError('');
        const [resEmp, resEmpresas] = await Promise.all([
          api.get('/empleados'),
          api.get('/empresas'),
        ]);
        setEmpleados(resEmp.data);
        setEmpresas(resEmpresas.data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar empleados/empresas');
      }
    };

    cargarEmpleadosYEmpresas();
  }, []);

  // =========================
  // Validar rango de fechas
  // =========================
  const validarRangoFechas = () => {
    if ((fechaDesde && !fechaHasta) || (!fechaDesde && fechaHasta)) {
      setError(
        'Para filtrar/exportar por periodo debes elegir ambas fechas: desde y hasta.'
      );
      return false;
    }

    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      setError('La fecha "desde" no puede ser mayor que la fecha "hasta".');
      return false;
    }

    return true;
  };

  // =========================
  // Cargar turnos globales
  // =========================
  const fetchTurnos = async () => {
    if (!validarRangoFechas()) return;

    try {
      setCargando(true);
      setError('');

      const params = {};
      if (fechaDesde && fechaHasta) {
        params.desde = fechaDesde;
        params.hasta = fechaHasta;
      }
      if (empleadoFiltro) params.empleado_id = empleadoFiltro;
      if (empresaFiltro) params.empresa_id = empresaFiltro;

      const res = await api.get('/turnos', { params });
      setTurnos(res.data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los turnos globales');
    } finally {
      setCargando(false);
    }
  };

  // Cargar automáticamente al entrar
  useEffect(() => {
    fetchTurnos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // Exportar Excel / PDF
  // =========================
  const handleExport = async (tipo) => {
    if (!validarRangoFechas()) return;

    try {
      setExportando(true);
      setError('');

      const params = {};
      if (fechaDesde && fechaHasta) {
        params.desde = fechaDesde;
        params.hasta = fechaHasta;
      }
      if (empleadoFiltro) params.empleado_id = empleadoFiltro;
      if (empresaFiltro) params.empresa_id = empresaFiltro;

      const endpoint = tipo === 'excel' ? '/turnos/excel' : '/turnos/pdf';

      const res = await api.get(endpoint, {
        params,
        responseType: 'blob',
      });

      const labelPeriodo =
        fechaDesde && fechaHasta
          ? `${fechaDesde}_a_${fechaHasta}`
          : 'completo';

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        tipo === 'excel'
          ? `turnos_global_${labelPeriodo}.xlsx`
          : `turnos_global_${labelPeriodo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError(
        tipo === 'excel'
          ? 'No se pudo exportar a Excel'
          : 'No se pudo exportar a PDF'
      );
    } finally {
      setExportando(false);
    }
  };

  const puedeExportar = turnos.length > 0;

  // =========================
  // Totales (para el resumen)
  // =========================
  const totales = turnos.reduce(
    (acc, t) => {
      // Horas base y extra: usar backend si trae, si no calculamos aquí
      let horasTrab =
        typeof t.horas_trabajadas === 'number'
          ? t.horas_trabajadas
          : (() => {
              const horas = obtenerHorasTotales(t.hora_entrada, t.hora_salida);
              if (horas === null) return 0;
              return Math.min(horas, 8);
            })();

      let horasExtra =
        typeof t.horas_extra === 'number'
          ? t.horas_extra
          : (() => {
              const horas = obtenerHorasTotales(t.hora_entrada, t.hora_salida);
              if (horas === null) return 0;
              const base = Math.min(horas, 8);
              return Math.max(horas - base, 0);
            })();

      const valorExtra =
        typeof t.valor_horas_extra === 'number'
          ? t.valor_horas_extra
          : horasExtra * TARIFA_HORA;

      const valorFijo =
        typeof t.valor_fijo === 'number'
          ? t.valor_fijo
          : horasTrab * TARIFA_HORA;

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

  // =========================
  // Render
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-zinc-800 text-white p-6">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Todos los turnos</h1>
          <p className="text-sm text-zinc-400">
            Visualiza los turnos de todos los empleados, filtra por fechas, empresa y empleado,
            y exporta a Excel o PDF. Si filtras por un solo empleado, los totales corresponden a ese empleado.
          </p>
        </div>

        {/* Filtros principales */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          {/* Empleado */}
          <div className="flex flex-col">
            <label className="text-sm text-zinc-300 mb-1">Empleado</label>
            <select
              value={empleadoFiltro}
              onChange={(e) => setEmpleadoFiltro(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Empresa */}
          <div className="flex flex-col">
            <label className="text-sm text-zinc-300 mb-1">Empresa</label>
            <select
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Rango de fechas */}
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex flex-col">
              <label className="text-sm text-zinc-300 mb-1">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-zinc-300 mb-1">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Botón buscar */}
          <button
            onClick={fetchTurnos}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
          >
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>

          {/* Exportar */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('excel')}
              disabled={!puedeExportar || exportando}
              className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-xs font-medium"
            >
              {exportando ? 'Exportando...' : 'Exportar Excel'}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={!puedeExportar || exportando}
              className="px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-900 text-xs font-medium"
            >
              {exportando ? 'Exportando...' : 'Exportar PDF'}
            </button>
          </div>
        </div>
      </header>

      {/* Errores */}
      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-500/40 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Tabla de turnos */}
      <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 overflow-x-auto">
        {cargando ? (
          <p className="text-sm text-zinc-400">Cargando turnos...</p>
        ) : turnos.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No hay turnos para los filtros seleccionados.
          </p>
        ) : (
          <>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-800">
                  <th className="text-left py-2 pr-4">Empleado</th>
                  <th className="text-left py-2 pr-4">Fecha</th>
                  <th className="text-left py-2 pr-4">Empresa</th>
                  <th className="text-left py-2 pr-4">Evento</th>
                  <th className="text-left py-2 pr-4">Área</th>
                  <th className="text-left py-2 pr-4">Hora entrada</th>
                  <th className="text-left py-2 pr-4">Hora salida</th>
                  <th className="text-left py-2 pr-4">Horas trabajadas</th>
                  <th className="text-left py-2 pr-4">Horas extra</th>
                  <th className="text-left py-2 pr-4">Valor horas extra</th>
                  <th className="text-left py-2 pr-4">Valor fijo</th>
                  <th className="text-left py-2 pr-4">Sueldo turno</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((t) => (
                  <tr key={t.id} className="border-b border-zinc-800/60">
                    <td className="py-2 pr-4">
                      {t.empleado_nombre || '-'}
                    </td>
                    <td className="py-2 pr-4">{t.fecha || '-'}</td>
                    <td className="py-2 pr-4">
                      {t.empresa_nombre || 'Sin empresa'}
                    </td>
                    <td className="py-2 pr-4">
                      {t.nombre_evento || '-'}
                    </td>
                    <td className="py-2 pr-4">{t.area || '-'}</td>
                    <td className="py-2 pr-4">
                      {t.hora_entrada
                        ? new Date(t.hora_entrada).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="py-2 pr-4">
                      {t.hora_salida
                        ? new Date(t.hora_salida).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="py-2 pr-4">
                      {typeof t.horas_trabajadas === 'number'
                        ? t.horas_trabajadas.toFixed(2)
                        : calcularHorasBaseFront(
                            t.hora_entrada,
                            t.hora_salida
                          )}
                    </td>
                    <td className="py-2 pr-4">
                      {typeof t.horas_extra === 'number'
                        ? t.horas_extra.toFixed(2)
                        : calcularHorasExtraFront(
                            t.hora_entrada,
                            t.hora_salida
                          )}
                    </td>
                    <td className="py-2 pr-4">
                      {formatearMoneda(
                        typeof t.valor_horas_extra === 'number'
                          ? t.valor_horas_extra
                          : (t.horas_extra || 0) * TARIFA_HORA
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {formatearMoneda(
                        typeof t.valor_fijo === 'number'
                          ? t.valor_fijo
                          : (t.horas_trabajadas || 0) * TARIFA_HORA
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {formatearMoneda(
                        typeof t.sueldo_total === 'number'
                          ? t.sueldo_total
                          : ((t.horas_trabajadas || 0) +
                            (t.horas_extra || 0)) * TARIFA_HORA
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Resumen de totales */}
            <div className="mt-4 grid gap-3 md:grid-cols-5 text-xs md:text-sm">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2">
                <p className="text-zinc-400">Total horas trabajadas</p>
                <p className="font-semibold">
                  {totales.horasTrab.toFixed(2)}
                </p>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2">
                <p className="text-zinc-400">Total horas extra</p>
                <p className="font-semibold">
                  {totales.horasExtra.toFixed(2)}
                </p>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2">
                <p className="text-zinc-400">Total valor horas extra</p>
                <p className="font-semibold">
                  {formatearMoneda(totales.valorExtra)}
                </p>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2">
                <p className="text-zinc-400">Total valor fijo</p>
                <p className="font-semibold">
                  {formatearMoneda(totales.valorFijo)}
                </p>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2">
                <p className="text-zinc-400">Sueldo total</p>
                <p className="font-semibold">
                  {formatearMoneda(totales.sueldo)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AllTurnos;
