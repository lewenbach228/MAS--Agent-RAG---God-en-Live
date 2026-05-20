/**
 * Tests du chargeur de Bible
 */
import { describe, it, expect } from 'vitest';
import { loadBible, chunkBible, getVerse } from '../../../src/domain/bible/bibleLoader';

describe('bibleLoader', () => {
  const bible = loadBible();

  it('charge 66 livres', () => {
    expect(bible).toHaveLength(66);
  });

  it('commence par la Genese (Ancien Testament)', () => {
    const first = bible[0];
    expect(first.name).toBe('Genese');
    expect(first.testament).toBe('ot');
    expect(first.chapters.length).toBeGreaterThan(0);
  });

  it('finit par l Apocalypse (Nouveau Testament)', () => {
    const last = bible[bible.length - 1];
    expect(last.name).toBe('Apocalypse');
    expect(last.testament).toBe('nt');
  });

  it('Genese 1:1 contient le texte attendu', () => {
    const verse = getVerse(bible, 'Genese', 1, 1);
    expect(verse).toBeDefined();
    expect(verse).toContain('commencement');
    expect(verse).toContain('Dieu');
  });

  it('Jean 3:16 est present', () => {
    const verse = getVerse(bible, 'Jean', 3, 16);
    expect(verse).toBeDefined();
    expect(verse).toContain('Dieu');
    expect(verse).toContain('Fils unique');
  });

  it('retourne undefined pour un livre inexistant', () => {
    const verse = getVerse(bible, 'Inexistant', 1, 1);
    expect(verse).toBeUndefined();
  });
});

describe('chunkBible', () => {
  const bible = loadBible();
  const chunks = chunkBible(bible);

  it('produit au moins 1000 chunks (Bible volumineuse)', () => {
    expect(chunks.length).toBeGreaterThan(1000);
  });

  it('chaque chunk a un id unique', () => {
    const ids = chunks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque chunk a un texte non vide', () => {
    for (const chunk of chunks) {
      expect(chunk.text.length).toBeGreaterThan(0);
    }
  });

  it('chaque chunk a une source valide', () => {
    for (const chunk of chunks) {
      expect(chunk.source.book).toBeDefined();
      expect(chunk.source.chapter).toBeGreaterThan(0);
      expect(['ot', 'nt']).toContain(chunk.source.testament);
    }
  });

  it('les chunks de la Genese sont bien ranges', () => {
    const genChunks = chunks.filter((c) => c.source.book === 'Genese');
    expect(genChunks.length).toBeGreaterThan(0);
    expect(genChunks.every((c) => c.source.testament === 'ot')).toBe(true);
  });
});
