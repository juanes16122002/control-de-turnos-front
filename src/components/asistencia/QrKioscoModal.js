import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Printer, Download, Copy, Check, TriangleAlert, MapPin } from 'lucide-react';
import api from '../../api';
import Modal from './Modal';
import BrandLogo from '../BrandLogo';

// Corrección de errores alta (≈30 %): permite tapar el centro con el "^" de la marca
const OPCIONES_QR = { errorCorrectionLevel: 'H', margin: 1, color: { dark: '#000000', light: '#ffffff' } };
// Fracción del lado del QR que ocupa la marca central (muy por debajo del 30 % recuperable)
const PROPORCION_MARCA = 0.2;

export function urlKiosco() {
  return `${window.location.origin}/asistencia`;
}

const esLocal = () => /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(window.location.hostname);

// Marca central: cuadro blanco con el chevrón "^" del logo
const MarcaCentral = () => (
  <div
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[12%] flex items-center justify-center"
    style={{ width: `${PROPORCION_MARCA * 100}%`, height: `${PROPORCION_MARCA * 100}%` }}
    aria-hidden="true"
  >
    <svg viewBox="0 0 20 12" className="w-[62%]" fill="none">
      <polyline points="2,10.5 10,2.5 18,10.5" stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const QrSvg = ({ svg, className = '' }) => (
  <div className={`relative aspect-square ${className}`}>
    {/* SVG generado localmente por la librería qrcode a partir de nuestra URL */}
    <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: svg }} />
    <MarcaCentral />
  </div>
);

// PNG de alta resolución con la marca central dibujada
async function generarPng(url, lado = 1200) {
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, url, { ...OPCIONES_QR, width: lado });
  const ctx = canvas.getContext('2d');
  const m = canvas.width * PROPORCION_MARCA;
  const x = (canvas.width - m) / 2;
  const r = m * 0.12;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x + r, x);
  ctx.arcTo(x + m, x, x + m, x + m, r);
  ctx.arcTo(x + m, x + m, x, x + m, r);
  ctx.arcTo(x, x + m, x, x, r);
  ctx.arcTo(x, x, x + m, x, r);
  ctx.fill();
  // Chevrón (mismo trazo que el SVG: viewBox 20x12 escalado al 62 % del cuadro)
  const w = m * 0.62;
  const k = w / 20;
  const ox = x + (m - w) / 2;
  const oy = x + (m - 12 * k) / 2;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.6 * k;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(ox + 2 * k, oy + 10.5 * k);
  ctx.lineTo(ox + 10 * k, oy + 2.5 * k);
  ctx.lineTo(ox + 18 * k, oy + 10.5 * k);
  ctx.stroke();
  return canvas.toDataURL('image/png');
}

// Cartel A4 para imprimir: solo visible en @media print (ver index.css)
const CartelImprimible = ({ svg, url, geocercaActiva, nombreLugar }) => createPortal(
  <div className="print-area hidden bg-white text-black" style={{ width: '210mm', height: '297mm' }}>
    <div className="h-full flex flex-col items-center justify-between text-center" style={{ padding: '22mm 20mm 16mm' }}>
      <div className="flex flex-col items-center">
        <BrandLogo size="xl" invertido />
        <span className="block w-12 h-px bg-black/30 mt-10 mb-5" />
        <p className="font-display text-sm uppercase tracking-brand text-neutral-700">Registro de asistencia</p>
      </div>

      <div className="flex flex-col items-center">
        <p className="font-display text-3xl font-light tracking-wide mb-8">Escanea para marcar tu entrada y salida</p>
        <QrSvg svg={svg} className="w-[105mm]" />
      </div>

      <ol className="grid grid-cols-3 gap-6 text-left w-full text-[13px] leading-snug">
        {[
          ['Escanea', 'Apunta la cámara del celular al código y abre el enlace.'],
          ['Identifícate', 'Toca tu nombre y escribe tu PIN personal.'],
          ['Marca', 'Pulsa Entrada al llegar o Salida al irte.'],
        ].map(([titulo, texto], i) => (
          <li key={titulo} className="border-t border-black/20 pt-3">
            <span className="font-display text-xs tracking-brand text-neutral-500">0{i + 1}</span>
            <p className="font-semibold mt-1">{titulo}</p>
            <p className="text-neutral-600 mt-0.5">{texto}</p>
          </li>
        ))}
      </ol>

      <div className="text-[11px] text-neutral-500 space-y-1">
        {geocercaActiva && (
          <p>Debes estar en {nombreLugar || 'el local'} y permitir el acceso a la ubicación del celular.</p>
        )}
        <p className="font-mono">{url}</p>
      </div>
    </div>
  </div>,
  document.body
);

const QrKioscoModal = ({ onClose }) => {
  const url = useMemo(urlKiosco, []);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [geocerca, setGeocerca] = useState({ activa: false, nombre: '' });

  useEffect(() => {
    QRCode.toString(url, { ...OPCIONES_QR, type: 'svg' })
      .then(setSvg)
      .catch(() => setError('No se pudo generar el código QR'));
    api.get('/configuracion/geocerca').then((r) => setGeocerca(r.data)).catch(() => {});
  }, [url]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError('No se pudo copiar. Selecciona el enlace y cópialo manualmente.');
    }
  };

  const descargar = async () => {
    try {
      const dataUrl = await generarPng(url);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'qr-asistencia-basel-venue.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setError('No se pudo descargar la imagen');
    }
  };

  return (
    <Modal titulo="Código QR del kiosco" onClose={onClose} ancho="max-w-lg">
      <div className="space-y-5">
        {esLocal() && (
          <div className="flex items-start gap-2 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <TriangleAlert size={14} className="shrink-0 mt-0.5" />
            <span>
              Estás en un entorno local: el QR apunta a <b>{window.location.host}</b> y no funcionará en otros celulares.
              Genéralo desde la versión publicada del sistema.
            </span>
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-xl w-64 max-w-full">
            {svg ? <QrSvg svg={svg} /> : <div className="aspect-square skeleton" />}
          </div>
          <div className="flex items-center gap-2 w-full">
            <input readOnly value={url} className="input font-mono text-xs" onFocus={(e) => e.target.select()} aria-label="Enlace del kiosco" />
            <button type="button" className="btn-secondary btn-sm shrink-0 py-2" onClick={copiar}>
              {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {geocerca.activa ? (
          <p className="flex items-center gap-1.5 text-xs text-neutral-400">
            <MapPin size={13} /> Restricción por ubicación activa: el cartel indicará que deben estar en el local.
          </p>
        ) : (
          <p className="text-xs text-neutral-500">
            La restricción por ubicación está desactivada: cualquiera con el enlace y un PIN podrá marcar desde cualquier lugar.
          </p>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" onClick={descargar} disabled={!svg}>
            <Download size={16} /> Descargar PNG
          </button>
          <button type="button" className="btn-primary" onClick={() => window.print()} disabled={!svg}>
            <Printer size={16} /> Imprimir cartel
          </button>
        </div>
      </div>

      {svg && <CartelImprimible svg={svg} url={url} geocercaActiva={geocerca.activa} nombreLugar={geocerca.nombre} />}
    </Modal>
  );
};

export default QrKioscoModal;
