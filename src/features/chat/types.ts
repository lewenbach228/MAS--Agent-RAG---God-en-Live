/**
 * Types pour la fonctionnalite chat
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: string[];
  mode?: 'demo' | 'connecte';
}

export type AppMode = 'demo' | 'connecte';
