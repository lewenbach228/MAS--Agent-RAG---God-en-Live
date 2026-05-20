/**
 * Types pour le service LLM
 */

export interface LLMResponse {
  /** Texte de la reponse genere */
  text: string;
  /** Citations des sources utilisees (livre chapitre:verset) */
  citations: string[];
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMService {
  /** Genere une reponse a partir du contexte, de la question et de l'historique */
  generateAnswer(
    question: string,
    context: string,
    conversationHistory?: ConversationTurn[]
  ): Promise<LLMResponse>;
}
