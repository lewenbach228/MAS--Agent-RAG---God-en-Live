/**
 * Types pour le service de vector store
 */

export interface SearchResult {
  chunk: {
    id: string;
    text: string;
    source: {
      book: string;
      chapter: number;
      verses: string;
      testament: 'ot' | 'nt';
    };
  };
  score: number;
}

export interface VectorStore {
  addChunks(chunks: { id: string; text: string; vector: number[] }[]): void;
  search(queryVector: number[], topK?: number): SearchResult[];
  clear(): void;
  readonly size: number;
}
