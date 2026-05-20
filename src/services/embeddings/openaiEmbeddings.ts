/**
 * Service d'embeddings via OpenAI API
 * 
 * Deux modes :
 * - "connecte" : appelle l'API OpenAI (necessite VITE_OPENAI_API_KEY)
 * - "mock" : genere des vecteurs aleatoires (pour dev sans cle API)
 */

import type { EmbeddingService } from './types';

// Modele d'embedding OpenAI
const MODEL = 'text-embedding-3-small';
const DIMENSION = 256; // taille reduite pour stockage leger (le modele supporte 256-1536)

/**
 * Cree un service d'embeddings qui utilise l'API OpenAI
 * Priorite : 1) parametre apiKey, 2) VITE_OPENAI_API_KEY, 3) mode mock
 */
export function createEmbeddingService(apiKey?: string): EmbeddingService {
  const key = apiKey || (import.meta.env.VITE_OPENAI_API_KEY as string | undefined);

  if (key && key.length > 0) {
    console.log('🔌 Service embeddings : mode connecte (OpenAI)');
    return new OpenAIEmbeddings(key);
  }

  console.log('🔌 Service embeddings : mode mock (vecteurs aleatoires)');
  return new MockEmbeddings();
}

/**
 * Implementation reelle via l'API OpenAI
 */
class OpenAIEmbeddings implements EmbeddingService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async embedText(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        input: texts,
        dimensions: DIMENSION,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();

    // Les resultats sont dans data.data, tries par index
    // https://platform.openai.com/docs/api-reference/embeddings/create
    const ordered = data.data.sort((a: { index: number }, b: { index: number }) => a.index - b.index);
    return ordered.map((item: { embedding: number[] }) => item.embedding);
  }
}

/**
 * Version mock : genere des vecteurs aleatoires
 * Utilisable pendant le developpement sans cle API
 */
class MockEmbeddings implements EmbeddingService {
  async embedText(text: string): Promise<number[]> {
    return this.generateRandomVector();
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(() => this.generateRandomVector());
  }

  private generateRandomVector(): number[] {
    const vector = new Array(DIMENSION);
    for (let i = 0; i < DIMENSION; i++) {
      vector[i] = (Math.random() - 0.5) * 2; // valeurs entre -1 et 1
    }
    return vector;
  }
}
