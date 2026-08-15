import React, { useEffect, useState } from 'react';
import api from '../api';
import {
  calcularValoresTurno,
  formatearMoneda,
} from '../helpers/horas';
import {
  Search,
  FileSpreadsheet,
  FileText,
  User,
  Building2,
  CalendarDays,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Briefcase,
} from 'lucide-react';

const AllTurnos = () => {
  const [turnos, setTurnos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [empleadoFiltro, setEmpleadoFiltro] = useState('');
  const [empresaFiltro, setEmpresaFiltro] = useState('');

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totales, setTotales] = useState({
    horasTrabajadas: 0,
    horasExtra: 0,
    valorHorasExtra: 0,
    valorFijo: 0,
    sueldo: 0,
  });

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

  const validarRangoFechas = () => {
    if ((fechaDesde && !fechaHasta) || (!fechaDesde && fechaHasta)) {
      setError('Para filtrar/exportar por periodo debes elegir ambas fechas: desde y hasta.');
      return false;
    }
    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      setError('La fecha "desde" no puede ser mayor que la fecha "hasta".');
      return false;
    }
    return true;
  };

  const fetchTurnos = async (pagina = 1) => {
    if (!validarRangoFechas()) return;

    try {
      setCargando(true);
      setError('');

      const params = { page: pagina };
      if (fechaDesde && fechaHasta) {
        params.desde = fechaDesde;
        params.hasta = fechaHasta;
      }
      if (empleadoFiltro) params.empleado_id = empleadoFiltro;
      if (empresaFiltro) params.empresa_id = empresaFiltro;

      const res = await api.get('/turnos', { params });
      setTurnos(res.data.data);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setTotales(res.data.totales);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los turnos globales');
    } finally {
      setCargando(false);
    }
  };

  const buscarTurnos = () => {
    setPage(1);
    fetchTurnos(1);
  };

  const irPagina = (nuevaPagina) => {
    setPage(nuevaPagina);
    fetchTurnos(nuevaPagina);
  };

  useEffect(() => {
    fetchTurnos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Todos los turnos</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Visualiza los turnos de todos los empleados, filtra y exporta
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
            <select
              value={empleadoFiltro}
              onChange={(e) => setEmpleadoFiltro(e.target.value)}
              className="select py-1.5 text-xs w-44 pl-10"
            >
              <option value="">Todos los empleados</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
            <select
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
              className="select py-1.5 text-xs w-44 pl-10"
            >
              <option value="">Todas las empresas</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <CalendarDays className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="input py-1.5 text-xs w-36 pl-10"
                placeholder="Desde"
              />
            </div>
            <span className="text-slate-600 text-xs">a</span>
            <div className="relative">
              <CalendarDays className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="input py-1.5 text-xs w-36 pl-10"
                placeholder="Hasta"
              />
            </div>
          </div>

          <button
            onClick={buscarTurnos}
            className="btn-primary btn-sm"
          >
            {cargando ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Search size={14} />
            )}
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => handleExport('excel')}
              disabled={!puedeExportar || exportando}
              className="btn-secondary btn-sm"
            >
              <FileSpreadsheet size={14} />
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={!puedeExportar || exportando}
              className="btn-secondary btn-sm"
            >
              <FileText size={14} />
              PDF
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-slide-down">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {cargando ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-8 w-full" />
            ))}
          </div>
        ) : turnos.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No hay turnos para los filtros seleccionados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/40 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left font-medium py-3 px-4">Empleado</th>
                    <th className="text-left font-medium py-3 px-4">Fecha</th>
                    <th className="text-left font-medium py-3 px-4">Empresa</th>
                    <th className="text-left font-medium py-3 px-4">Evento</th>
                    <th className="text-left font-medium py-3 px-4">Área</th>
                    <th className="text-left font-medium py-3 px-4">Entrada</th>
                    <th className="text-left font-medium py-3 px-4">Salida</th>
                    <th className="text-right font-medium py-3 px-4">Hrs trab.</th>
                    <th className="text-right font-medium py-3 px-4">Hrs extra</th>
                    <th className="text-right font-medium py-3 px-4">Valor h. extra</th>
                    <th className="text-right font-medium py-3 px-4">Valor fijo</th>
                    <th className="text-right font-medium py-3 px-4">Total turno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {turnos.map((t, idx) => {
                    const v = calcularValoresTurno(t);
                    return (
                      <tr
                        key={t.id}
                        className="group hover:bg-slate-800/20 transition-colors animate-fade-in"
                        style={{ animationDelay: `${idx * 20}ms` }}
                      >
                        <td className="py-2.5 px-4">
                          <span className="badge-blue">{t.empleado_nombre || '-'}</span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-200 whitespace-nowrap">{t.fecha || '-'}</td>
                        <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                          {t.empresa_nombre || <span className="text-slate-500">Sin empresa</span>}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">{t.nombre_evento || '-'}</td>
                        <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">{t.area || '-'}</td>
                        <td className="py-2.5 px-4 text-slate-300 font-mono text-xs whitespace-nowrap">
                          {t.hora_entrada
                            ? new Date(t.hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 font-mono text-xs whitespace-nowrap">
                          {t.hora_salida
                            ? new Date(t.hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">{v.horasTrab ? v.horasTrab.toFixed(2) : '-'}</td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          {v.horasExtra ? <span className="text-amber-400">{v.horasExtra.toFixed(2)}</span> : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap text-slate-400">{formatearMoneda(v.valorExtra)}</td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">{formatearMoneda(v.valorFijo)}</td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap font-semibold">{formatearMoneda(v.sueldoTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 grid-cols-2 md:grid-cols-5 p-4 border-t border-slate-800/50 bg-slate-900/40">
              {[
                { label: 'Horas trabajadas', value: (totales.horasTrabajadas || 0).toFixed(2), icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { label: 'Horas extra', value: (totales.horasExtra || 0).toFixed(2), icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'Valor horas extra', value: formatearMoneda(totales.valorHorasExtra), icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'Valor fijo', value: formatearMoneda(totales.valorFijo), icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Sueldo total', value: formatearMoneda(totales.sueldo), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="glass rounded-xl px-4 py-3 text-center">
                    <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-t border-slate-800/50">
              <p className="text-xs text-slate-500">
                Mostrando {turnos.length} de {total} turno{total !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => irPagina(page - 1)}
                  disabled={page <= 1 || cargando}
                  className="btn-secondary btn-sm"
                >
                  Anterior
                </button>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => irPagina(page + 1)}
                  disabled={page >= totalPages || cargando}
                  className="btn-secondary btn-sm"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AllTurnos;
