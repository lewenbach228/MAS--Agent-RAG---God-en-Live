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

/**
 * Callbacks pour le mode streaming du LLM
 */
export interface LLMStreamCallbacks {
  /** Appele a chaque nouveau token de texte genere */
  onToken: (token: string) => void;
  /** Appele quand la generation est complete */
  onComplete: (fullText: string) => void;
  /** Appele en cas d'erreur */
  onError: (error: Error) => void;
}

export interface LLMService {
  /** Genere une reponse a partir du contexte, de la question et de l'historique */
  generateAnswer(
    question: string,
    context: string,
    conversationHistory?: ConversationTurn[]
  ): Promise<LLMResponse>;

  /**
   * Genere une reponse en streaming (token par token)
   * Les tokens sont passes via callbacks.onToken au fur et a mesure.
   * A la fin, callbacks.onComplete est appele avec le texte complet.
   */
  generateAnswerStream(
    question: string,
    context: string,
    callbacks: LLMStreamCallbacks,
    conversationHistory?: ConversationTurn[]
  ): Promise<void>;
}
