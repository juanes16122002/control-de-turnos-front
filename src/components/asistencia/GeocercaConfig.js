import React, { useEffect, useState } from 'react';
import { MapPin, LocateFixed, ExternalLink, Save, CircleAlert, CircleCheck, Info, Crosshair, LoaderCircle } from 'lucide-react';
import api from '../../api';
import { formatearDistancia, mensajeError, obtenerUbicacion, urlMapa } from '../../helpers/asistencia';

// Haversine (metros): solo para la prueba local; el servidor hace la validación real
function distanciaMetros(lat1, lng1, lat2, lng2) {
  const r = (g) => (g * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(a)));
}

const Interruptor = ({ activo, onChange, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={activo}
    onClick={() => onChange(!activo)}
    className={`relative shrink-0 w-11 h-6 rounded-full border transition-colors after:absolute after:-inset-3 after:content-[''] ${activo ? 'bg-white border-white' : 'bg-neutral-800 border-white/15'}`}
  >
    <span className={`absolute top-0.5 w-[18px] h-[18px] rounded-full transition-all ${activo ? 'left-[22px] bg-black' : 'left-0.5 bg-neutral-400'}`} />
  </button>
);

const GeocercaConfig = ({ onError }) => {
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [ubicando, setUbicando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [prueba, setPrueba] = useState(null); // { distancia, precision } | { error }

  useEffect(() => {
    api.get('/configuracion/geocerca')
      .then((r) => setForm({
        ...r.data,
        lat: r.data.lat ?? '',
        lng: r.data.lng ?? '',
      }))
      .catch((err) => onError(mensajeError(err, 'No se pudo cargar la configuración de ubicación')));
  }, [onError]);

  if (!form) return <div className="skeleton h-64 rounded-xl" />;

  const set = (campo) => (e) => setForm({ ...form, [campo]: e?.target ? e.target.value : e });
  const tieneCoordenadas = form.lat !== '' && form.lng !== '';

  const usarMiUbicacion = async () => {
    try {
      setUbicando(true);
      setAviso('');
      const pos = await obtenerUbicacion({ maxEdadMs: 0, timeoutMs: 20000 });
      setForm((f) => ({ ...f, lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) }));
      setAviso(pos.precision_m > 50
        ? `Ubicación tomada con precisión de ±${pos.precision_m} m. Para mayor exactitud, hazlo desde un celular con GPS dentro del local.`
        : `Ubicación tomada (±${pos.precision_m} m). Revisa el punto en el mapa y guarda.`);
    } catch (err) {
      onError(err.message);
    } finally {
      setUbicando(false);
    }
  };

  const probarDesdeAqui = async () => {
    try {
      setPrueba({ cargando: true });
      const pos = await obtenerUbicacion({ maxEdadMs: 0, timeoutMs: 20000 });
      setPrueba({ distancia: Math.round(distanciaMetros(Number(form.lat), Number(form.lng), pos.lat, pos.lng)), precision: pos.precision_m });
    } catch (err) {
      setPrueba({ error: err.message });
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (form.activa && !tieneCoordenadas) return onError('Para activar la restricción debes indicar la ubicación del local.');
    try {
      setGuardando(true);
      setAviso('');
      const res = await api.put('/configuracion/geocerca', {
        activa: form.activa,
        lat: form.lat === '' ? null : Number(form.lat),
        lng: form.lng === '' ? null : Number(form.lng),
        radio_m: Number(form.radio_m),
        precision_max_m: Number(form.precision_max_m),
        nombre: form.nombre,
      });
      setForm({ ...res.data, lat: res.data.lat ?? '', lng: res.data.lng ?? '' });
      setAviso(res.data.activa
        ? 'Guardado. Desde ahora solo se podrá marcar asistencia dentro del radio configurado.'
        : 'Guardado. La restricción por ubicación está desactivada.');
    } catch (err) {
      onError(mensajeError(err, 'No se pudo guardar la configuración'));
    } finally {
      setGuardando(false);
    }
  };

  const dentro = prueba?.distancia != null && prueba.distancia <= Number(form.radio_m);
  const precisionOk = prueba?.precision != null && prueba.precision <= Number(form.precision_max_m);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <form onSubmit={guardar} className="card p-6 space-y-5 lg:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <label htmlFor="geo-activa" className="text-sm font-medium text-white cursor-pointer">Exigir ubicación para marcar</label>
            <p className="text-xs text-neutral-500 mt-0.5">
              Solo se aceptarán marcas hechas dentro del radio del local. Las correcciones del administrador no se ven afectadas.
            </p>
          </div>
          <Interruptor id="geo-activa" activo={form.activa} onChange={set('activa')} />
        </div>

        <div>
          <label className="label" htmlFor="geo-nombre">Nombre del lugar</label>
          <input id="geo-nombre" className="input" maxLength={120} value={form.nombre} onChange={set('nombre')} placeholder="Ej: Basel Venue" />
        </div>

        <div>
          <div className="flex items-end justify-between gap-3 mb-1.5">
            <span className="label mb-0">Ubicación del local</span>
            <button type="button" className="btn-secondary btn-sm" onClick={usarMiUbicacion} disabled={ubicando}>
              {ubicando ? <LoaderCircle size={14} className="animate-spin" /> : <LocateFixed size={14} />}
              Usar mi ubicación actual
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input font-mono text-xs" inputMode="decimal" aria-label="Latitud" placeholder="Latitud (ej: -33.4378)" value={form.lat} onChange={set('lat')} />
            <input className="input font-mono text-xs" inputMode="decimal" aria-label="Longitud" placeholder="Longitud (ej: -70.6505)" value={form.lng} onChange={set('lng')} />
          </div>
          {tieneCoordenadas && (
            <a href={urlMapa(form.lat, form.lng)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white mt-1 py-2">
              <ExternalLink size={12} /> Ver el punto en Google Maps
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="geo-radio">Radio permitido (metros)</label>
            <input id="geo-radio" type="number" min={20} max={5000} className="input" value={form.radio_m} onChange={set('radio_m')} />
            <p className="text-[11px] text-neutral-500 mt-1">Recomendado: 100–300 m. En interiores el GPS puede desviarse decenas de metros.</p>
          </div>
          <div>
            <label className="label" htmlFor="geo-prec">Precisión mínima exigida (± metros)</label>
            <input id="geo-prec" type="number" min={10} max={5000} className="input" value={form.precision_max_m} onChange={set('precision_max_m')} />
            <p className="text-[11px] text-neutral-500 mt-1">Se rechazan ubicaciones con un margen de error mayor (ej. sin GPS).</p>
          </div>
        </div>

        {aviso && (
          <div className="flex items-start gap-2 text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            <CircleCheck size={16} className="shrink-0 mt-0.5" /> {aviso}
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={guardando}>
            <Save size={16} /> {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <div className="card p-5">
          <h3 className="flex items-center gap-2 text-sm font-medium text-white mb-2"><Crosshair size={16} /> Probar desde este dispositivo</h3>
          <p className="text-xs text-neutral-500 mb-3">Comprueba si el dispositivo donde estás (por ejemplo, la tablet del kiosco) quedaría dentro del radio.</p>
          <button type="button" className="btn-secondary btn-sm w-full" onClick={probarDesdeAqui} disabled={!tieneCoordenadas || prueba?.cargando}>
            {prueba?.cargando ? <LoaderCircle size={14} className="animate-spin" /> : <MapPin size={14} />} Probar ubicación
          </button>
          {prueba?.error && <p className="text-xs text-amber-300 mt-3">{prueba.error}</p>}
          {prueba?.distancia != null && (
            <div className={`text-xs mt-3 rounded-lg px-3 py-2 border ${dentro && precisionOk ? 'text-emerald-200 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-200 bg-amber-500/10 border-amber-500/20'}`}>
              A <b>{formatearDistancia(prueba.distancia)}</b> del punto, precisión ±{prueba.precision} m.<br />
              {dentro && precisionOk && 'Podría marcar asistencia desde aquí.'}
              {!dentro && 'Fuera del radio: no podría marcar desde aquí.'}
              {dentro && !precisionOk && 'Dentro del radio, pero la precisión es insuficiente.'}
            </div>
          )}
        </div>

        <div className="card p-5 text-xs text-neutral-400 space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-white"><Info size={16} /> Cómo funciona</h3>
          <p>Al marcar, el kiosco pide la ubicación del dispositivo y el <b className="text-neutral-200">servidor</b> calcula la distancia al local. La distancia queda registrada en cada marca.</p>
          <p>El navegador pedirá permiso de ubicación la primera vez. El kiosco debe abrirse por <b className="text-neutral-200">https</b>.</p>
          <p className="flex gap-1.5 text-amber-300/80">
            <CircleAlert size={13} className="shrink-0 mt-0.5" />
            Es una barrera disuasiva: un usuario con conocimientos técnicos puede falsificar su ubicación. Revisa el historial ante dudas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeocercaConfig;
