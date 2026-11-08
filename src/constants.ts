import { Epreuve, Tool, Partie } from './types';

export const APP_VERSION = '1.2.0';

export const LISTES: {
  outils: Tool[];
  parties: Partie[];
  etapes: Record<Epreuve, string[]>;
} = {
  outils: [
    'Claude',
    'ChatGPT',
    'Gemini',
    'Mistral (Le Chat)',
    'NotebookLM',
    'Copilot',
    'Midjourney',
    'Perplexity',
    'Canva IA',
    'Autre',
  ],
  parties: [
    'Introduction',
    'Partie I',
    'Partie II',
    'Partie III',
    'Conclusion',
    'Glossaire',
    'Annexes',
    'Mise en forme',
  ],
  etapes: {
    PPI: [
      'Cerner le sujet',
      'Problématiser',
      'Contextualiser (interne, PESTEL)',
      'Veille prospective, facteurs de rupture',
      'Analyser et interpréter les données',
      'Enquête, interviews',
      'Prototype ou preuve de concept',
      'Plan de gestion des risques',
      'Conduite du changement',
      'Structurer et rédiger',
      'Relecture, orthographe',
      'Mise en forme du dossier',
    ],
    PPC: [
      'Veille : existant et KPI',
      'Veille : marque, publics, concurrence, tendances',
      'Contours stratégiques : positionnement, objectifs, cibles',
      'Insight',
      'Conceptualiser : axe créa, promesse',
      'Explorer les voies et les formats',
      'Copy stratégie, brief créatif',
      'Production : maquettes, contenus',
      'Charte graphique',
      'Structurer et rédiger',
      'Relecture, orthographe',
      'Mise en forme du dossier',
    ],
  },
};

export const COURTS: Record<string, string> = {
  Introduction: 'Intro',
  'Partie I': 'Partie I',
  'Partie II': 'Partie II',
  'Partie III': 'Partie III',
  Conclusion: 'Concl.',
  Glossaire: 'Glossaire',
  Annexes: 'Annexes',
  'Mise en forme': 'Mise en page',
};

export const STORAGE_KEYS = {
  hook: 'jp.hook',
  ep: 'jp.epreuve',
  last: 'jp.last',
  queue: 'jp.queue',
  hist: 'jp.historique',
  draft: 'jp.brouillon',
  draftObj: 'jp.brouillon_obj',
};
