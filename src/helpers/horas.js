const TARIFA_HORA_FALLBACK = 4750;
const TARIFA_HORA_EXTRA_FALLBACK = 4750;

export function obtenerHorasTotales(horaEntrada, horaSalida) {
  if (!horaEntrada || !horaSalida) return null;

  const ini = new Date(horaEntrada);
  let fin = new Date(horaSalida);

  if (fin <= ini) {
    fin = new Date(fin.getTime() + 24 * 60 * 60 * 1000);
  }

  const diffMs = fin - ini;
  if (diffMs <= 0) return null;
  return diffMs / (1000 * 60 * 60);
}

export function calcularHorasBase(horaEntrada, horaSalida) {
  const horas = obtenerHorasTotales(horaEntrada, horaSalida);
  if (horas === null) return 0;
  return Math.min(horas, 8);
}

export function calcularHorasExtra(horaEntrada, horaSalida) {
  const horas = obtenerHorasTotales(horaEntrada, horaSalida);
  if (horas === null) return 0;
  const base = Math.min(horas, 8);
  return Math.max(horas - base, 0);
}

export function calcularValoresTurno(turno) {
  const tarifaHora = turno.tarifa_hora != null ? turno.tarifa_hora : TARIFA_HORA_FALLBACK;
  const tarifaHoraExtra = turno.tarifa_hora_extra != null ? turno.tarifa_hora_extra : TARIFA_HORA_EXTRA_FALLBACK;

  const horasTrab =
    typeof turno.horas_trabajadas === 'number'
      ? turno.horas_trabajadas
      : calcularHorasBase(turno.hora_entrada, turno.hora_salida);

  const horasExtra =
    typeof turno.horas_extra === 'number'
      ? turno.horas_extra
      : calcularHorasExtra(turno.hora_entrada, turno.hora_salida);

  const valorExtra =
    typeof turno.valor_horas_extra === 'number'
      ? turno.valor_horas_extra
      : horasExtra * tarifaHoraExtra;

  const valorFijo =
    typeof turno.valor_fijo === 'number'
      ? turno.valor_fijo
      : horasTrab * tarifaHora;

  const sueldoTotal =
    typeof turno.sueldo_total === 'number'
      ? turno.sueldo_total
      : valorExtra + valorFijo;

  return { horasTrab, horasExtra, valorExtra, valorFijo, sueldoTotal };
}

export function formatearMoneda(valor) {
  if (valor == null) return '-';
  return valor.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });
}
