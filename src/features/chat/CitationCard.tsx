/**
 * CitationCard
 *
 * Affiche une citation de verset biblique avec un style "parchemin"
 * Fond sombre, bordure doree a gauche, typographie elegante.
 */

interface CitationCardProps {
  citation: string;
}

export function CitationCard({ citation }: CitationCardProps) {
  return (
    <div className="citation-card">
      <div className="citation-card__bar" />
      <span className="citation-card__text">{citation}</span>
    </div>
  );
}
