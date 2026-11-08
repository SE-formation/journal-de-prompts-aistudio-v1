export type Epreuve = 'PPI' | 'PPC';

export type Tool =
  | 'Claude'
  | 'ChatGPT'
  | 'Gemini'
  | 'Mistral (Le Chat)'
  | 'NotebookLM'
  | 'Copilot'
  | 'Midjourney'
  | 'Perplexity'
  | 'Canva IA'
  | 'Autre';

export type Partie =
  | 'Introduction'
  | 'Partie I'
  | 'Partie II'
  | 'Partie III'
  | 'Conclusion'
  | 'Glossaire'
  | 'Annexes'
  | 'Mise en forme';

export interface PromptEntry {
  id: string;
  date: string; // ISO string
  epreuve: Epreuve;
  outil: string;
  partie: string;
  etape: string;
  objectif: string;
  prompt: string;
  status: 'sent' | 'wait';
  note?: number;
}

export interface LastChoices {
  outil?: string;
  partie?: string;
  etape_PPI?: string;
  etape_PPC?: string;
}
