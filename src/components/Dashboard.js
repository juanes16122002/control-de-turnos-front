import React, { useEffect, useState } from 'react';
import api from '../api';
import {
  LayoutDashboard, Users, Building2, CalendarDays, Clock,
  TrendingUp, DollarSign, AlertCircle, UserCheck,
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 animate-fade-in">
    <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] sm:text-xs text-neutral-500 uppercase tracking-wider truncate">{label}</p>
      <p className={`text-lg sm:text-xl font-bold ${color} truncate`}>{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setCargando(true);
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        setError('No se pudo cargar el dashboard');
      } finally {
        setCargando(false);
      }
    };
    fetchDashboard();
  }, []);

  if (cargando) {
    return (
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} />
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="icon-tile">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-xs text-neutral-500">Periodo actual: {data.periodoActual}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Users} label="Empleados" value={data.totalEmpleados} color="text-white" bg="bg-white/[0.06]" />
        <StatCard icon={Building2} label="Empresas" value={data.totalEmpresas} color="text-neutral-300" bg="bg-white/[0.04]" />
        <StatCard icon={CalendarDays} label="Total turnos" value={data.totalTurnos} color="text-neutral-300" bg="bg-white/[0.04]" />
        <StatCard icon={Clock} label="Turnos este mes" value={data.turnosEsteMes} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard icon={TrendingUp} label="Horas este mes" value={`${data.totalHorasEsteMes}h`} color="text-amber-400" bg="bg-amber-500/10" />
        <StatCard icon={DollarSign} label="Sueldo este mes" value={data.totalSueldoEsteMes?.toLocaleString?.('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }) || '$0'} color="text-emerald-400" bg="bg-emerald-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-neutral-200 mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-white" />
            Top empleados del mes
          </h2>
          {data.topEmpleados.filter(e => e.total_turnos > 0).length === 0 ? (
            <p className="text-sm text-neutral-500">Sin datos este mes</p>
          ) : (
            <div className="space-y-2">
              {data.topEmpleados.filter(e => e.total_turnos > 0).map((emp, i) => (
                <div key={emp.id} className="flex items-center gap-3 bg-neutral-800/30 rounded-xl px-4 py-3 border border-neutral-700/30">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">{emp.nombre}</p>
                    <p className="text-xs text-neutral-500">{emp.total_turnos} turnos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-400">{emp.total_horas.toFixed(1)}h</p>
                    <p className="text-xs text-neutral-500">{emp.total_sueldo.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-neutral-200 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-neutral-300" />
            Turnos por empresa
          </h2>
          {data.turnosPorEmpresa.filter(e => e.total > 0).length === 0 ? (
            <p className="text-sm text-neutral-500">Sin datos este mes</p>
          ) : (
            <div className="space-y-2">
              {data.turnosPorEmpresa.filter(e => e.total > 0).map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 bg-neutral-800/30 rounded-xl px-4 py-3 border border-neutral-700/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">{emp.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-neutral-300">{emp.total} turnos</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-neutral-200 mb-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-neutral-300" />
          Últimos turnos registrados
        </h2>
        {data.turnosRecientes.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay turnos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-neutral-400 text-xs uppercase tracking-wider border-b border-neutral-800/50">
                  <th className="text-left font-medium py-2 pr-4">Fecha</th>
                  <th className="text-left font-medium py-2 pr-4">Empleado</th>
                  <th className="text-left font-medium py-2 pr-4 hidden sm:table-cell">Evento</th>
                  <th className="text-left font-medium py-2 pr-4 hidden md:table-cell">Empresa</th>
                  <th className="text-right font-medium py-2 pr-4">Horas</th>
                  <th className="text-right font-medium py-2 pr-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/30">
                {data.turnosRecientes.map((t, i) => (
                  <tr key={i} className="hover:bg-neutral-800/20 transition-colors">
                    <td className="py-2 pr-4 text-neutral-200 whitespace-nowrap">{t.fecha}</td>
                    <td className="py-2 pr-4 text-neutral-300">{t.empleado_nombre}</td>
                    <td className="py-2 pr-4 text-neutral-300 hidden sm:table-cell">{t.nombre_evento || '-'}</td>
                    <td className="py-2 pr-4 text-neutral-300 hidden md:table-cell">{t.empresa_nombre || '-'}</td>
                    <td className="py-2 pr-4 text-right text-amber-400">{t.horas_trabajadas?.toFixed(1)}</td>
                    <td className="py-2 pr-4 text-right font-semibold text-emerald-400">
                      {t.sueldo_total?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
