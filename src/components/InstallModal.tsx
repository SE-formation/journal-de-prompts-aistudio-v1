import React from 'react';
import { Share, PlusSquare, X, Smartphone, Download } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  onInstallAndroid?: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  onInstallAndroid,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 transition-opacity">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1f1d1a] rounded-3xl p-6 shadow-2xl border border-black/10 dark:border-white/10 text-left animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
      >
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e30613] text-white flex items-center justify-center font-black text-lg shadow-sm">
              P
            </div>
            <div>
              <h3 id="install-title" className="font-display font-extrabold text-xl text-stone-900 dark:text-stone-100 leading-tight">
                Installer l'application
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Accès direct depuis l'écran d'accueil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 bg-stone-100 dark:bg-stone-800"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {isIOS ? (
          <div className="py-4 space-y-3.5 text-sm text-stone-700 dark:text-stone-300">
            <p className="font-medium text-stone-900 dark:text-white">
              Sur votre iPhone ou iPad dans Safari :
            </p>
            <div className="flex items-start gap-3 bg-[#f6f4f0] dark:bg-[#2a2723] p-3 rounded-2xl">
              <div className="p-2 rounded-xl bg-white dark:bg-stone-800 text-[#e30613] shadow-xs shrink-0">
                <Share size={20} />
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-stone-900 dark:text-stone-100">1. Touchez le bouton Partager</span> dans la barre d'outils en bas de Safari.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#f6f4f0] dark:bg-[#2a2723] p-3 rounded-2xl">
              <div className="p-2 rounded-xl bg-white dark:bg-stone-800 text-[#f39200] shadow-xs shrink-0">
                <PlusSquare size={20} />
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-stone-900 dark:text-stone-100">2. Faites défiler et touchez « Sur l'écran d'accueil »</span>.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#f6f4f0] dark:bg-[#2a2723] p-3 rounded-2xl">
              <div className="p-2 rounded-xl bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs shrink-0">
                <Smartphone size={20} />
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-stone-900 dark:text-stone-100">3. Validez avec « Ajouter »</span>. L'icône rouge apparaîtra sur votre écran d'accueil comme une vraie application !
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4 text-sm text-stone-700 dark:text-stone-300">
            <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
              Installez l'application sur votre téléphone pour ouvrir rapidement votre journal et utiliser le menu <strong>Partager</strong> depuis ChatGPT, Claude ou Gemini.
            </p>
            {onInstallAndroid && (
              <button
                type="button"
                onClick={() => {
                  onInstallAndroid();
                  onClose();
                }}
                className="w-full py-3.5 px-4 bg-[#111111] hover:bg-stone-800 text-[#ffd500] font-display font-extrabold text-sm rounded-full flex items-center justify-center gap-2 shadow-md transition"
              >
                <Download size={18} />
                Installer sur cet appareil
              </button>
            )}
            <p className="text-[11px] text-stone-500 text-center">
              Si la boîte de dialogue n'apparaît pas, ouvrez le menu <strong>⋮</strong> de votre navigateur et choisissez <strong>Installer l'application</strong>.
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-semibold text-xs rounded-full transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
