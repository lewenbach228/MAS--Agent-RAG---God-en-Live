/**
 * Pipeline RAG (Retrieval-Augmented Generation)
 *
 * Orchestre le flux complet :
 *   Question → Embedding → Vector Store → Retrieval → LLM → Reponse + Citations
 *
 * Deux modes :
 *   - "demo" : 3 questions seedees avec reponses pre-ecrites (pas d'appels API)
 *   - "connecte" : pipeline complet via OpenAI
 */

import type { Chunk } from '../bible/types';
import type { LLMResponse, ConversationTurn } from '../../services/llm/types';
import type { LLMStreamCallbacks } from '../../services/llm/types';
import { LocalVectorStore } from '../../services/vector-store/localVectorStore';
import { createEmbeddingService } from '../../services/embeddings/openaiEmbeddings';
import { createLLMService } from '../../services/llm/openaiLLM';
import { loadBible, chunkBible } from '../bible/bibleLoader';
import { loadIndexedVectors } from '../bible/indexedBibleLoader';

// === Mode demo : 3 questions seedees ===

const DEMO_QUESTIONS = [
  "Que dit la Bible sur l'amour ?",
  'Pourquoi y a-t-il autant de souffrance dans le monde ?',
  'Qui etait Moise ?',
];

const DEMO_ANSWERS: Record<string, LLMResponse> = {
  [DEMO_QUESTIONS[0]]: {
    text: "La Bible parle abondamment de l'amour. Dans 1 Corinthiens 13:4-7, il est ecrit : \"L'amour est patient, l'amour est bon...\" Jean 3:16 resume l'essence du message : \"Car Dieu a tant aime le monde qu'il a donne son Fils unique...\" Et dans 1 Jean 4:8, on lit simplement : \"Celui qui n'aime pas n'a pas connu Dieu, car Dieu est amour.\"",
    citations: ['1 Corinthiens 13:4-7', 'Jean 3:16', '1 Jean 4:8'],
  },
  [DEMO_QUESTIONS[1]]: {
    text: "La Bible ne cache pas la realite de la souffrance. Dans Jean 16:33, Jesus dit : \"Vous aurez des tribulations dans le monde, mais prenez courage, j'ai vaincu le monde.\" Romains 8:18 nous rappelle que \"les souffrances du temps present ne sauraient etre comparees a la gloire a venir.\" Et Apocalypse 21:4 promet qu'un jour \"Dieu essuiera toute larme de leurs yeux, et la mort ne sera plus.\"",
    citations: ['Jean 16:33', 'Romains 8:18', 'Apocalypse 21:4'],
  },
  [DEMO_QUESTIONS[2]]: {
    text: "Moise est l'un des plus grands personnages de l'Ancien Testament. Dieu l'a choisi pour delivrer les Israelites d'Egypte (Exode 3). Il a recu les Dix Commandements sur le mont Sinai (Exode 20). Il a conduit le peuple dans le desert pendant 40 ans. Deuteronome 34:10 dit : \"Il n'a plus paru en Israel de prophete semblable a Moise, que l'Eternel connaissait face a face.\"",
    citations: ['Exode 3', 'Exode 20', 'Deuteronome 34:10'],
  },
};

export interface RAGResult {
  answer: string;
  citations: string[];
  mode: 'demo' | 'connecte';
}

/**
 * Callbacks pour le streaming depuis le RAGEngine.
 * onComplete fournit les citations extraites des chunks retrouves.
 */
export interface RAGStreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (citations: string[]) => void;
  onError: (error: Error) => void;
}

// === Moteur RAG complet (mode connecte) ===

export class RAGEngine {
  private store: LocalVectorStore | null = null;
  private initialized = false;
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Verifie si la question correspond au mode demo
   */
  static isDemoQuestion(question: string): boolean {
    const q = question.trim().toLowerCase();
    return DEMO_QUESTIONS.some((dq) => dq.toLowerCase() === q);
  }

  /**
   * Repond a une question en mode demo (reponse pre-ecrite)
   */
  static getDemoAnswer(question: string): RAGResult {
    const q = question.trim().toLowerCase();
    const match = DEMO_QUESTIONS.find((dq) => dq.toLowerCase() === q);
    if (!match) {
      return {
        answer: "Question non reconnue en mode demo.",
        citations: [],
        mode: 'demo',
      };
    }
    const answer = DEMO_ANSWERS[match];
    return { answer: answer.text, citations: answer.citations, mode: 'demo' };
  }

