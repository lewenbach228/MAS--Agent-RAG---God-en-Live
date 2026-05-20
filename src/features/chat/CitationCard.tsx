/**
 * CitationCard
 *
 * Affiche une citation de verset biblique avec un style "parchemin".
 * Au clic, le texte du verset apparait en dessous de la reference.
 *
 * Fond sombre, bordure doree a gauche, typographie elegante.
 */

import { useState } from 'react';
import { lookupVerse } from '../../domain/bible/verseLookup';

interface CitationCardProps {
  citation: string;
}

export function CitationCard({ citation }: CitationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [verseData, setVerseData] = useState<{
    reference: string;
    text: string;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    // Chercher le texte du verset (avec cache)
    if (!verseData && !notFound) {
      const result = lookupVerse(citation);
      if (result) {
        setVerseData(result);
      } else {
        setNotFound(true);
      }
    }

    setIsExpanded(true);
  };

  return (
    <div className={`citation-card ${isExpanded ? 'citation-card--expanded' : ''}`}>
      <button
        className="citation-card__header"
        onClick={handleClick}
        title="Cliquez pour voir le texte du verset"
      >
        <div className="citation-card__bar" />
        <span className="citation-card__text">{citation}</span>
        <span className="citation-card__chevron">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div className="citation-card__body">
          {notFound && (
            <p className="citation-card__error">
              Texte non trouvé pour cette référence.
            </p>
          )}
          {verseData && (
            <>
              <p className="citation-card__verse-text">{verseData.text}</p>
              <span className="citation-card__verse-ref">{verseData.reference}</span>
            </>
          )}
          {!verseData && !notFound && (
            <p className="citation-card__loading">Chargement...</p>
          )}
        </div>
      )}
    </div>
  );
}
