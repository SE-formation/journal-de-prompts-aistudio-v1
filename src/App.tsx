/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Epreuve, PromptEntry } from './types';
import { STORAGE_KEYS } from './constants';
import { storage } from './services/storage';
import { postPromptToMake, formatDateFr } from './services/makeApi';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePWAInstall } from './hooks/usePWAInstall';
import { Header } from './components/Header';
import { SaisieView } from './components/SaisieView';
import { HistoriqueView } from './components/HistoriqueView';
import { ReglagesView } from './components/ReglagesView';
import { Toast } from './components/Toast';
import { InstallModal } from './components/InstallModal';
import { PenTool, History, Settings } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'saisir' | 'historique' | 'reglages'>('saisir');
  const [epreuve, setEpreuve] = useState<Epreuve>(() => storage.get<Epreuve>(STORAGE_KEYS.ep, 'PPI'));
  const [webhookUrl, setWebhookUrl] = useState<string>(() => storage.get<string>(STORAGE_KEYS.hook, ''));
  const [queue, setQueue] = useState<PromptEntry[]>(() => storage.get<PromptEntry[]>(STORAGE_KEYS.queue, []));
  const [history, setHistory] = useState<PromptEntry[]>(() => storage.get<PromptEntry[]>(STORAGE_KEYS.hist, []));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [incomingText, setIncomingText] = useState<string>('');
  const [externalLoadPrompt, setExternalLoadPrompt] = useState<{ prompt: string; objectif: string } | null>(null);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // 1. Process incoming search parameters (Share Target / Pre-filled link)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      let hasParams = false;

      const hookParam = params.get('hook');
      if (hookParam) {
        const cleanHook = hookParam.trim();
        setWebhookUrl(cleanHook);
        storage.set(STORAGE_KEYS.hook, cleanHook);
        showToast("Adresse d'envoi Make enregistrée");
        hasParams = true;
      }

      const epParam = params.get('epreuve');
      if (epParam === 'PPI' || epParam === 'PPC') {
        setEpreuve(epParam);
        storage.set(STORAGE_KEYS.ep, epParam);
        hasParams = true;
      }

      const sharedParts = [params.get('text'), params.get('title')].filter(Boolean).join('\n').trim();
      if (sharedParts) {
        setIncomingText(sharedParts);
        setActiveTab('saisir');
        hasParams = true;
      }

      if (hasParams) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (e) {
      console.warn('Error reading URL parameters:', e);
    }
  }, [showToast]);

  // 2. Queue flush function
  const flushQueue = useCallback(async () => {
    const currentHook = storage.get<string>(STORAGE_KEYS.hook, '');
    const currentQueue = storage.get<PromptEntry[]>(STORAGE_KEYS.queue, []);

    if (!currentHook || currentQueue.length === 0 || !navigator.onLine) {
      return;
    }

    const remaining: PromptEntry[] = [];
    let sentCount = 0;

    for (const entry of currentQueue) {
      // Prepend original creation date/time to objectif so real timestamp is preserved!
      const datedObjectif = (entry.objectif ? entry.objectif + ' ' : '') + `[saisi le ${formatDateFr(entry.date)}]`;
      try {
        await postPromptToMake(currentHook, {
          epreuve: entry.epreuve,
          outil: entry.outil,
          partie: entry.partie,
          etape: entry.etape,
          objectif: datedObjectif,
          prompt: entry.prompt,
          date: entry.date,
        });

        // Update local history status to sent
        setHistory((prevHist) => {
          const updated = prevHist.map((h) => (h.id === entry.id ? { ...h, status: 'sent' as const } : h));
          storage.set(STORAGE_KEYS.hist, updated);
          return updated;
        });

        sentCount++;
      } catch (err) {
        console.warn('Could not send queued prompt:', err);
        remaining.push(entry);
      }
    }

    setQueue(remaining);
    storage.set(STORAGE_KEYS.queue, remaining);

    if (sentCount > 0) {
      showToast(`✅ ${sentCount} prompt${sentCount > 1 ? 's' : ''} en attente envoyé${sentCount > 1 ? 's' : ''}`);
    }
  }, [showToast]);

  // Automatically flush queue when coming back online
  useEffect(() => {
    if (isOnline) {
      flushQueue();
    }
  }, [isOnline, flushQueue]);

  // Handle successful prompt sent directly
  const handlePromptSent = (entry: PromptEntry, message: string) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 100);
      storage.set(STORAGE_KEYS.hist, next);
      return next;
    });
    showToast(message);
  };

  // Handle prompt queued because offline or network glitch
  const handlePromptQueued = (entry: PromptEntry, notice: string) => {
    setQueue((prev) => {
      const next = [...prev, entry];
      storage.set(STORAGE_KEYS.queue, next);
      return next;
    });
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 100);
      storage.set(STORAGE_KEYS.hist, next);
      return next;
    });
    showToast(notice);
  };

  const handleEpreuveChange = (nextEp: Epreuve) => {
    setEpreuve(nextEp);
    storage.set(STORAGE_KEYS.ep, nextEp);
  };

  const handleSaveSettings = (url: string, defEp: Epreuve) => {
    setWebhookUrl(url);
    storage.set(STORAGE_KEYS.hook, url);
    setEpreuve(defEp);
    storage.set(STORAGE_KEYS.ep, defEp);
    // Flush queue if url was updated
    if (url) {
      setTimeout(() => flushQueue(), 300);
    }
  };

  const handleWipeHistory = () => {
    setHistory([]);
    storage.set(STORAGE_KEYS.hist, []);
  };

  const handleDeleteSinglePrompt = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      storage.set(STORAGE_KEYS.hist, next);
      return next;
    });
    showToast('Prompt retiré de l’historique');
  };

  const handleReusePrompt = (entry: PromptEntry) => {
    setExternalLoadPrompt({
      prompt: entry.prompt,
      objectif: entry.objectif,
    });
    if (entry.epreuve !== epreuve) {
      handleEpreuveChange(entry.epreuve);
    }
    setActiveTab('saisir');
  };

  const title =
    activeTab === 'saisir'
      ? 'Mes prompts'
      : activeTab === 'historique'
      ? 'Historique'
      : 'Réglages';

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f4f0] dark:bg-[#151412] text-stone-900 dark:text-stone-100">
      {/* Header with red banner and PPI/PPC switch */}
      <Header
        title={title}
        epreuve={epreuve}
        onEpreuveChange={handleEpreuveChange}
        isOnline={isOnline}
        queueCount={queue.length}
        isInstalled={isInstalled}
        isInstallable={isInstallable}
        isIOS={isIOS}
        onOpenInstall={() => setShowInstallModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-5 pb-[calc(100px+env(safe-area-inset-bottom,0px))]">
        {activeTab === 'saisir' && (
          <SaisieView
            epreuve={epreuve}
            webhookUrl={webhookUrl}
            onGoToSettings={() => setActiveTab('reglages')}
            queue={queue}
            onFlushQueue={flushQueue}
            onPromptSent={handlePromptSent}
            onPromptQueued={handlePromptQueued}
            showToast={showToast}
            incomingText={incomingText}
            onClearIncomingText={() => setIncomingText('')}
            externalLoadPrompt={externalLoadPrompt}
            onClearExternalLoad={() => setExternalLoadPrompt(null)}
          />
        )}

        {activeTab === 'historique' && (
          <HistoriqueView
            history={history}
            onReusePrompt={handleReusePrompt}
            onDeletePrompt={handleDeleteSinglePrompt}
            showToast={showToast}
          />
        )}

        {activeTab === 'reglages' && (
          <ReglagesView
            webhookUrl={webhookUrl}
            defaultEpreuve={epreuve}
            onSaveSettings={handleSaveSettings}
            onWipeHistory={handleWipeHistory}
            showToast={showToast}
            onGoToSaisie={() => setActiveTab('saisir')}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 bg-[#f6f4f0]/95 dark:bg-[#151412]/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 px-3 pt-2 pb-[calc(10px+env(safe-area-inset-bottom,0px))]"
      >
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('saisir')}
            className={`flex items-center justify-center gap-1.5 py-3 rounded-full text-xs font-bold transition-all ${
              activeTab === 'saisir'
                ? 'bg-[#111111] text-white shadow-sm scale-101'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
            aria-current={activeTab === 'saisir' ? 'page' : undefined}
          >
            <PenTool size={15} />
            <span>Saisir</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historique')}
            className={`relative flex items-center justify-center gap-1.5 py-3 rounded-full text-xs font-bold transition-all ${
              activeTab === 'historique'
                ? 'bg-[#111111] text-white shadow-sm scale-101'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
            aria-current={activeTab === 'historique' ? 'page' : undefined}
          >
            <History size={15} />
            <span>Historique</span>
            {history.length > 0 && (
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'historique'
                    ? 'bg-[#ffd500] text-[#111111]'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                {history.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reglages')}
            className={`flex items-center justify-center gap-1.5 py-3 rounded-full text-xs font-bold transition-all ${
              activeTab === 'reglages'
                ? 'bg-[#111111] text-white shadow-sm scale-101'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
            aria-current={activeTab === 'reglages' ? 'page' : undefined}
          >
            <Settings size={15} />
            <span>Réglages</span>
          </button>
        </div>
      </nav>

      {/* Floating Feedback Toast */}
      <Toast message={toastMessage} />

      {/* In-App PWA Install Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isIOS={isIOS}
        onInstallAndroid={install}
      />
    </div>
  );
}
