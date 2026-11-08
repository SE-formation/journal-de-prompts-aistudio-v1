import React, { useState, useEffect } from 'react';
import { Epreuve, Tool, Partie, PromptEntry, LastChoices } from '../types';
import { LISTES, COURTS, STORAGE_KEYS } from '../constants';
import { storage } from '../services/storage';
import { postPromptToMake } from '../services/makeApi';
import { Clipboard, Trash2, Send, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface SaisieViewProps {
  epreuve: Epreuve;
  webhookUrl: string;
  onGoToSettings: () => void;
  queue: PromptEntry[];
  onFlushQueue: () => void;
  onPromptSent: (entry: PromptEntry, msg: string) => void;
  onPromptQueued: (entry: PromptEntry, notice: string) => void;
  showToast: (msg: string) => void;
  incomingText?: string;
  onClearIncomingText?: () => void;
  externalLoadPrompt?: { prompt: string; objectif: string } | null;
  onClearExternalLoad?: () => void;
}

export const SaisieView: React.FC<SaisieViewProps> = ({
  epreuve,
  webhookUrl,
  onGoToSettings,
  queue,
  onFlushQueue,
  onPromptSent,
  onPromptQueued,
  showToast,
  incomingText,
  onClearIncomingText,
  externalLoadPrompt,
  onClearExternalLoad,
}) => {
  const [lastChoices, setLastChoices] = useState<LastChoices>(() =>
    storage.get<LastChoices>(STORAGE_KEYS.last, {})
  );

  const [selectedTool, setSelectedTool] = useState<string>(() => {
    return lastChoices.outil && LISTES.outils.includes(lastChoices.outil as Tool)
      ? lastChoices.outil
      : LISTES.outils[0];
  });
  const [customTool, setCustomTool] = useState<string>('');

  const [selectedPartie, setSelectedPartie] = useState<string>(() => {
    return lastChoices.partie && LISTES.parties.includes(lastChoices.partie as Partie)
      ? lastChoices.partie
      : LISTES.parties[0];
  });

  const availableEtapes = LISTES.etapes[epreuve];
  const [selectedEtape, setSelectedEtape] = useState<string>(() => {
    const key = `etape_${epreuve}` as keyof LastChoices;
    const prev = lastChoices[key];
    return prev && availableEtapes.includes(prev) ? prev : availableEtapes[0];
  });

  // When epreuve changes, update selectedEtape to match the valid list
  useEffect(() => {
    const key = `etape_${epreuve}` as keyof LastChoices;
    const prev = lastChoices[key];
    if (prev && availableEtapes.includes(prev)) {
      setSelectedEtape(prev);
    } else {
      setSelectedEtape(availableEtapes[0]);
    }
  }, [epreuve, availableEtapes, lastChoices]);

  const [objectif, setObjectif] = useState<string>(() =>
    storage.get<string>(STORAGE_KEYS.draftObj, '')
  );
  const [prompt, setPrompt] = useState<string>(() =>
    storage.get<string>(STORAGE_KEYS.draft, '')
  );
  const [isSending, setIsSending] = useState<boolean>(false);

  // Handle incoming text from Web Share Target or external re-use
  useEffect(() => {
    if (incomingText) {
      setPrompt(incomingText);
      storage.set(STORAGE_KEYS.draft, incomingText);
      showToast('Texte reçu : complétez puis enregistrez');
      if (onClearIncomingText) onClearIncomingText();
    }
  }, [incomingText, onClearIncomingText, showToast]);

  useEffect(() => {
    if (externalLoadPrompt) {
      setPrompt(externalLoadPrompt.prompt);
      setObjectif(externalLoadPrompt.objectif || '');
      storage.set(STORAGE_KEYS.draft, externalLoadPrompt.prompt);
      storage.set(STORAGE_KEYS.draftObj, externalLoadPrompt.objectif || '');
      showToast('Prompt rechargé : modifiez-le puis enregistrez la nouvelle version');
      if (onClearExternalLoad) onClearExternalLoad();
    }
  }, [externalLoadPrompt, onClearExternalLoad, showToast]);

  const handlePromptChange = (val: string) => {
    setPrompt(val);
    storage.set(STORAGE_KEYS.draft, val);
  };

  const handleObjectifChange = (val: string) => {
    setObjectif(val);
    storage.set(STORAGE_KEYS.draftObj, val);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const next = prompt ? `${prompt}\n\n${text}` : text;
        handlePromptChange(next);
        showToast('Prompt collé depuis le presse-papiers');
      } else {
        showToast('Le presse-papiers est vide');
      }
    } catch {
      showToast('Appui long dans la zone de texte › Coller');
    }
  };

  const handleClear = () => {
    handlePromptChange('');
    handleObjectifChange('');
    showToast('Zone effacée');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!webhookUrl || !webhookUrl.trim()) {
      showToast("Ajoutez d'abord votre adresse d'envoi Make");
      onGoToSettings();
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      showToast('Le prompt est vide');
      return;
    }

    const finalTool = selectedTool === 'Autre' && customTool.trim() ? customTool.trim() : selectedTool;
    const newEntry: PromptEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toISOString(),
      epreuve,
      outil: finalTool,
      partie: selectedPartie,
      etape: selectedEtape,
      objectif: objectif.trim(),
      prompt: trimmedPrompt,
      status: 'sent',
    };

    // Save user's last choices
    const nextLast: LastChoices = {
      ...lastChoices,
      outil: selectedTool,
      partie: selectedPartie,
      [`etape_${epreuve}`]: selectedEtape,
    };
    setLastChoices(nextLast);
    storage.set(STORAGE_KEYS.last, nextLast);

    setIsSending(true);

    try {
      const res = await postPromptToMake(webhookUrl, {
        epreuve: newEntry.epreuve,
        outil: newEntry.outil,
        partie: newEntry.partie,
        etape: newEntry.etape,
        objectif: newEntry.objectif,
        prompt: newEntry.prompt,
        date: newEntry.date,
      });

      // Clear draft on success
      handlePromptChange('');
      handleObjectifChange('');
      onPromptSent(newEntry, res.message);
    } catch (err) {
      console.warn('Direct post error, queueing prompt:', err);
      // Mark as wait, push to offline queue
      const queuedEntry: PromptEntry = { ...newEntry, status: 'wait' };
      handlePromptChange('');
      handleObjectifChange('');

      const msg = !navigator.onLine
        ? 'Hors ligne : prompt mis en attente'
        : 'Envoi impossible, prompt mis en attente';
      onPromptQueued(queuedEntry, msg);
    } finally {
      setIsSending(false);
    }
  };

  const charCount = prompt.length;

  return (
    <section className="space-y-4">
      {/* Notice if webhook is not set */}
      {!webhookUrl && (
        <div className="bg-white dark:bg-[#1f1d1a] border-2 border-[#ffd500] rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-stone-800 dark:text-stone-200">
            <AlertCircle size={18} className="text-[#e30613] shrink-0" />
            <span>
              Avant votre premier envoi, collez votre adresse de webhook Make.
            </span>
          </div>
          <button
            type="button"
            onClick={onGoToSettings}
            className="px-3 py-1.5 bg-[#111111] text-[#ffd500] font-bold text-xs rounded-full shrink-0 hover:bg-stone-800 transition"
          >
            Réglages
          </button>
        </div>
      )}

      {/* Queue notice if pending prompts */}
      {queue.length > 0 && (
        <div className="bg-[#ffd500]/25 border border-[#ffd500] rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-medium text-stone-900 dark:text-stone-100">
            <RefreshCw size={15} className="text-[#111111] animate-spin-slow shrink-0" />
            <span>
              <strong>{queue.length} prompt{queue.length > 1 ? 's' : ''}</strong> en attente d'envoi
            </span>
          </div>
          <button
            type="button"
            onClick={onFlushQueue}
            className="px-3.5 py-1.5 bg-[#111111] text-white hover:bg-stone-800 font-bold text-xs rounded-full shadow-xs transition"
          >
            Renvoyer
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Outil IA chips */}
        <fieldset className="space-y-2">
          <legend className="font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Outil IA
          </legend>
          <div className="flex flex-wrap gap-2">
            {LISTES.outils.map((tool) => {
              const isSelected = selectedTool === tool;
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => setSelectedTool(tool)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#111111] text-white border-[#111111] shadow-xs scale-102 font-bold'
                      : 'bg-white dark:bg-[#201d1a] text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:border-stone-400'
                  }`}
                  aria-pressed={isSelected}
                >
                  {tool}
                </button>
              );
            })}
          </div>

          {selectedTool === 'Autre' && (
            <div className="pt-1">
              <input
                type="text"
                value={customTool}
                onChange={(e) => setCustomTool(e.target.value)}
                placeholder="Nom de l'outil (ex. DeepSeek, Suno, Gamma…)"
                className="w-full min-h-[42px] px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-[#201d1a] border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-[#f39200]"
              />
            </div>
          )}
        </fieldset>

        {/* Partie du dossier chips */}
        <fieldset className="space-y-2">
          <legend className="font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Partie du dossier
          </legend>
          <div className="flex flex-wrap gap-2">
            {LISTES.parties.map((part) => {
              const isSelected = selectedPartie === part;
              const shortLabel = COURTS[part] || part;
              return (
                <button
                  key={part}
                  type="button"
                  onClick={() => setSelectedPartie(part)}
                  title={part}
                  aria-label={part}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#f39200] text-[#111111] border-[#f39200] font-bold shadow-xs scale-102'
                      : 'bg-white dark:bg-[#201d1a] text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 hover:border-stone-400'
                  }`}
                  aria-pressed={isSelected}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Etape select */}
        <div className="space-y-1.5">
          <label
            htmlFor="etape-select"
            className="block font-bold text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400"
          >
            Étape ({epreuve})
          </label>
          <select
            id="etape-select"
            value={selectedEtape}
            onChange={(e) => setSelectedEtape(e.target.value)}
            className="w-full min-h-[48px] px-3.5 py-2.5 text-sm rounded-2xl bg-white dark:bg-[#201d1a] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-[#f39200] font-medium"
          >
            {availableEtapes.map((step) => (
              <option key={step} value={step}>
                {step}
              </option>
            ))}
          </select>
        </div>

        {/* Prompt Card */}
        <div className="bg-white dark:bg-[#201d1a] rounded-3xl p-4 sm:p-5 shadow-sm border border-stone-200/80 dark:border-stone-800 space-y-3">
          {/* Objectif input */}
          <div className="border-b border-stone-200 dark:border-stone-800 pb-2">
            <input
              type="text"
              value={objectif}
              onChange={(e) => handleObjectifChange(e.target.value)}
              maxLength={300}
              placeholder="Objectif : ex. reformuler ma problématique"
              className="w-full bg-transparent text-sm font-semibold text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none"
              autoComplete="off"
            />
          </div>

          {/* Prompt textarea */}
          <textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            required
            rows={7}
            placeholder="Collez ici le prompt tel que vous l'avez envoyé à l'IA..."
            className="w-full bg-transparent font-mono text-xs sm:text-[13px] leading-relaxed text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none resize-y min-h-[160px]"
          />

          {/* Card footer */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePaste}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f6f4f0] dark:bg-[#2c2824] hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-semibold transition"
              >
                <Clipboard size={13} />
                <span>Coller</span>
              </button>
              {prompt && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 text-stone-500 text-xs font-semibold transition"
                  title="Effacer"
                >
                  <Trash2 size={13} />
                  <span>Effacer</span>
                </button>
              )}
            </div>

            <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
              {charCount.toLocaleString('fr-FR')} car.
            </span>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSending || !prompt.trim()}
          className="w-full min-h-[54px] rounded-full bg-[#111111] hover:bg-stone-800 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none text-white font-display font-extrabold text-base tracking-tight shadow-md flex items-center justify-center gap-2 transition"
        >
          {isSending ? (
            <>
              <RefreshCw size={18} className="animate-spin text-[#ffd500]" />
              <span>Envoi vers Make…</span>
            </>
          ) : (
            <>
              <Send size={18} className="text-[#ffd500]" />
              <span>Enregistrer dans mon journal</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
};
