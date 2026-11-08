import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-4 right-4 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] z-50 max-w-lg mx-auto pointer-events-none transition-all duration-200"
    >
      <div className="bg-[#111111] text-white px-5 py-3.5 rounded-2xl font-bold text-sm shadow-2xl flex items-center justify-between gap-3 border border-stone-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <span className="leading-snug">{message}</span>
      </div>
    </div>
  );
};
