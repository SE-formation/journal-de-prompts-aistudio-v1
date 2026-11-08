import React, { useState } from 'react';
import { Epreuve } from '../types';
import { APP_VERSION } from '../constants';
import { pingMakeWebhook } from '../services/makeApi';
import {
  Link2,
  Copy,
  Check,
  Save,
  Trash2,
  Zap,
  HelpCircle,
  Smartphone,
  Wifi,
  ExternalLink,
} from 'lucide-react';

interface ReglagesViewProps {
  webhookUrl: string;
  defaultEpreuve: Epreuve;
  onSaveSettings: (url: string, defEp: Epreuve) => void;
  onWipeHistory: () => void;
  showToast: (msg: string) => void;
  onGoToSaisie: () => void;
}

export const ReglagesView: React.FC<ReglagesViewProps> = ({
  webhookUrl,
  defaultEpreuve,
  onSaveSettings,
  onWipeHistory,
  showToast,
  onGoToSaisie,
}) => {
  const [urlInput, setUrlInput] = useState<string>(webhookUrl);
  const [defEpInput, setDefEpInput] = useState<Epreuve>(defaultEpreuve);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [confirmWipe, setConfirmWipe] = useState<boolean>(false);

  const handleSave = () => {
    const trimmed = urlInput.trim();
    if (trimmed && !/^https:\/\/\S+$/.test(trimmed)) {
      showToast("L'adresse doit commencer par https://");
      return;
    }
    onSaveSettings(trimmed, defEpInput);
    showToast('Réglages enregistrés');
    onGoToSaisie();
  };

  const handleTestConnection = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      showToast('Entrez d’abord une adresse de webhook');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await pingMakeWebhook(trimmed);
      setTestResult(res);
      if (res.success) {
        showToast('Connexion à Make réussie !');
      } else {
        showToast('Erreur lors du test Make');
      }
    } finally {
      setIsTesting(false);
    }
  };

  const generateShareUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const params = new URLSearchParams();
    if (urlInput.trim()) params.set('hook', urlInput.trim());
    params.set('epreuve', defEpInput);
    return `${origin}${pathname}?${params.toString()}`;
  };

  const handleCopyShareLink = async () => {
    const link = generateShareUrl();
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      showToast('Lien copié dans le presse-papiers');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast('Copie impossible');
    }
  };

  const handleWipeClick = () => {
    if (confirmWipe) {
      onWipeHistory();
      setConfirmWipe(false);
      showToast('Historique local vidé');
    } else {
      setConfirmWipe(true);
      setTimeout(() => setConfirmWipe(false), 4000);
    }
  };

  return (
    <section className="space-y-5">
      <div className="bg-white dark:bg-[#201d1a] rounded-3xl p-5 shadow-xs border border-stone-200/80 dark:border-stone-800 space-y-4">
        <div>
          <h2 className="font-display font-extrabold text-xl text-stone-900 dark:text-stone-100">
            Configuration Make & Sheets
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Ces réglages restent enregistrés sur ce téléphone. Les prompts partent uniquement vers votre propre scénario Make.
          </p>
        </div>

        {/* Webhook Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="webhook-input"
            className="block font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400"
          >
            Adresse d'envoi (Webhook Make)
          </label>
          <input
            id="webhook-input"
            type="url"
            inputMode="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://hook.eu1.make.com/..."
            className="w-full min-h-[46px] px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl bg-[#f6f4f0] dark:bg-[#151412] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 font-mono focus:outline-none focus:ring-2 focus:ring-[#f39200]"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {/* Default Epreuve */}
        <div className="space-y-1.5">
          <label
            htmlFor="def-ep-select"
            className="block font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400"
          >
            Épreuve par défaut
          </label>
          <select
            id="def-ep-select"
            value={defEpInput}
            onChange={(e) => setDefEpInput(e.target.value as Epreuve)}
            className="w-full min-h-[46px] px-3.5 py-2.5 text-sm rounded-2xl bg-[#f6f4f0] dark:bg-[#151412] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#f39200]"
          >
            <option value="PPI">PPI (Projet Professionnel d'Immersion)</option>
            <option value="PPC">PPC (Projet Professionnel de Communication)</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[48px] px-4 py-2.5 bg-[#111111] hover:bg-stone-800 text-white rounded-full font-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Save size={16} className="text-[#ffd500]" />
            <span>Enregistrer les réglages</span>
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !urlInput.trim()}
            className="min-h-[48px] px-4 py-2.5 bg-[#ffd500] hover:bg-[#ffdf33] disabled:opacity-50 text-[#111111] rounded-full font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Zap size={15} />
            <span>{isTesting ? 'Test en cours…' : 'Tester la connexion'}</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-2xl text-xs font-medium border ${
              testResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-300'
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>

      {/* Shareable Link Card */}
      <div className="bg-white dark:bg-[#201d1a] rounded-3xl p-5 shadow-xs border border-stone-200/80 dark:border-stone-800 space-y-3">
        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-display font-extrabold text-sm">
          <Link2 size={16} className="text-[#f39200]" />
          <span>Lien d'installation pré-configuré</span>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
          Partagez ce lien à vos étudiants ou à un autre appareil : l'adresse de webhook et l'épreuve seront automatiquement pré-remplies dès la première ouverture !
        </p>
        <div className="bg-[#f6f4f0] dark:bg-[#151412] p-2.5 rounded-2xl font-mono text-[11px] text-stone-700 dark:text-stone-300 break-all select-all border border-stone-200 dark:border-stone-800">
          {generateShareUrl()}
        </div>
        <button
          type="button"
          onClick={handleCopyShareLink}
          className="w-full min-h-[42px] px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-full flex items-center justify-center gap-2 transition"
        >
          {copiedLink ? (
            <>
              <Check size={14} className="text-emerald-600" />
              <span>Lien copié !</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copier le lien pré-rempli</span>
            </>
          )}
        </button>
      </div>

      {/* Guide Card */}
      <div className="bg-white dark:bg-[#201d1a] rounded-3xl p-5 shadow-xs border border-stone-200/80 dark:border-stone-800 space-y-3.5">
        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-display font-extrabold text-sm">
          <HelpCircle size={16} className="text-[#e30613]" />
          <span>Guide d'utilisation au quotidien</span>
        </div>

        <div className="space-y-3 text-xs text-stone-600 dark:text-stone-400">
          <div className="flex items-start gap-2.5">
            <Smartphone size={16} className="text-stone-800 dark:text-stone-200 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-800 dark:text-stone-200">Sur Android :</strong>{' '}
              Une fois installée, sélectionnez n'importe quel prompt dans ChatGPT, Claude ou Gemini › touchez <strong>Partager</strong> › choisissez <strong>Prompts</strong>. Le texte arrive directement dans le formulaire !
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Smartphone size={16} className="text-stone-800 dark:text-stone-200 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-800 dark:text-stone-200">Sur iPhone :</strong>{' '}
              Copiez votre prompt dans votre application d'IA, ouvrez l'application Prompts sur votre écran d'accueil, puis touchez <strong>Coller</strong>.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Wifi size={16} className="text-stone-800 dark:text-stone-200 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-800 dark:text-stone-200">Sans réseau :</strong>{' '}
              Vous pouvez enregistrer même en mode avion ou dans le métro. Le prompt est conservé dans la file d'attente et envoyé automatiquement dès le retour du réseau avec la mention <code>[saisi le JJ/MM/AAAA HH:mm]</code>.
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Wipe local storage */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleWipeClick}
          className={`w-full min-h-[44px] px-4 py-2 rounded-full text-xs font-bold transition flex items-center justify-center gap-2 border ${
            confirmWipe
              ? 'bg-red-600 text-white border-red-700 animate-pulse'
              : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-red-600 hover:border-red-300 bg-transparent'
          }`}
        >
          <Trash2 size={14} />
          <span>
            {confirmWipe ? 'Touchez encore une fois pour confirmer le vidage' : "Vider l'historique local"}
          </span>
        </button>
      </div>

      <div className="text-center text-[11px] text-stone-400 font-mono pt-1">
        Journal de prompts PPI / PPC — v{APP_VERSION}
      </div>
    </section>
  );
};
