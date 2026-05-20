/**
 * ApiKeyModal
 *
 * Modale pour entrer sa cle API OpenAI.
 * La cle n'est pas stockee sur le serveur, seulement en session.
 */

import { useState, type FormEvent } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (apiKey: string) => void;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onSave, onClose }: ApiKeyModalProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();

    if (!trimmed) {
      setError('Veuillez entrer une cle API');
      return;
    }

    if (!trimmed.startsWith('sk-')) {
      setError('Une cle OpenAI commence par "sk-"');
      return;
    }

    setError('');
    onSave(trimmed);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>
          ✕
        </button>
        <h2 className="modal__title">Mode connecté</h2>
        <p className="modal__description">
          Entre ta clé API OpenAI pour utiliser le pipeline RAG complet.
          La clé n'est stockée que dans ta session (pas sur le serveur).
        </p>
        <form className="modal__form" onSubmit={handleSubmit}>
          <input
            className="modal__input"
            type="password"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError('');
            }}
            placeholder="sk-..."
            autoFocus
          />
          {error && <p className="modal__error">{error}</p>}
          <div className="modal__actions">
            <button type="button" className="modal__cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="modal__save">
              Connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
