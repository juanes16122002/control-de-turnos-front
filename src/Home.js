import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from './api';
import { mensajeError } from './helpers/asistencia';

import EmpleadosSidebar from './components/EmpleadosSidebar';
import TurnoFiltersBar from './components/TurnoFiltersBar';
import TurnoForm from './components/TurnoForm';
import TurnosTable from './components/TurnosTable';
import { AlertCircle, CalendarDays } from 'lucide-react';

const Home = () => {
  // "Turnos" desde la sección Técnicos llega con ?tecnico=ID: se abre con ese técnico seleccionado
  const [searchParams] = useSearchParams();
  const tecnicoInicial = Number(searchParams.get('tecnico')) || null;
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

  // Carga inicial
  useEffect(() => {
    const fetchEmpleados = async () => {
      try {
        setCargandoEmpleados(true);
        setError('');
        const res = await api.get('/empleados');
        setEmpleados(res.data);
        if (res.data.length > 0) {
          setEmpleadoSeleccionado(res.data.find((e) => e.id === tecnicoInicial) || res.data[0]);
        }
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los técnicos');
      } finally {
        setCargandoEmpleados(false);
      }
    };
    fetchEmpleados();
  }, [tecnicoInicial]);

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
        setError('No se pudieron cargar los turnos del técnico');
      } finally {
        setCargandoTurnos(false);
      }
    };
    fetchTurnos();
  }, [empleadoSeleccionado, mesSeleccionado, empresaFiltro]);

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
      setError(mensajeError(err, 'No se pudo crear el técnico'));
    } finally {
      setCargandoNuevo(false);
    }
  };

  // Handlers turnos
  const handleGuardarTurno = async (e) => {
    e.preventDefault();
    if (!empleadoSeleccionado) { setError('Selecciona un técnico antes de agregar un turno'); return; }
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
    if (!empleadoSeleccionado) { setError('Selecciona un técnico antes de exportar'); return; }
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
    if (!empleadoSeleccionado) { setError('Selecciona un técnico antes de exportar'); return; }
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
    <div className="flex flex-col md:flex-row md:min-h-screen animate-fade-in">
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
      />

      <main className="flex-1 min-w-0 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="icon-tile">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="page-title">
                  {empleadoSeleccionado ? `Turnos de ${empleadoSeleccionado.nombre}` : 'Selecciona un técnico'}
                </h1>
                <p className="text-xs text-neutral-500">
                  {empleadoSeleccionado
                    ? `${turnos.length} turno${turnos.length !== 1 ? 's' : ''} en el periodo`
                    : 'Elige un técnico de la lista lateral'}
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
          />

          {mostrandoFormTurno && (
            <TurnoForm
              empresas={empresas}
              empresaTurno={empresaTurno}
              setEmpresaTurno={setEmpresaTurno}
              onEmpresaCreada={(emp) => setEmpresas((prev) => [...prev, emp].sort((a, b) => a.nombre.localeCompare(b.nombre)))}
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
