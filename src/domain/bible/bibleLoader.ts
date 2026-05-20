/**
 * Chargeur de la Bible Louis Segond 1910 au format JSON
 * Convertit le schema midvash/bible-data vers nos types domaine
 */

import type { Book, Chapter, Verse, Chunk } from './types';
import bibleRaw from './bible.json';

// Type du format source (midvash/bible-data)
interface RawBibleData {
  version: string;
  name: string;
  language: string;
  license: string;
  books: RawBook[];
}

interface RawBook {
  book: string;        // "Gen"
  bookId: number;      // 1
  englishName: string; // "Genesis"
  testament: 'OT' | 'NT';
  chapters: RawChapter[];
}

interface RawChapter {
  chapter: number;
  verses: RawVerse[];
}

interface RawVerse {
  number: number;
  text: string;
}

// Mapping des noms de livres OSIS → français
const BOOK_NAMES: Record<string, string> = {
  'Gen': 'Genese', 'Exod': 'Exode', 'Lev': 'Levitique', 'Num': 'Nombres',
  'Deut': 'Deuteronome', 'Josh': 'Josue', 'Judg': 'Juges', 'Ruth': 'Ruth',
  '1Sam': '1 Samuel', '2Sam': '2 Samuel', '1Kgs': '1 Rois', '2Kgs': '2 Rois',
  '1Chr': '1 Chroniques', '2Chr': '2 Chroniques', 'Ezra': 'Esdras',
  'Neh': 'Nehemie', 'Esth': 'Esther', 'Job': 'Job', 'Ps': 'Psaumes',
  'Prov': 'Proverbes', 'Eccl': 'Ecclesiaste', 'Song': 'Cantique',
  'Isa': 'Esaie', 'Jer': 'Jeremie', 'Lam': 'Lamentations', 'Ezek': 'Ezechiel',
  'Dan': 'Daniel', 'Hos': 'Osee', 'Joel': 'Joel', 'Amos': 'Amos',
  'Obad': 'Abdias', 'Jonah': 'Jonas', 'Mic': 'Michee', 'Nah': 'Nahum',
  'Hab': 'Habacuc', 'Zeph': 'Sophonie', 'Hag': 'Aggee', 'Zech': 'Zacharie',
  'Mal': 'Malachie',
  'Matt': 'Matthieu', 'Mark': 'Marc', 'Luke': 'Luc', 'John': 'Jean',
  'Acts': 'Actes', 'Rom': 'Romains', '1Cor': '1 Corinthiens',
  '2Cor': '2 Corinthiens', 'Gal': 'Galates', 'Eph': 'Ephesiens',
  'Phil': 'Philippiens', 'Col': 'Colossiens', '1Thess': '1 Thessaloniciens',
  '2Thess': '2 Thessaloniciens', '1Tim': '1 Timothee', '2Tim': '2 Timothee',
  'Titus': 'Tite', 'Phlm': 'Philemon', 'Heb': 'Hebreux', 'Jas': 'Jacques',
  '1Pet': '1 Pierre', '2Pet': '2 Pierre', '1John': '1 Jean', '2John': '2 Jean',
  '3John': '3 Jean', 'Jude': 'Jude', 'Rev': 'Apocalypse',
};

/**
 * Charge la Bible depuis le fichier JSON et la convertit en nos types
 */
export function loadBible(): Book[] {
  const raw = bibleRaw as unknown as RawBibleData;

  return raw.books.map((rawBook) => ({
    id: rawBook.book.toLowerCase(),
    name: BOOK_NAMES[rawBook.book] || rawBook.englishName,
    testament: rawBook.testament === 'OT' ? 'ot' : 'nt',
    chapters: rawBook.chapters.map((rawChapter) => ({
      number: rawChapter.chapter,
      verses: rawChapter.verses.map((rawVerse) => ({
        number: rawVerse.number,
        text: rawVerse.text,
      })),
    })),
  }));
}

/**
 * Recupere un livre par son nom
 */
export function getBook(bible: Book[], name: string): Book | undefined {
  return bible.find(
    (b) => b.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Recupere un verset specifique
 * Ex: "Jean 3:16" → { book: "Jean", chapter: 3, verse: 16 }
 */
export function getVerse(
  bible: Book[],
  bookName: string,
  chapterNum: number,
  verseNum: number
): string | undefined {
  const book = getBook(bible, bookName);
  if (!book) return undefined;
  const chapter = book.chapters.find((c) => c.number === chapterNum);
  if (!chapter) return undefined;
  const verse = chapter.verses.find((v) => v.number === verseNum);
  return verse?.text;
}

// Taille cible d'un chunk en caracteres (≈ 500-1000 caracteres)
const CHUNK_TARGET_SIZE = 750;

/**
 * Decoupe la Bible en chunks pour l'indexation vectorielle.
 * Chaque chunk comprend 1 ou plusieurs versets.
 */
export function chunkBible(bible: Book[]): Chunk[] {
  const chunks: Chunk[] = [];

  for (const book of bible) {
    for (const chapter of book.chapters) {
      let currentChunk: string[] = [];
      let currentSize = 0;
      let startVerse = 0;

      for (const verse of chapter.verses) {
        const verseText = `${verse.number}. ${verse.text}`;

        // Si ce verset depasse la cible a lui seul, on finalise le chunk en cours
        if (currentSize + verseText.length > CHUNK_TARGET_SIZE && currentChunk.length > 0) {
          // Sauvegarder le chunk courant
          chunks.push({
            id: `${book.id}-${chapter.number}-${startVerse}-${currentChunk.length + startVerse - 1}`,
            text: currentChunk.join(' '),
            source: {
              book: book.name,
              chapter: chapter.number,
              verses: startVerse > 0
                ? `${startVerse}-${startVerse + currentChunk.length - 1}`
                : `${startVerse + 1}-${currentChunk.length}`,
              testament: book.testament,
            },
          });
          currentChunk = [];
          currentSize = 0;
          startVerse = verse.number;
        }

        // Si le verset est trop long tout seul, il devient son propre chunk
        if (verseText.length > CHUNK_TARGET_SIZE) {
          if (currentChunk.length > 0) {
            chunks.push({
              id: `${book.id}-${chapter.number}-${startVerse}-${currentChunk.length + startVerse - 1}`,
              text: currentChunk.join(' '),
              source: {
                book: book.name,
                chapter: chapter.number,
                verses: `${startVerse}-${startVerse + currentChunk.length - 1}`,
                testament: book.testament,
              },
            });
          }
          chunks.push({
            id: `${book.id}-${chapter.number}-${verse.number}`,
            text: verseText,
            source: {
              book: book.name,
              chapter: chapter.number,
              verses: `${verse.number}`,
              testament: book.testament,
            },
          });
          currentChunk = [];
          currentSize = 0;
          startVerse = verse.number + 1;
          continue;
        }

        currentChunk.push(verseText);
        currentSize += verseText.length;
      }

      // Dernier chunk du chapitre
      if (currentChunk.length > 0) {
        chunks.push({
          id: `${book.id}-${chapter.number}-${startVerse}-${chapter.verses.length}`,
          text: currentChunk.join(' '),
          source: {
            book: book.name,
            chapter: chapter.number,
            verses: `${startVerse}-${chapter.verses.length}`,
            testament: book.testament,
          },
        });
      }
    }
  }

  return chunks;
}
