/**
 * ChatInput
 *
 * Barre de saisie pour poser une question.
 */

import { useState, type FormEvent } from 'react';

interface ChatInputProps {
  onSend: (question: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Pose ta question sur la Bible...',
}: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        className="chat-input__field"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={5000}
        autoFocus
      />
      <button
        className="chat-input__button"
        type="submit"
        disabled={disabled || !input.trim()}
      >
        Envoyer
      </button>
    </form>
  );
}
