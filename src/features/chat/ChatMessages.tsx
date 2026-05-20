/**
 * ChatMessages
 *
 * Affiche l'historique des messages de la conversation.
 * Scroll automatique vers le bas quand un nouveau message arrive.
 */

import { useEffect, useRef } from 'react';
import type { ChatMessage } from './types';
import { MessageUser } from './MessageUser';
import { MessageAssistant } from './MessageAssistant';

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="chat-messages">
      {messages.map((msg) =>
        msg.role === 'user' ? (
          <MessageUser key={msg.id} text={msg.text} />
        ) : (
          <MessageAssistant
            key={msg.id}
            text={msg.text}
            citations={msg.citations}
            mode={msg.mode}
          />
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
}
