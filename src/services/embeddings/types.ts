/**
 * Types pour le service d'embeddings
 */

export interface EmbeddingService {
  /** Transforme un texte en vecteur de 1536 nombres */
  embedText(text: string): Promise<number[]>;

  /** Transforme plusieurs textes en vecteurs (optimise les appels API) */
  embedBatch(texts: string[]): Promise<number[][]>;
}
