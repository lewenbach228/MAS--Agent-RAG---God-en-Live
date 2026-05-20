/**
 * Chargeur des vecteurs pre-calcules
 * 
 * Au lieu de vectoriser la Bible a chaque demarrage (5-10 min d'appels API),
 * on charge les vecteurs depuis un fichier JSON genere a la build.
 * 
 * Le fichier public/vectors.json est produit par :
 *   npm run index
 * 
 * Il contient les chunks + embeddings pour un demarrage instantane.
 */

import type { Chunk } from './types';
import { LocalVectorStore } from '../../services/vector-store/localVectorStore';

interface IndexedChunkData {
  id: string;
  text: string;
  source: {
    book: string;
    chapter: number;
    verses: string;
    testament: 'ot' | 'nt';
  };
  embedding: number[];
}

interface IndexedBibleData {
  model: string;
  dimension: number;
  date: string;
  totalChunks: number;
  chunks: IndexedChunkData[];
}

/**
 * Charge les vecteurs pre-calcules depuis public/vectors.json
 * 
 * @returns Un LocalVectorStore pret a l'emploi, ou null si le fichier n'existe pas
 */
export async function loadIndexedVectors(): Promise<LocalVectorStore | null> {
  try {
    const response = await fetch('/vectors.json');

    if (!response.ok) {
      console.warn(
        '⚠️  Fichier vectors.json introuvable. ' +
        'Execute `npm run index` pour le generer, ' +
        'ou utilise le mode fallback (embeddings runtime).'
      );
      return null;
    }

    const data: IndexedBibleData = await response.json();

    // Convertir les donnees JSON en chunks avec embeddings
    const chunks: Chunk[] = data.chunks.map((item) => ({
      id: item.id,
      text: item.text,
      source: item.source,
      embedding: item.embedding,
    }));

    // Charger dans le vector store
    const store = new LocalVectorStore();
    store.addChunks(chunks);

    console.log(
      `✅ Vecteurs pre-calcules charges : ${store.size} chunks ` +
      `(modele: ${data.model}, dimensions: ${data.dimension})`
    );

    return store;
  } catch (error) {
    console.warn(
      '⚠️  Impossible de charger les vecteurs pre-calcules :',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
