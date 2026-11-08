import React, { useState, useMemo } from 'react';
import { PromptEntry } from '../types';
import { COURTS } from '../constants';
import { formatDateFr } from '../services/makeApi';
import { Search, Copy, Repeat, Trash2, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface HistoriqueViewProps {
  history: PromptEntry[];
  onReusePrompt: (entry: PromptEntry) => void;
  onDeletePrompt: (id: string) => void;
  showToast: (msg: string) => void;
}

export const HistoriqueView: React.FC<HistoriqueViewProps> = ({
  history,
  onReusePrompt,
  onDeletePrompt,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredHistory = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return history;
    return history.filter((item) => {
      const fullText = [
        item.prompt,
        item.objectif,
        item.etape,
        item.outil,
        item.partie,
        item.epreuve,
      ]
        .join(' ')
        .toLowerCase();
      return fullText.includes(q);
    });
  }, [history, searchTerm]);

  const handleCopy = async (promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      showToast('Prompt copié dans le presse-papiers');
    } catch {
      showToast('Copie impossible');
    }
  };

  return (
    <section className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher : PESTEL, persona, problématique…"
          className="w-full min-h-[48px] pl-11 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#201d1a] border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#f39200]"
          autoComplete="off"
        />
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider px-1">
        <span>
          {searchTerm.trim()
            ? `${filteredHistory.length} résultat${filteredHistory.length > 1 ? 's' : ''}`
            : `${history.length} prompt${history.length > 1 ? 's' : ''} sur ce téléphone`}
        </span>
      </div>

      {/* List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white dark:bg-[#201d1a] rounded-3xl p-8 text-center text-stone-500 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800 text-sm">
          {searchTerm.trim() ? (
            <p>Aucun prompt ne contient ce mot.</p>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold text-stone-700 dark:text-stone-300">
                Aucun prompt enregistré pour l'instant.
              </p>
              <p className="text-xs">
                Votre premier envoi vers Make apparaîtra automatiquement ici avec sa date exacte.
              </p>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-3.5 list-none p-0 m-0">
          {filteredHistory.map((item) => {
            const isExpanded = expandedIds.has(item.id);
            const isQueued = item.status === 'wait';

            return (
              <li
                key={item.id}
                className={`bg-white dark:bg-[#201d1a] rounded-3xl p-4 sm:p-5 shadow-xs border transition-all ${
                  isQueued
                    ? 'border-[#ffd500] ring-2 ring-[#ffd500]/30'
                    : 'border-stone-200/80 dark:border-stone-800'
                }`}
              >
                {/* Meta header */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400 pb-2 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                        isQueued
                          ? 'bg-[#ffd500] text-[#111111]'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {isQueued ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                      {isQueued ? 'En attente' : 'Envoyé'}
                    </span>
                    <span className="font-mono">{formatDateFr(item.date)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded-md text-[11px] font-bold text-stone-800 dark:text-stone-200">
                      {item.epreuve}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      {item.outil}
                    </span>
                    <span>·</span>
                    <span>{COURTS[item.partie] || item.partie}</span>
                  </div>
                </div>

                {/* Objectif */}
                {item.objectif && (
                  <div className="pt-2 pb-1 font-display font-extrabold text-sm text-stone-900 dark:text-stone-100 leading-snug">
                    {item.objectif}
                  </div>
                )}

                {/* Etape badge */}
                <div className="text-[11px] font-medium text-stone-500 pt-0.5 pb-2">
                  Étape : {item.etape}
                </div>

                {/* Prompt snippet */}
                <div
                  className={`font-mono text-xs leading-relaxed text-stone-800 dark:text-stone-200 bg-[#f6f4f0] dark:bg-[#151412] p-3 rounded-2xl whitespace-pre-wrap break-words ${
                    !isExpanded && item.prompt.length > 250 ? 'max-h-24 overflow-hidden relative' : ''
                  }`}
                >
                  {item.prompt}
                  {!isExpanded && item.prompt.length > 250 && (
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#f6f4f0] dark:from-[#151412] to-transparent pointer-events-none" />
                  )}
                </div>

                {item.prompt.length > 250 && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#f39200] hover:text-[#e30613] pt-1.5"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp size={12} /> Réduire le prompt
                      </>
                    ) : (
                      <>
                        <ChevronDown size={12} /> Voir tout le prompt ({item.prompt.length} car.)
                      </>
                    )}
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 mt-1 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.prompt)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-semibold transition"
                    >
                      <Copy size={12} />
                      <span>Copier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onReusePrompt(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffd500]/30 hover:bg-[#ffd500]/50 text-stone-900 dark:text-stone-100 text-xs font-bold transition"
                    >
                      <Repeat size={12} />
                      <span>Réutiliser</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeletePrompt(item.id)}
                    className="p-1.5 rounded-full text-stone-400 hover:text-red-600 transition"
                    title="Supprimer de l'historique local"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
