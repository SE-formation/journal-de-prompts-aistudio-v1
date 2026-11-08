import { PromptEntry } from '../types';

export function formatDateFr(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

export async function postPromptToMake(
  webhookUrl: string,
  entry: Omit<PromptEntry, 'id' | 'status'>
): Promise<{ success: boolean; message: string; isPaused?: boolean }> {
  if (!webhookUrl || !webhookUrl.trim()) {
    throw new Error("L'adresse du webhook Make n'est pas configurée");
  }

  const cleanUrl = webhookUrl.trim();
  const body = new URLSearchParams({
    epreuve: entry.epreuve,
    outil: entry.outil,
    partie: entry.partie,
    etape: entry.etape,
    objectif: entry.objectif,
    prompt: entry.prompt,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(cleanUrl, {
      method: 'POST',
      body,
      signal: controller.signal,
    });

    const text = (await res.text()).trim();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}${text ? ' — ' + text : ''}`);
    }

    if (/^accepted$/i.test(text)) {
      return {
        success: true,
        isPaused: true,
        message: '📥 Reçu par Make. Scénario en pause : la ligne arrivera dans le Sheet à sa réactivation.',
      };
    }

    const friendlyMsg = text
      ? text.startsWith('✅')
        ? text
        : `✅ ${text}`
      : '✅ Prompt enregistré dans votre Google Sheet';

    return {
      success: true,
      message: friendlyMsg,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error("Délai d'attente dépassé (15s) lors de l'envoi vers Make");
      }
      throw err;
    }
    throw new Error("Erreur inattendue lors de l'envoi vers Make");
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function pingMakeWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('https://')) {
    return { success: false, message: "L'adresse doit commencer par https://" };
  }

  try {
    const res = await postPromptToMake(webhookUrl, {
      epreuve: 'PPI',
      outil: 'Test PWA',
      partie: 'Introduction',
      etape: 'Cerner le sujet',
      objectif: 'Test de connexion PWA',
      prompt: 'Ping de validation depuis l\'application mobile PWA',
      date: new Date().toISOString(),
    });
    return { success: true, message: res.message };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Échec du test : ${msg}` };
  }
}
