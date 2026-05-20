/**
 * Modeles de donnees pour la Bible
 */

/** Un livre de la Bible (ex: Genese, Matthieu) */
export interface Book {
  id: string;       // "gen", "mat"
  name: string;     // "Genese", "Matthieu"
  testament: 'ot' | 'nt';  // Ancien ou Nouveau Testament
  chapters: Chapter[];
}

/** Un chapitre d'un livre */
export interface Chapter {
  number: number;   // 1, 2, 3...
  verses: Verse[];
}

/** Un verset individuel */
export interface Verse {
  number: number;   // 1, 2, 3...
  text: string;     // Le texte du verset
}

/** Un chunk = un morceau de texte pret a etre vectorise */
export interface Chunk {
  id: string;              // "gen-1-1-3" (livre-chapitre-verset_debut-verset_fin)
  text: string;            // Le texte du chunk
  source: {
    book: string;          // "Genese"
    chapter: number;       // 1
    verses: string;        // "1-3" ou "5"
    testament: 'ot' | 'nt';
  };
  embedding?: number[];    // Vecteur (ajoute au moment de l'indexation)
}
