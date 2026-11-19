const pad = (n) => String(n).padStart(2, '0');

// ISO -> valor para <input type="datetime-local"> (hora local del navegador)
export function isoAInputLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Valor de <input type="datetime-local"> -> ISO (UTC)
export function inputLocalAIso(valor) {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatearHoraCorta(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatearFechaCorta(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Fecha YYYY-MM-DD (de la API) -> dd-mm-aaaa sin pasar por Date (evita desfase UTC)
export function formatearFechaISO(fecha) {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  return `${d}-${m}-${y}`;
}

// Horas decimales -> "8 h 30 min"
export function formatearDuracion(horas) {
  if (horas == null || Number.isNaN(horas)) return '—';
  const totalMin = Math.max(0, Math.round(horas * 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function horasDesde(iso, ahora = Date.now()) {
  if (!iso) return 0;
  return Math.max(0, (ahora - new Date(iso).getTime()) / 3600000);
}

export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function haceDiasISO(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function mensajeError(err, porDefecto) {
  return err?.response?.data?.error || porDefecto;
}

// Umbral para alertar asistencias abiertas sospechosamente largas
export const HORAS_ALERTA_ABIERTA = 12;

// --- Geolocalización ---

export const MENSAJES_GEO = {
  1: 'Permiso de ubicación denegado. Habilítalo en la configuración del navegador para este sitio y recarga la página.',
  2: 'No se pudo determinar la ubicación. Verifica que el GPS / servicios de ubicación estén activos.',
  3: 'La ubicación tardó demasiado. Intenta de nuevo.',
  inseguro: 'La ubicación solo funciona en conexiones seguras (https). Abre el kiosco desde la dirección https del sistema.',
  noSoportado: 'Este dispositivo o navegador no permite obtener la ubicación.',
};

export function geolocalizacionDisponible() {
  if (typeof window === 'undefined') return 'noSoportado';
  if (!window.isSecureContext) return 'inseguro';
  if (!('geolocation' in navigator)) return 'noSoportado';
  return null;
}

/**
 * Obtiene la posición actual. Resuelve { lat, lng, precision_m, obtenida_en };
 * rechaza con Error cuyo `message` es apto para mostrar al usuario.
 */
export function obtenerUbicacion({ maxEdadMs = 30000, timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const problema = geolocalizacionDisponible();
    if (problema) return reject(new Error(MENSAJES_GEO[problema]));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        precision_m: Math.round(p.coords.accuracy),
        obtenida_en: Date.now(),
      }),
      (err) => reject(new Error(MENSAJES_GEO[err.code] || 'No se pudo obtener la ubicación.')),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: maxEdadMs }
    );
  });
}

export function formatearDistancia(m) {
  if (m == null) return '';
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(m)} m`;
}

export function urlMapa(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