  /**
   * Verifie si une cle API est disponible
   */
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Initialise le moteur : charge la Bible, vectorise tous les chunks
   * A appeler UNE SEULE FOIS au demarrage
   */
  async initialize(): Promise<void> {
    console.log('Initialisation du moteur RAG...');

    // 1. Essayer de charger les vecteurs pre-calcules (public/vectors.json)
    const indexed = await loadIndexedVectors();
    if (indexed) {
      this.store = indexed;
      this.initialized = true;
      console.log(`  ${this.store.size} chunks charges depuis vectors.json`);
      return;
    }

    // 2. Fallback : vectoriser a chaud via l'API
    console.log('  Fallback : vectorisation via API OpenAI...');
    const bible = loadBible();
    const chunks = chunkBible(bible);
    console.log(`  ${chunks.length} chunks charges`);

    const embeddings = createEmbeddingService(this.apiKey);
    this.store = new LocalVectorStore();

    const BATCH_SIZE = 50;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.text);
      const vectors = await embeddings.embedBatch(texts);

      for (let j = 0; j < batch.length; j++) {
        batch[j].embedding = vectors[j];
      }
      this.store.addChunks(batch);
    }

    this.initialized = true;
    console.log(`  ${this.store.size} chunks indexes dans le vector store`);
  }

  /**
   * Pose une question au moteur RAG
   * @param conversationHistory - historique des echanges precedents pour la memoire
   */
  async ask(question: string, conversationHistory?: ConversationTurn[]): Promise<RAGResult> {
    if (!this.initialized || !this.store) {
      return {
        answer: "Le moteur RAG n'est pas initialise. Reessaie dans un instant.",
        citations: [],
        mode: 'connecte',
      };
    }

    try {
      // 1. Vectoriser la question
      const embeddings = createEmbeddingService(this.apiKey);
      const questionVector = await embeddings.embedText(question);

      // 2. Chercher les 10 chunks les plus proches puis filtrer par score
      const SIMILARITY_THRESHOLD = 0.5;
      const allResults = this.store.search(questionVector, 10);
      const relevantResults = allResults.filter((r) => r.score >= SIMILARITY_THRESHOLD);

      // 3. Construire le contexte et les citations
      //    Si aucun passage pertinent → contexte vide (le LLM gere les salutations/hors-sujet)
      const hasPassages = relevantResults.length > 0;
      const context = hasPassages
        ? relevantResults
            .map(
              (r) =>
                `--- ${r.chunk.source.book} ${r.chunk.source.chapter}:${r.chunk.source.verses} ---\n${r.chunk.text}`
            )
            .join('\n\n')
        : '';

      const citations = hasPassages
        ? [
            ...new Set(
              relevantResults.map(
                (r) => `${r.chunk.source.book} ${r.chunk.source.chapter}:${r.chunk.source.verses}`
              )
            ),
          ]
        : [];

      // 4. Generer la reponse avec le LLM + historique
      //    Meme sans passages, le LLM repond avec bienveillance (salutations, hors-sujet)
      const llm = createLLMService(this.apiKey);
      const response = await llm.generateAnswer(question, context, conversationHistory);

      return {
        answer: response.text,
        citations,
        mode: 'connecte',
      };
    } catch (error) {
      console.error('Erreur pipeline RAG:', error);
      return {
        answer:
          "Desole, une erreur est survenue. Verifie ta cle API OpenAI et reessaie.",
        citations: [],
        mode: 'connecte',
      };
    }
  }

  /**
   * Pose une question au moteur RAG en mode STREAMING.
   * Les tokens arrivent un par un via callbacks.onToken.
   * A la fin, callbacks.onComplete fournit les citations.
   */
  async askStream(
    question: string,
    callbacks: RAGStreamCallbacks,
    conversationHistory?: ConversationTurn[]
  ): Promise<void> {
    if (!this.initialized || !this.store) {
      callbacks.onError(new Error("Le moteur RAG n'est pas initialise."));
      return;
    }

    try {
      // 1. Vectoriser la question
      const embeddings = createEmbeddingService(this.apiKey);
      const questionVector = await embeddings.embedText(question);

      // 2. Chercher les 10 chunks les plus proches puis filtrer par score
      const SIMILARITY_THRESHOLD = 0.5;
      const allResults = this.store.search(questionVector, 10);
      const relevantResults = allResults.filter((r) => r.score >= SIMILARITY_THRESHOLD);

      // 3. Construire le contexte et les citations
      const hasPassages = relevantResults.length > 0;
      const context = hasPassages
        ? relevantResults
            .map(
              (r) =>
                `--- ${r.chunk.source.book} ${r.chunk.source.chapter}:${r.chunk.source.verses} ---\n${r.chunk.text}`
            )
            .join('\n\n')
        : '';

      const citations = hasPassages
        ? [
            ...new Set(
              relevantResults.map(
                (r) => `${r.chunk.source.book} ${r.chunk.source.chapter}:${r.chunk.source.verses}`
              )
            ),
          ]
        : [];

      // 4. Lancer le streaming LLM
      const llm = createLLMService(this.apiKey);
      await llm.generateAnswerStream(question, context, {
        onToken: (token) => callbacks.onToken(token),
        onComplete: () => callbacks.onComplete(citations),
        onError: (error) => callbacks.onError(error),
      }, conversationHistory);
    } catch (error) {
      console.error('Erreur pipeline RAG (stream):', error);
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export { DEMO_QUESTIONS };
