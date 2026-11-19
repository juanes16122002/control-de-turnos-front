import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ titulo, onClose, children, ancho = 'max-w-md' }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`card w-full ${ancho} p-5 sm:p-6 animate-slide-up sm:animate-scale-in max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-xl pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">{titulo}</h2>
          <button onClick={onClose} className="btn-ghost btn-xs" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
