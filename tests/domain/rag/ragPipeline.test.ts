/**
 * Tests du pipeline RAG
 */
import { describe, it, expect } from 'vitest';
import { RAGEngine, DEMO_QUESTIONS } from '../../../src/domain/rag/ragPipeline';

describe('RAGEngine - mode demo', () => {
  it('reconnait les 3 questions demo', () => {
    for (const q of DEMO_QUESTIONS) {
      expect(RAGEngine.isDemoQuestion(q)).toBe(true);
    }
  });

  it('rejette une question qui n est pas dans la demo', () => {
    expect(RAGEngine.isDemoQuestion('Qui est Jesus ?')).toBe(false);
  });

  it('retourne une reponse pour chaque question demo', () => {
    for (const q of DEMO_QUESTIONS) {
      const result = RAGEngine.getDemoAnswer(q);
      expect(result.mode).toBe('demo');
      expect(result.answer.length).toBeGreaterThan(50);
      expect(result.citations.length).toBeGreaterThan(0);
    }
  });

  it('retourne une erreur pour une question demo inconnue', () => {
    const result = RAGEngine.getDemoAnswer('Question inconnue');
    expect(result.mode).toBe('demo');
    expect(result.answer).toContain('non reconnue');
  });

  it('chaque reponse demo cite des sources', () => {
    for (const q of DEMO_QUESTIONS) {
      const result = RAGEngine.getDemoAnswer(q);
      expect(result.citations.length).toBeGreaterThan(0);
      for (const citation of result.citations) {
        // Format attendu : "Livre" seul, "Livre Chapitre", ou "Livre Chapitre:Verset"
        expect(typeof citation).toBe('string');
        expect(citation.length).toBeGreaterThan(0);
      }
    }
  });
});
