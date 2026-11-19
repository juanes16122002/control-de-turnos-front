import React from 'react';
import logoImg from '../assets/basel-logo.png';

// Acento "^" del logo: chevrón fino a la altura de las mayúsculas
const Caret = ({ className = '' }) => (
  <svg viewBox="0 0 20 12" className={className} fill="none" aria-hidden="true">
    <polyline points="2,10.5 10,2.5 18,10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TAMANOS = {
  sm: { basel: 'text-base', venue: 'text-[8px] mt-1', caret: 'w-3 mt-[3px]', gap: 'gap-2' },
  md: { basel: 'text-xl', venue: 'text-[10px] mt-1.5', caret: 'w-4 mt-1', gap: 'gap-3' },
  lg: { basel: 'text-3xl', venue: 'text-xs mt-2', caret: 'w-6 mt-1.5', gap: 'gap-4' },
  xl: { basel: 'text-5xl', venue: 'text-base mt-3', caret: 'w-9 mt-2.5', gap: 'gap-5' },
};

/**
 * Wordmark vectorial de Basel Venue (fondo transparente, nítido a cualquier tamaño).
 * Para el logo oficial en imagen usa <BrandLogoImage />.
 */
const BrandLogo = ({ size = 'md', subtitulo = true, invertido = false, className = '' }) => {
  const t = TAMANOS[size] || TAMANOS.md;
  // invertido: negro sobre claro (impresión en papel)
  return (
    <div className={`font-display ${invertido ? 'text-black' : 'text-white'} leading-none select-none ${className}`} aria-label="Basel Venue" role="img">
      <div className={`flex items-start ${t.gap}`}>
        <span className={`${t.basel} font-normal tracking-brand`}>BASEL</span>
        <Caret className={t.caret} />
      </div>
      {subtitulo && (
        <span className={`block ${t.venue} font-normal tracking-brand ${invertido ? 'text-neutral-600' : 'text-neutral-400'}`}>VENUE</span>
      )}
    </div>
  );
};

// Logo oficial (PNG blanco con fondo transparente, generado desde el logo original):
// se integra sobre cualquier fondo oscuro sin mostrar recuadro.
export const BrandLogoImage = ({ className = '' }) => (
  <img src={logoImg} alt="Basel Venue" className={`select-none ${className}`} draggable="false" />
);

export default BrandLogo;
