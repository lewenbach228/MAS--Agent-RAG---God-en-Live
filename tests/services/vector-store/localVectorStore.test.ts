/**
 * Tests du vector store local
 */
import { describe, it, expect } from 'vitest';
import { LocalVectorStore } from '../../../src/services/vector-store/localVectorStore';
import type { Chunk } from '../../../src/domain/bible/types';

function makeChunk(id: string, text: string, vector: number[]): Chunk {
  return {
    id,
    text,
    source: {
      book: 'Genese',
      chapter: 1,
      verses: '1',
      testament: 'ot',
    },
    embedding: vector,
  };
}

describe('LocalVectorStore', () => {
  it('stocke et retourne le bon nombre de chunks', () => {
    const store = new LocalVectorStore();
    const chunks = [
      makeChunk('a', 'Dieu crea le ciel', [1, 0, 0]),
      makeChunk('b', 'La terre etait informe', [0, 1, 0]),
    ];
    store.addChunks(chunks);
    expect(store.size).toBe(2);
  });

  it('retourne le chunk le plus proche en premier', () => {
    const store = new LocalVectorStore();
    store.addChunks([
      makeChunk('proche', 'Dieu aime le monde', [0.9, 0.1, 0]),
      makeChunk('loin', 'Moise traversa le desert', [0.1, 0.9, 0]),
    ]);

    // Question proche du chunk 1 : vecteur [0.85, 0.15, 0]
    const results = store.search([0.85, 0.15, 0], 2);

    expect(results).toHaveLength(2);
    expect(results[0].chunk.id).toBe('proche');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('ignore les chunks sans embedding', () => {
    const store = new LocalVectorStore();
    const chunk = makeChunk('ok', 'texte', [1, 0, 0]);
    const bad = {
      id: 'bad',
      text: 'pas de vecteur',
      source: { book: 'Genese', chapter: 1, verses: '1', testament: 'ot' as const },
    };

    store.addChunks([chunk, bad as Chunk]);
    expect(store.size).toBe(1);
  });

  it('similarite cosinus retourne 1 pour vecteurs identiques', () => {
    const store = new LocalVectorStore();
    store.addChunks([makeChunk('id', 'test', [1, 2, 3])]);
    const results = store.search([1, 2, 3], 1);
    expect(results[0].score).toBeCloseTo(1, 5);
  });

  it('similarite cosinus retourne ~0 pour vecteurs orthogonaux', () => {
    const store = new LocalVectorStore();
    store.addChunks([makeChunk('id', 'test', [1, 0, 0])]);
    const results = store.search([0, 1, 0], 1);
    expect(results[0].score).toBeCloseTo(0, 5);
  });

  it('clear() vide le store', () => {
    const store = new LocalVectorStore();
    store.addChunks([makeChunk('a', 'test', [1, 0, 0])]);
    expect(store.size).toBe(1);
    store.clear();
    expect(store.size).toBe(0);
  });

  it('search retourne un tableau vide si le store est vide', () => {
    const store = new LocalVectorStore();
    const results = store.search([1, 0, 0], 3);
    expect(results).toEqual([]);
  });
});
