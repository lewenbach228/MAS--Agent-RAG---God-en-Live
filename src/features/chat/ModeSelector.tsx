/**
 * ModeSelector
 *
 * Bascule entre mode demo (3 questions seedees) et mode connecte (API key).
 */

import type { AppMode } from './types';

interface ModeSelectorProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
  hasApiKey: boolean;
}

export function ModeSelector({ mode, onChange, hasApiKey }: ModeSelectorProps) {
  return (
    <div className="mode-selector">
      <button
        className={`mode-selector__btn ${mode === 'demo' ? 'mode-selector__btn--active' : ''}`}
        onClick={() => onChange('demo')}
      >
        <span className="mode-selector__dot" />
        Demo (3 questions)
      </button>
      <button
        className={`mode-selector__btn ${mode === 'connecte' ? 'mode-selector__btn--active' : ''}`}
        onClick={() => onChange('connecte')}
      >
        <span className="mode-selector__dot" />
        Connecté
        {hasApiKey && <span className="mode-selector__check">✓</span>}
      </button>
    </div>
  );
}
