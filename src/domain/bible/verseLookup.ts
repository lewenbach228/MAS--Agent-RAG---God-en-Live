/**
 * verseLookup.ts
 *
 * Utilitaire pour retrouver le texte d'un verset a partir d'une citation.
 * Ex: "Jean 3:16" → le texte du verset Jean 3:16
 *
 * Cache le chargement de la Bible en memoire pour eviter de re-parser le JSON
 * a chaque clic sur une citation.
 */

import { loadBible, getVerse } from './bibleLoader';
import type { Book } from './types';

// Cache de la Bible (chargee une seule fois)
let bibleCache: Book[] | null = null;

function getBible(): Book[] {
  if (!bibleCache) {
    bibleCache = loadBible();
  }
  return bibleCache;
}

/**
 * Parse une citation comme "Jean 3:16" ou "1 Corinthiens 13:4-7" ou "Exode 3"
 * en ses composants : livre, chapitre, verset.
 *
 * La difficulte : les noms de livres peuvent comporter plusieurs mots
 * ("1 Corinthiens", "2 Rois", "1 Samuel").
 * On cherche le nom le plus long qui correspond au debut de la citation.
 */
function parseCitation(citation: string): {
  bookName: string;
  chapter: number;
  verse?: number;
} | null {
  if (!citation || citation.trim().length === 0) return null;

  // Recuperer les noms de livres charges
  const bible = getBible();
  const bookNames = bible.map((b) => b.name);

  // Trier par longueur decroissante pour matcher "1 Corinthiens" avant "Corinthiens"
  bookNames.sort((a, b) => b.length - a.length);

  for (const bookName of bookNames) {
    if (!citation.startsWith(bookName)) continue;

    // Extraire la partie apres le nom du livre
    const rest = citation.slice(bookName.length).trim();
    if (rest.length === 0) return null; // juste le nom du livre, pas de chapitre

    // Pattern : "chapitre:verset" ou "chapitre:verset_debut-verset_fin" ou juste "chapitre"
    const match = rest.match(/^(\d+)(?::(\d+))?/);
    if (!match) return null;

    const chapter = parseInt(match[1], 10);
    const verse = match[2] ? parseInt(match[2], 10) : undefined;

    return { bookName, chapter, verse };
  }

  return null;
}

/**
 * Cherche le texte d'un verset a partir d'une citation.
 *
 * @param citation - "Jean 3:16", "1 Corinthiens 13:4-7", "Exode 3"
 * @returns Le texte du verset + la reference precise, ou null si introuvable
 */
export function lookupVerse(citation: string): {
  reference: string;
  text: string;
} | null {
  const parsed = parseCitation(citation);
  if (!parsed) return null;

  const bible = getBible();
  const { bookName, chapter, verse } = parsed;

  // Si un verset specifique est demande
  if (verse !== undefined) {
    const text = getVerse(bible, bookName, chapter, verse);
    if (!text) {
      // Fallback : essayer de trouver le chapitre
      return lookupChapter(bible, bookName, chapter);
    }
    return {
      reference: `${bookName} ${chapter}:${verse}`,
      text,
    };
  }

  // Si seulement le chapitre est demande (ex: "Exode 3")
  return lookupChapter(bible, bookName, chapter);
}

/**
 * Cherche le texte d'un chapitre entier.
 */
function lookupChapter(
  bible: Book[],
  bookName: string,
  chapter: number
): { reference: string; text: string } | null {
  const book = bible.find((b) => b.name === bookName);
  if (!book) return null;

  const ch = book.chapters.find((c) => c.number === chapter);
  if (!ch || ch.verses.length === 0) return null;

  // Retourner les 3 premiers versets comme apercu du chapitre
  const previewVerses = ch.verses.slice(0, 3);
  const text = previewVerses
    .map((v) => `${v.number}. ${v.text}`)
    .join(' ');

  return {
    reference: `${bookName} ${chapter}:${previewVerses[0].number}-${previewVerses[previewVerses.length - 1].number}`,
    text: text + '...',
  };
}
