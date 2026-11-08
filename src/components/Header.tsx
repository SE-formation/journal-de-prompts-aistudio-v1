import React from 'react';
import { Epreuve } from '../types';
import { WifiOff, Download, Smartphone } from 'lucide-react';

interface HeaderProps {
  title: string;
  epreuve: Epreuve;
  onEpreuveChange: (ep: Epreuve) => void;
  isOnline: boolean;
  queueCount: number;
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  onOpenInstall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  epreuve,
  onEpreuveChange,
  isOnline,
  queueCount,
  isInstalled,
  isInstallable,
  isIOS,
  onOpenInstall,
}) => {
  return (
    <header className="bg-[#e30613] text-white rounded-b-3xl px-5 pb-5 pt-[calc(env(safe-area-inset-top,0px)+14px)] shadow-md transition-all">
      <div className="max-w-xl mx-auto space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-extrabold text-2xl tracking-tight text-white m-0">
              {title}
            </h1>
            {!isInstalled && (isInstallable || isIOS) && (
              <button
                type="button"
                onClick={onOpenInstall}
                className="hidden sm:inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold px-2.5 py-1 rounded-full transition"
                title="Installer sur l'écran d'accueil"
              >
                {isIOS ? <Smartphone size={13} /> : <Download size={13} />}
                <span>Installer</span>
              </button>
            )}
          </div>

          <div
            className="flex items-center bg-white/20 p-1 rounded-full backdrop-blur-xs shadow-inner"
            role="group"
            aria-label="Sélection de l'épreuve"
          >
            <button
              type="button"
              onClick={() => onEpreuveChange('PPI')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all min-h-[32px] ${
                epreuve === 'PPI'
                  ? 'bg-[#ffd500] text-[#111111] shadow-sm scale-102'
                  : 'text-white/90 hover:text-white'
              }`}
              aria-pressed={epreuve === 'PPI'}
            >
              PPI
            </button>
            <button
              type="button"
              onClick={() => onEpreuveChange('PPC')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all min-h-[32px] ${
                epreuve === 'PPC'
                  ? 'bg-[#ffd500] text-[#111111] shadow-sm scale-102'
                  : 'text-white/90 hover:text-white'
              }`}
              aria-pressed={epreuve === 'PPC'}
            >
              PPC
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-white/90">
          <p className="m-0 leading-tight">
            Un prompt utile ? Gardez-en la trace pour votre annexe.
          </p>

          <div className="flex items-center gap-1.5 ml-auto">
            {!isOnline && (
              <span className="inline-flex items-center gap-1 bg-[#111111] text-[#ffd500] text-[11px] font-bold px-2 py-0.5 rounded-full">
                <WifiOff size={11} />
                Hors ligne
              </span>
            )}
            {queueCount > 0 && (
              <span className="bg-[#ffd500] text-[#111111] text-[11px] font-bold px-2 py-0.5 rounded-full">
                {queueCount} en attente
              </span>
            )}
            {!isInstalled && (isInstallable || isIOS) && (
              <button
                type="button"
                onClick={onOpenInstall}
                className="sm:hidden inline-flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                <Download size={11} />
                Installer
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
