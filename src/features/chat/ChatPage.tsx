/**
 * ChatPage
 *
 * Page principale de l'application.
 * Assemble HeroHeader, ModeSelector, DemoQuestions, ChatMessages, ChatInput et ApiKeyModal.
 *
 * Le moteur RAG est initialise UNE SEULE FOIS quand l'utilisateur entre sa cle API,
 * puis reutilise pour toutes les questions (mode connecte).
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, AppMode } from './types';
import type { ConversationTurn } from '../../services/llm/types';
import { RAGEngine, DEMO_QUESTIONS } from '../../domain/rag/ragPipeline';
import type { RAGStreamCallbacks } from '../../domain/rag/ragPipeline';
import { HeroHeader } from './HeroHeader';
import { ModeSelector } from './ModeSelector';
import { DemoQuestions } from './DemoQuestions';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ApiKeyModal } from './ApiKeyModal';

export function ChatPage() {
  const [mode, setMode] = useState<AppMode>('demo');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStatus, setInitStatus] = useState('');

  // Le moteur RAG est stocke dans une ref pour etre reutilise
  const engineRef = useRef<RAGEngine | null>(null);

  // Au montage, restaurer la cle API depuis localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setMode('connecte');
    }
  }, []);

  // Initialiser le moteur RAG quand la cle API change
  useEffect(() => {
    if (apiKey && !engineRef.current) {
      initializeEngine();
    }
  }, [apiKey]);

  const initializeEngine = async () => {
    setIsInitializing(true);
    setInitStatus('Chargement de l\'index...');

    try {
      const engine = new RAGEngine(apiKey);
      await engine.initialize();
      engineRef.current = engine;
      setInitStatus('Pret !');
    } catch (err) {
      console.error('Erreur initialisation RAG:', err);
      setInitStatus('Erreur d\'initialisation');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleModeChange = useCallback(
    (newMode: AppMode) => {
      setMode(newMode);
      if (newMode === 'connecte' && !apiKey) {
        setIsModalOpen(true);
      }
    },
    [apiKey]
  );

  const handleApiKeySave = useCallback(
    (key: string) => {
      setApiKey(key);
      localStorage.setItem('openai_api_key', key);
      setMode('connecte');        // ← bascule automatiquement en mode connecté
      setIsModalOpen(false);
    },
    []
  );

  const askQuestion = useCallback(
    async (question: string) => {
      // Ajouter la question de l'utilisateur
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: question,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Petit delai pour l'experience utilisateur
      await new Promise((r) => setTimeout(r, 400));

      if (mode === 'demo') {
        // Mode demo : reponse pre-ecrite
        const result = RAGEngine.getDemoAnswer(question);
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: result.answer,
          citations: result.citations,
          mode: 'demo',
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else if (mode === 'connecte') {
        const engine = engineRef.current;

        if (!engine) {
          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            text: isInitializing
              ? 'Le moteur RAG est en cours d\'initialisation... Patientez quelques instants.'
              : 'Initialisez d\'abord le moteur RAG en entrant votre cle API.',
            citations: [],
            mode: 'connecte',
          };
          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          // Construire l'historique de la conversation pour la memoire
          const history: ConversationTurn[] = messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.text,
            }));

          // Creer le message assistant VIDE immediatement (le streaming va le remplir)
          const assistantId = `assistant-${Date.now()}`;
          setMessages((prev) => [...prev, {
            id: assistantId,
            role: 'assistant',
            text: '',
            citations: [],
            mode: 'connecte',
          }]);

          // Lancer le streaming
          try {
            await engine.askStream(question, {
              onToken: (token: string) => {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, text: m.text + token } : m
                  )
                );
              },
              onComplete: (citations: string[]) => {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, citations } : m
                  )
                );
              },
              onError: (_error: Error) => {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, text: 'Erreur lors de la recherche. Verifie ta cle API OpenAI.' }
                      : m
                  )
                );
              },
            }, history);
          } catch (err) {
            console.error('Erreur RAG:', err);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, text: 'Erreur lors de la recherche. Verifie ta cle API OpenAI.' }
                  : m
              )
            );
          }
        }
      }

      setIsLoading(false);
    },
    [mode, isInitializing, messages]
  );

  const handleDemoSelect = useCallback(
    (question: string) => {
      askQuestion(question);
    },
    [askQuestion]
  );

  return (
    <div className="chat-page">
      <HeroHeader
        title="God en Live"
        subtitle="Pose une question sur la Bible, obtiens une réponse avec les versets sources."
      />

      <div className="chat-page__controls">
        <ModeSelector mode={mode} onChange={handleModeChange} hasApiKey={!!apiKey} />
        {mode === 'connecte' && apiKey && (
          <button className="chat-page__change-key" onClick={() => setIsModalOpen(true)}>
            Changer la clé API
          </button>
        )}
      </div>

      {/* Message d'initialisation du moteur RAG */}
      {isInitializing && (
        <div className="chat-page__init">
          <span className="chat-page__init-text">{initStatus}</span>
          <div className="chat-page__typing">
            <span className="chat-page__typing-dot" />
            <span className="chat-page__typing-dot" />
            <span className="chat-page__typing-dot" />
          </div>
        </div>
      )}

      <div className="chat-page__content">
        {messages.length === 0 && mode === 'demo' && (
          <DemoQuestions
            questions={DEMO_QUESTIONS}
            onSelect={handleDemoSelect}
            disabled={isLoading}
          />
        )}

        <ChatMessages messages={messages} />

        {isLoading && !isInitializing && (
          <div className="chat-page__typing">
            <span className="chat-page__typing-dot" />
            <span className="chat-page__typing-dot" />
            <span className="chat-page__typing-dot" />
          </div>
        )}
      </div>

      <ChatInput
        onSend={askQuestion}
        disabled={isLoading || isInitializing}
        placeholder={
          mode === 'demo'
            ? 'Pose ta question... (mode demo : 3 questions disponibles)'
            : isInitializing
              ? 'Initialisation en cours...'
              : 'Pose ta question sur la Bible...'
        }
      />

      <ApiKeyModal
        isOpen={isModalOpen}
        onSave={handleApiKeySave}
        onClose={() => {
          setIsModalOpen(false);
          if (!apiKey) {
            setMode('demo');
          }
        }}
      />
    </div>
  );
}
