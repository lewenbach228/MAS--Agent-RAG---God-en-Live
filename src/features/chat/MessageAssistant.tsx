/**
 * MessageAssistant
 *
 * Bulle de reponse de l'assistant.
 * Affiche le texte de la reponse (avec sauts de ligne) + les citations en cartes.
 */

import { CitationCard } from './CitationCard';

interface MessageAssistantProps {
  text: string;
  citations?: string[];
  mode?: 'demo' | 'connecte';
}

export function MessageAssistant({ text, citations, mode }: MessageAssistantProps) {
  // Decouper le texte en paragraphes sur les sauts de ligne
  const paragraphs = text.split('\n').filter((p) => p.trim().length > 0);

  return (
    <div className="message message--assistant">
      <div className="message__avatar">✦</div>
      <div className="message__content">
        <div className="message__header">
          <span className="message__name">God en Live</span>
          {mode && (
            <span className={`message__badge message__badge--${mode}`}>
              {mode === 'demo' ? 'Demo' : 'Connecté'}
            </span>
          )}
        </div>
        <div className="message__text">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="message__paragraph">
              {paragraph}
            </p>
          ))}
        </div>
        {citations && citations.length > 0 && (
          <div className="message__citations">
            {citations.map((citation, index) => (
              <CitationCard key={`${citation}-${index}`} citation={citation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
