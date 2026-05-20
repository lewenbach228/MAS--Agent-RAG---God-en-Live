/**
 * Vector store local
 * Stocke les vecteurs en memoire et cherche les plus proches
 * via similarite cosinus.
 *
 * Usage :
 *   const store = new LocalVectorStore();
 *   store.addChunks(chunks);        // indexer
 *   const result = store.search(queryVector, 3); // chercher
 */

import type { Chunk } from '../../domain/bible/types';

interface StoredChunk {
  chunk: Chunk;
  vector: number[];
}

/**
 * Calcule la similarite cosinus entre deux vecteurs
 * Retourne un score entre -1 et 1 (1 = identique)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  // Produit scalaire : somme de (a[i] * b[i])
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  // Eviter la division par zero
  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class LocalVectorStore {
  private items: StoredChunk[] = [];

  /**
   * Ajoute un lot de chunks vectorises dans le store
   * Chaque chunk doit avoir son embedding dans chunk.embedding
   */
  addChunks(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      if (!chunk.embedding) {
        console.warn(`Chunk ${chunk.id} n'a pas d'embedding, ignore`);
        continue;
      }
      this.items.push({ chunk, vector: chunk.embedding });
    }
  }

  /**
   * Vide le store
   */
  clear(): void {
    this.items = [];
  }

  /**
   * Retourne le nombre de chunks indexes
   */
  get size(): number {
    return this.items.length;
  }

  /**
   * Cherche les chunks les plus proches du vecteur de requete
   * @param queryVector - le vecteur de la question
   * @param topK - nombre de resultats a retourner (defaut: 3)
   * @returns les chunks tries par pertinence (score descendant)
   */
  search(queryVector: number[], topK: number = 3): { chunk: Chunk; score: number }[] {
    // 1. Calculer le score de chaque chunk stocke
    const scored = this.items.map((item) => ({
      chunk: item.chunk,
      score: cosineSimilarity(queryVector, item.vector),
    }));

    // 2. Trier par score descendant (le plus proche en premier)
    scored.sort((a, b) => b.score - a.score);

    // 3. Garder les topK meilleurs
    return scored.slice(0, topK);
  }
}
