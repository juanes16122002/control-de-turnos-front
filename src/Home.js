// src/Home.js
import React, { useEffect, useState } from 'react';
import api from './api';

import EmpleadosSidebar from './components/EmpleadosSidebar';
import TurnoFiltersBar from './components/TurnoFiltersBar';
import TurnoForm from './components/TurnoForm';
import TurnosTable from './components/TurnosTable';

const Home = () => {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [turnos, setTurnos] = useState([]);

  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`; // formato input type="month"
  });

  const [empresas, setEmpresas] = useState([]);
  const [empresaFiltro, setEmpresaFiltro] = useState(''); // '' = todas
  const [empresaTurno, setEmpresaTurno] = useState('');   // para el formulario

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

  // Rango de fechas solo para exportar
  const [fechaDesdeExport, setFechaDesdeExport] = useState('');
  const [fechaHastaExport, setFechaHastaExport] = useState('');

  const [error, setError] = useState('');

  // NUEVO: turno que se está editando (null = creando)
  const [turnoEditando, setTurnoEditando] = useState(null);

  // =========================
  // Helpers de cálculo horas
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

  // Horas trabajadas base (máx 8)
  const calcularHoras = (horaEntrada, horaSalida) => {
    const horas = obtenerHorasTotales(horaEntrada, horaSalida);
    if (horas === null) return '-';
    const base = Math.min(horas, 8);
    return base.toFixed(2);
  };

  // Horas extra = total - base (base máx 8)
  const calcularHorasExtra = (horaEntrada, horaSalida) => {
    const horas = obtenerHorasTotales(horaEntrada, horaSalida);
    if (horas === null) return '-';
    const base = Math.min(horas, 8);
    const extra = Math.max(horas - base, 0);
    return extra.toFixed(2);
  };

  // =========================
  // Carga inicial de datos
  // =========================

  // Empleados
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

  // Empresas
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

  // Turnos (empleado + mes + empresaFiltro)
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

        const res = await api.get(
          `/empleados/${empleadoSeleccionado.id}/turnos`,
          { params }
        );
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

  // =========================
  // Handlers empleados
  // =========================

  const handleCrearEmpleado = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    try {
      setCargandoNuevo(true);
      setError('');

      const res = await api.post('/empleados', {
        nombre: nuevoNombre.trim(),
      });

      const nuevo = res.data;

      setEmpleados((prev) =>
        [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
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
    const confirmar = window.confirm(
      '¿Seguro que deseas eliminar este empleado y todos sus turnos?'
    );
    if (!confirmar) return;

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

  // Renombrar empleado (para usar desde el sidebar)
  const handleRenombrarEmpleado = async (id, nuevoNombreEmpleado) => {
    if (!nuevoNombreEmpleado.trim()) return;

    try {
      setEmpleadoRenombrandoId(id);
      setError('');

      await api.put(`/empleados/${id}`, {
        nombre: nuevoNombreEmpleado.trim(),
      });

      // Actualizar lista de empleados
      setEmpleados((prev) =>
        [...prev]
          .map((e) =>
            e.id === id ? { ...e, nombre: nuevoNombreEmpleado.trim() } : e
          )
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
      );

      // Actualizar si es el seleccionado
      if (empleadoSeleccionado?.id === id) {
        setEmpleadoSeleccionado((prev) => ({
          ...prev,
          nombre: nuevoNombreEmpleado.trim(),
        }));
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo editar el nombre del empleado');
    } finally {
      setEmpleadoRenombrandoId(null);
    }
  };

  // =========================
  // Handlers turnos
  // =========================

  const handleGuardarTurno = async (e) => {
    e.preventDefault();

    if (!empleadoSeleccionado) {
      setError('Selecciona un empleado antes de agregar un turno');
      return;
    }

    if (!fechaTurno || !horaEntradaTurno) {
      setError('La fecha y la hora de entrada son obligatorias');
      return;
    }

    if (!empresaTurno) {
      setError('La empresa es obligatoria para el turno');
      return;
    }

    if (!nombreEvento.trim()) {
      setError('El nombre del evento es obligatorio');
      return;
    }

    if (!areaTurno.trim()) {
      setError('El área es obligatoria');
      return;
    }

    try {
      setCargandoTurnoNuevo(true);
      setError('');

      const horaEntradaISO = new Date(
        `${fechaTurno}T${horaEntradaTurno}:00`
      ).toISOString();

      const horaSalidaISO = horaSalidaTurno
        ? new Date(`${fechaTurno}T${horaSalidaTurno}:00`).toISOString()
        : null;

      const payload = {
        empleado_id: empleadoSeleccionado.id,
        fecha: fechaTurno,
        hora_entrada: horaEntradaISO,
        hora_salida: horaSalidaISO,
        empresa_id: empresaTurno,
        nombre_evento: nombreEvento.trim(),
        area: areaTurno.trim(),
      };

      // SI HAY turnoEditando => PUT, SINO => POST
      if (turnoEditando) {
        await api.put(`/turnos/${turnoEditando.id}`, payload);
      } else {
        await api.post('/turnos', payload);
      }

      // Recargar turnos del mes actual
      const [anio, mes] = mesSeleccionado.split('-');
      const params = { anio, mes };
      if (empresaFiltro) params.empresa_id = empresaFiltro;

      const res = await api.get(
        `/empleados/${empleadoSeleccionado.id}/turnos`,
        { params }
      );

      setTurnos(res.data);
      setMostrandoFormTurno(false);
      setNombreEvento('');
      setAreaTurno('');
      setEmpresaTurno('');
      setTurnoEditando(null); // salimos de modo edición
    } catch (err) {
      console.error(err);
      setError(
        turnoEditando
          ? 'No se pudo actualizar el turno'
          : 'No se pudo agregar el turno'
      );
    } finally {
      setCargandoTurnoNuevo(false);
    }
  };

  // Cuando se pulsa el botón "Editar" en la tabla
  const handleEditarTurnoClick = (turno) => {
    setTurnoEditando(turno);

    // Fecha: usamos el campo fecha (YYYY-MM-DD)
    if (turno.fecha) {
      setFechaTurno(turno.fecha);
    }

    // Hora entrada / salida en formato HH:mm local
    if (turno.hora_entrada) {
      const d = new Date(turno.hora_entrada);
      const hhmm = d.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setHoraEntradaTurno(hhmm);
    }

    if (turno.hora_salida) {
      const d = new Date(turno.hora_salida);
      const hhmm = d.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setHoraSalidaTurno(hhmm);
    } else {
      setHoraSalidaTurno('');
    }

    setNombreEvento(turno.nombre_evento || '');
    setAreaTurno(turno.area || '');
    setEmpresaTurno(turno.empresa_id || '');

    setMostrandoFormTurno(true);
  };

  const handleEliminarTurno = async (id) => {
    const confirmar = window.confirm(
      '¿Seguro que deseas eliminar este turno?'
    );
    if (!confirmar) return;

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

  // =========================
  // Exportar Excel / PDF
  // =========================

  const validarRangoExport = () => {
    if (
      (fechaDesdeExport && !fechaHastaExport) ||
      (!fechaDesdeExport && fechaHastaExport)
    ) {
      setError(
        'Para exportar por periodo debes elegir ambas fechas: desde y hasta.'
      );
      return false;
    }

    if (
      fechaDesdeExport &&
      fechaHastaExport &&
      fechaDesdeExport > fechaHastaExport
    ) {
      setError('La fecha "desde" no puede ser mayor que la fecha "hasta".');
      return false;
    }

    return true;
  };

  const handleExportExcel = async () => {
    if (!empleadoSeleccionado) {
      setError('Selecciona un empleado antes de exportar');
      return;
    }

    if (!validarRangoExport()) return;

    try {
      setError('');

      const params = {};
      if (fechaDesdeExport && fechaHastaExport) {
        params.desde = fechaDesdeExport;
        params.hasta = fechaHastaExport;
      } else {
        const [anio, mes] = mesSeleccionado.split('-');
        params.anio = anio;
        params.mes = mes;
      }
      if (empresaFiltro) params.empresa_id = empresaFiltro;

      const res = await api.get(
        `/empleados/${empleadoSeleccionado.id}/turnos/excel`,
        {
          params,
          responseType: 'blob',
        }
      );

      const labelPeriodo =
        fechaDesdeExport && fechaHastaExport
          ? `${fechaDesdeExport}_a_${fechaHastaExport}`
          : mesSeleccionado;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `turnos_${empleadoSeleccionado.nombre.replace(
        /\s+/g,
        '_'
      )}_${labelPeriodo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('No se pudo exportar a Excel');
    }
  };

  const handleExportPDF = async () => {
    if (!empleadoSeleccionado) {
      setError('Selecciona un empleado antes de exportar');
      return;
    }

    if (!validarRangoExport()) return;

    try {
      setError('');

      const params = {};
      if (fechaDesdeExport && fechaHastaExport) {
        params.desde = fechaDesdeExport;
        params.hasta = fechaHastaExport;
      } else {
        const [anio, mes] = mesSeleccionado.split('-');
        params.anio = anio;
        params.mes = mes;
      }
      if (empresaFiltro) params.empresa_id = empresaFiltro;

      const res = await api.get(
        `/empleados/${empleadoSeleccionado.id}/turnos/pdf`,
        {
          params,
          responseType: 'blob',
        }
      );

      const labelPeriodo =
        fechaDesdeExport && fechaHastaExport
          ? `${fechaDesdeExport}_a_${fechaHastaExport}`
          : mesSeleccionado;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `turnos_${empleadoSeleccionado.nombre.replace(
        /\s+/g,
        '_'
      )}_${labelPeriodo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('No se pudo exportar a PDF');
    }
  };

  const puedeExportar = !!empleadoSeleccionado && turnos.length > 0;

  // =========================
  // Render
  // =========================

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-zinc-800 text-white flex">
      {/* Panel lateral: empleados */}
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
        // props para edición en sidebar
        onRenombrarEmpleado={handleRenombrarEmpleado}
        empleadoRenombrandoId={empleadoRenombrandoId}
      />

      {/* Panel principal */}
      <main className="flex-1 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {empleadoSeleccionado
                ? `Turnos de ${empleadoSeleccionado.nombre}`
                : 'Selecciona un empleado'}
            </h1>
            <p className="text-sm text-zinc-400">
              Visualiza los turnos del empleado por mes, empresa, área y evento.
            </p>
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
              setTurnoEditando(null); // modo creación
            }}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            puedeExportar={puedeExportar}
          />
        </div>

        {/* Formulario de nuevo turno / edición */}
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
            onCancel={() => {
              setMostrandoFormTurno(false);
              setTurnoEditando(null);
            }}
            modoEdicion={!!turnoEditando} // NUEVO
          />
        )}

        {/* Errores */}
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-950/40 border border-red-500/40 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* Tabla de turnos */}
        <TurnosTable
          turnos={turnos}
          cargandoTurnos={cargandoTurnos}
          calcularHoras={calcularHoras}
          calcularHorasExtra={calcularHorasExtra}
          turnoEliminandoId={turnoEliminandoId}
          onEliminarTurno={handleEliminarTurno}
          onEditarTurno={handleEditarTurnoClick} // <<--- AQUÍ SE CONECTA
        />
      </main>
    </div>
  );
};

export default Home;
