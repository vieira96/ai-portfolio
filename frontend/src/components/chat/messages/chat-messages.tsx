import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/chat/chat.types';
import { ChatBubble } from './chat-bubble';

interface ChatMessagesProps {
  messages: ChatMessage[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRetry?: (question: string) => void;
}

export function ChatMessages({
  messages,
  hasMore,
  loadingMore,
  onLoadMore,
  onRetry,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stuckRef = useRef(true);

  function handleScroll() {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    stuckRef.current = distance < 24;
    if (container.scrollTop < 48 && hasMore && !loadingMore) {
      onLoadMore();
    }
  }

  useEffect(() => {
    const container = containerRef.current;
    if (container && stuckRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-center text-sm text-slate-400">
          Pergunte sobre experiência, projetos e habilidades.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="log"
      aria-label="Mensagens do chat"
      onScroll={handleScroll}
      className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3"
    >
      {loadingMore ? (
        <p className="text-center text-xs text-slate-500">
          Carregando mensagens anteriores...
        </p>
      ) : null}
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} onRetry={onRetry} />
      ))}
    </div>
  );
}
