import React, { useEffect, useState } from 'react';
import api from './api';

import EmpleadosSidebar from './components/EmpleadosSidebar';
import TurnoFiltersBar from './components/TurnoFiltersBar';
import TurnoForm from './components/TurnoForm';
import TurnosTable from './components/TurnosTable';
import { AlertCircle, CalendarDays } from 'lucide-react';

const Home = () => {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [turnos, setTurnos] = useState([]);

  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [empresas, setEmpresas] = useState([]);
  const [empresaFiltro, setEmpresaFiltro] = useState('');
  const [empresaTurno, setEmpresaTurno] = useState('');

  const [cargandoEmpleados, setCargandoEmpleados] = useState(false);
  const [cargandoTurnos, setCargandoTurnos] = useState(false);
  const [cargandoNuevo, setCargandoNuevo] = useState(false);
  const [cargandoTurnoNuevo, setCargandoTurnoNuevo] = useState(false);
  const [turnoEliminandoId, setTurnoEliminandoId] = useState(null);
  const [empleadoEliminandoId, setEmpleadoEliminandoId] = useState(null);
  const [empleadoRenombrandoId, setEmpleadoRenombrandoId] = useState(null);

  const [mostrandoFormEmpleado, setMostrandoFormEmpleado] = useState(false);
  const [mostrandoFormTurno, setMostrandoFormTurno] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState('');

  const [fechaTurno, setFechaTurno] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [horaEntradaTurno, setHoraEntradaTurno] = useState('08:00');
  const [horaSalidaTurno, setHoraSalidaTurno] = useState('16:00');
  const [nombreEvento, setNombreEvento] = useState('');
  const [areaTurno, setAreaTurno] = useState('');

  const [fechaDesdeExport, setFechaDesdeExport] = useState('');
  const [fechaHastaExport, setFechaHastaExport] = useState('');

  const [error, setError] = useState('');

  const [turnoEditando, setTurnoEditando] = useState(null);

  const [nuevaEmpresa, setNuevaEmpresa] = useState('');
  const [editandoEmpresaId, setEditandoEmpresaId] = useState(null);
  const [editandoEmpresaNombre, setEditandoEmpresaNombre] = useState('');

  // Carga inicial
  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        setCargandoEmpleados(true);
        setError('');
        const res = await api.get('/empleados');
        setEmpleados(res.data);
        if (res.data.length > 0) {
          setEmpleadoSeleccionado(res.data[0]);
        }
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los empleados');
      } finally {
        setCargandoEmpleados(false);
      }
    };
    fetchEmpleados();
  }, []);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const res = await api.get('/empresas');
        setEmpresas(res.data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar las empresas');
      }
    };
    fetchEmpresas();
  }, []);

  useEffect(() => {
    const fetchTurnos = async () => {
      if (!empleadoSeleccionado) {
        setTurnos([]);
        return;
      }
      try {
        setCargandoTurnos(true);
        setError('');
        const [anio, mes] = mesSeleccionado.split('-');
        const params = { anio, mes };
        if (empresaFiltro) params.empresa_id = empresaFiltro;
        const res = await api.get(`/empleados/${empleadoSeleccionado.id}/turnos`, { params });
        setTurnos(res.data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los turnos del empleado');
      } finally {
        setCargandoTurnos(false);
      }
    };
    fetchTurnos();
  }, [empleadoSeleccionado, mesSeleccionado, empresaFiltro]);

  // Handlers empresas
  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    if (!nuevaEmpresa.trim()) return;
    try {
      const res = await api.post('/empresas', { nombre: nuevaEmpresa.trim() });
      setEmpresas((prev) => [...prev, res.data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNuevaEmpresa('');
    } catch (err) {
      console.error(err);
      setError('No se pudo crear la empresa');
    }
  };

  const handleRenombrarEmpresa = async (id) => {
    if (!editandoEmpresaNombre.trim()) return;
    try {
      setEditandoEmpresaId(id);
      await api.put(`/empresas/${id}`, { nombre: editandoEmpresaNombre.trim() });
      setEmpresas((prev) =>
        prev.map((e) => (e.id === id ? { ...e, nombre: editandoEmpresaNombre.trim() } : e)).sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      setEditandoEmpresaId(null);
      setEditandoEmpresaNombre('');
    } catch (err) {
      console.error(err);
      setError('No se pudo renombrar la empresa');
    }
  };

  const handleEliminarEmpresa = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta empresa?')) return;
    try {
      await api.delete(`/empresas/${id}`);
      setEmpresas((prev) => prev.filter((e) => e.id !== id));
      if (empresaFiltro === String(id)) setEmpresaFiltro('');
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar la empresa');
    }
  };

  // Handlers empleados
  const handleCrearEmpleado = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    try {
      setCargandoNuevo(true);
      setError('');
      const res = await api.post('/empleados', { nombre: nuevoNombre.trim() });
      const nuevo = res.data;
      setEmpleados((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setEmpleadoSeleccionado(nuevo);
      setNuevoNombre('');
      setMostrandoFormEmpleado(false);
    } catch (err) {
      console.error(err);
      setError('No se pudo crear el empleado');
    } finally {
      setCargandoNuevo(false);
    }
  };

  const handleEliminarEmpleado = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este empleado y todos sus turnos?')) return;
    try {
      setEmpleadoEliminandoId(id);
      setError('');
      await api.delete(`/empleados/${id}`);
      const nuevos = empleados.filter((e) => e.id !== id);
      setEmpleados(nuevos);
      if (empleadoSeleccionado?.id === id) {
        if (nuevos.length > 0) {
          setEmpleadoSeleccionado(nuevos[0]);
        } else {
          setEmpleadoSeleccionado(null);
          setTurnos([]);
        }
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar el empleado');
    } finally {
      setEmpleadoEliminandoId(null);
    }
  };

  const handleRenombrarEmpleado = async (id, nuevoNombreEmpleado) => {
    if (!nuevoNombreEmpleado.trim()) return;
    try {
      setEmpleadoRenombrandoId(id);
      setError('');
      await api.put(`/empleados/${id}`, { nombre: nuevoNombreEmpleado.trim() });
      setEmpleados((prev) =>
        [...prev]
          .map((e) => (e.id === id ? { ...e, nombre: nuevoNombreEmpleado.trim() } : e))
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      if (empleadoSeleccionado?.id === id) {
        setEmpleadoSeleccionado((prev) => ({ ...prev, nombre: nuevoNombreEmpleado.trim() }));
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo editar el nombre del empleado');
    } finally {
      setEmpleadoRenombrandoId(null);
    }
  };

  const handleActualizarEmpleado = async (id, data) => {
    try {
      setError('');
      const res = await api.put(`/empleados/${id}`, data);
      const updated = res.data;
      setEmpleados((prev) =>
        [...prev]
          .map((e) => (e.id === id ? { ...e, ...updated } : e))
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      if (empleadoSeleccionado?.id === id) {
        setEmpleadoSeleccionado((prev) => ({ ...prev, ...updated }));
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el empleado');
    }
  };

  // Handlers turnos
  const handleGuardarTurno = async (e) => {
    e.preventDefault();
    if (!empleadoSeleccionado) { setError('Selecciona un empleado antes de agregar un turno'); return; }
    if (!fechaTurno || !horaEntradaTurno) { setError('La fecha y la hora de entrada son obligatorias'); return; }
    if (!empresaTurno) { setError('La empresa es obligatoria para el turno'); return; }
    if (!nombreEvento.trim()) { setError('El nombre del evento es obligatorio'); return; }
    if (!areaTurno.trim()) { setError('El área es obligatoria'); return; }

    try {
      setCargandoTurnoNuevo(true);
      setError('');

      const horaEntradaISO = new Date(`${fechaTurno}T${horaEntradaTurno}:00`).toISOString();
      const horaSalidaISO = horaSalidaTurno ? new Date(`${fechaTurno}T${horaSalidaTurno}:00`).toISOString() : null;

      const payload = {
        empleado_id: empleadoSeleccionado.id,
        fecha: fechaTurno,
        hora_entrada: horaEntradaISO,
        hora_salida: horaSalidaISO,
        empresa_id: empresaTurno,
        nombre_evento: nombreEvento.trim(),
        area: areaTurno.trim(),
      };

      if (turnoEditando) {
        await api.put(`/turnos/${turnoEditando.id}`, payload);
      } else {
        await api.post('/turnos', payload);
      }

      const [anio, mes] = mesSeleccionado.split('-');
      const params = { anio, mes };
      if (empresaFiltro) params.empresa_id = empresaFiltro;
      const res = await api.get(`/empleados/${empleadoSeleccionado.id}/turnos`, { params });
      setTurnos(res.data);
      setMostrandoFormTurno(false);
      setNombreEvento('');
      setAreaTurno('');
      setEmpresaTurno('');
      setTurnoEditando(null);
    } catch (err) {
      console.error(err);
      setError(turnoEditando ? 'No se pudo actualizar el turno' : 'No se pudo agregar el turno');
    } finally {
      setCargandoTurnoNuevo(false);
    }
  };

  const handleEditarTurnoClick = (turno) => {
    setTurnoEditando(turno);
    if (turno.fecha) setFechaTurno(turno.fecha);
    if (turno.hora_entrada) {
      const d = new Date(turno.hora_entrada);
      setHoraEntradaTurno(d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }
    if (turno.hora_salida) {
      const d = new Date(turno.hora_salida);
      setHoraSalidaTurno(d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }));
    } else {
      setHoraSalidaTurno('');
    }
    setNombreEvento(turno.nombre_evento || '');
    setAreaTurno(turno.area || '');
    setEmpresaTurno(turno.empresa_id || '');
    setMostrandoFormTurno(true);
  };

  const handleEliminarTurno = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este turno?')) return;
    try {
      setTurnoEliminandoId(id);
      setError('');
      await api.delete(`/turnos/${id}`);
      setTurnos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar el turno');
    } finally {
      setTurnoEliminandoId(null);
    }
  };

  const handleDuplicarTurno = async (id) => {
    const nuevaFecha = prompt('Ingresa la nueva fecha (YYYY-MM-DD):');
    if (!nuevaFecha) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) {
      setError('Formato de fecha inválido. Usa YYYY-MM-DD');
      return;
    }
    try {
      setError('');
      const res = await api.post(`/turnos/${id}/duplicar`, { fecha: nuevaFecha });
      if (res.data) {
        setTurnos((prev) => [...prev, res.data]);
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo duplicar el turno');
    }
  };

  // Export
  const validarRangoExport = () => {
    if ((fechaDesdeExport && !fechaHastaExport) || (!fechaDesdeExport && fechaHastaExport)) {
      setError('Para exportar por periodo debes elegir ambas fechas: desde y hasta.');
      return false;
    }
    if (fechaDesdeExport && fechaHastaExport && fechaDesdeExport > fechaHastaExport) {
      setError('La fecha "desde" no puede ser mayor que la fecha "hasta".');
      return false;
    }
    return true;
  };

  const handleExportExcel = async () => {
    if (!empleadoSeleccionado) { setError('Selecciona un empleado antes de exportar'); return; }
    if (!validarRangoExport()) return;
    try {
      setError('');
      const params = {};
      if (fechaDesdeExport && fechaHastaExport) {
        params.desde = fechaDesdeExport; params.hasta = fechaHastaExport;
      } else {
        const [anio, mes] = mesSeleccionado.split('-');
        params.anio = anio; params.mes = mes;
      }
      if (empresaFiltro) params.empresa_id = empresaFiltro;
      const res = await api.get(`/empleados/${empleadoSeleccionado.id}/turnos/excel`, { params, responseType: 'blob' });
      const labelPeriodo = fechaDesdeExport && fechaHastaExport ? `${fechaDesdeExport}_a_${fechaHastaExport}` : mesSeleccionado;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `turnos_${empleadoSeleccionado.nombre.replace(/\s+/g, '_')}_${labelPeriodo}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err); setError('No se pudo exportar a Excel');
    }
  };

  const handleExportPDF = async () => {
    if (!empleadoSeleccionado) { setError('Selecciona un empleado antes de exportar'); return; }
    if (!validarRangoExport()) return;
    try {
      setError('');
      const params = {};
      if (fechaDesdeExport && fechaHastaExport) {
        params.desde = fechaDesdeExport; params.hasta = fechaHastaExport;
      } else {
        const [anio, mes] = mesSeleccionado.split('-');
        params.anio = anio; params.mes = mes;
      }
      if (empresaFiltro) params.empresa_id = empresaFiltro;
      const res = await api.get(`/empleados/${empleadoSeleccionado.id}/turnos/pdf`, { params, responseType: 'blob' });
      const labelPeriodo = fechaDesdeExport && fechaHastaExport ? `${fechaDesdeExport}_a_${fechaHastaExport}` : mesSeleccionado;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `turnos_${empleadoSeleccionado.nombre.replace(/\s+/g, '_')}_${labelPeriodo}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err); setError('No se pudo exportar a PDF');
    }
  };

  const puedeExportar = !!empleadoSeleccionado && turnos.length > 0;

  return (
    <div className="h-full flex animate-fade-in">
      <EmpleadosSidebar
        empleados={empleados}
        empleadoSeleccionado={empleadoSeleccionado}
        cargandoEmpleados={cargandoEmpleados}
        mostrandoFormEmpleado={mostrandoFormEmpleado}
        setMostrandoFormEmpleado={setMostrandoFormEmpleado}
        nuevoNombre={nuevoNombre}
        setNuevoNombre={setNuevoNombre}
        cargandoNuevo={cargandoNuevo}
        onCrearEmpleado={handleCrearEmpleado}
        onSelectEmpleado={setEmpleadoSeleccionado}
        onEliminarEmpleado={handleEliminarEmpleado}
        empleadoEliminandoId={empleadoEliminandoId}
        onRenombrarEmpleado={handleRenombrarEmpleado}
        empleadoRenombrandoId={empleadoRenombrandoId}
        onActualizarEmpleado={handleActualizarEmpleado}
      />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {empleadoSeleccionado ? `Turnos de ${empleadoSeleccionado.nombre}` : 'Selecciona un empleado'}
                </h1>
                <p className="text-xs text-slate-500">
                  {empleadoSeleccionado
                    ? `${turnos.length} turno${turnos.length !== 1 ? 's' : ''} en el periodo`
                    : 'Elige un empleado de la lista lateral'}
                </p>
              </div>
            </div>
          </div>

          <TurnoFiltersBar
            empleadoSeleccionado={empleadoSeleccionado}
            empresas={empresas}
            empresaFiltro={empresaFiltro}
            setEmpresaFiltro={setEmpresaFiltro}
            mesSeleccionado={mesSeleccionado}
            setMesSeleccionado={setMesSeleccionado}
            fechaDesdeExport={fechaDesdeExport}
            setFechaDesdeExport={setFechaDesdeExport}
            fechaHastaExport={fechaHastaExport}
            setFechaHastaExport={setFechaHastaExport}
            onClickAgregarTurno={() => {
              setMostrandoFormTurno(true);
              setEmpresaTurno(empresaFiltro || '');
              setTurnoEditando(null);
            }}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            puedeExportar={puedeExportar}
            nuevaEmpresa={nuevaEmpresa}
            setNuevaEmpresa={setNuevaEmpresa}
            editandoEmpresaId={editandoEmpresaId}
            setEditandoEmpresaId={setEditandoEmpresaId}
            editandoEmpresaNombre={editandoEmpresaNombre}
            setEditandoEmpresaNombre={setEditandoEmpresaNombre}
            onCrearEmpresa={handleCrearEmpresa}
            onRenombrarEmpresa={handleRenombrarEmpresa}
            onEliminarEmpresa={handleEliminarEmpresa}
          />

          {mostrandoFormTurno && (
            <TurnoForm
              empresas={empresas}
              empresaTurno={empresaTurno}
              setEmpresaTurno={setEmpresaTurno}
              fechaTurno={fechaTurno}
              setFechaTurno={setFechaTurno}
              horaEntradaTurno={horaEntradaTurno}
              setHoraEntradaTurno={setHoraEntradaTurno}
              horaSalidaTurno={horaSalidaTurno}
              setHoraSalidaTurno={setHoraSalidaTurno}
              nombreEvento={nombreEvento}
              setNombreEvento={setNombreEvento}
              areaTurno={areaTurno}
              setAreaTurno={setAreaTurno}
              cargandoTurnoNuevo={cargandoTurnoNuevo}
              onSubmit={handleGuardarTurno}
              onCancel={() => { setMostrandoFormTurno(false); setTurnoEditando(null); }}
              modoEdicion={!!turnoEditando}
            />
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-slide-down">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <TurnosTable
            turnos={turnos}
            cargandoTurnos={cargandoTurnos}
            turnoEliminandoId={turnoEliminandoId}
            onEliminarTurno={handleEliminarTurno}
            onEditarTurno={handleEditarTurnoClick}
            onDuplicarTurno={handleDuplicarTurno}
          />
        </div>
      </main>
    </div>
  );
};

export default Home;
