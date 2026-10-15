'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/shadcn/button';
import { ChatFab } from './chat-fab';
import { ChatInput } from './forms/chat-input';
import { ChatMessages } from './messages/chat-messages';
import { ChatPanel } from './chat-panel';
import { CHAT_API_BASE_URL } from '@/lib/chat/chat-api';
import { fetchChatHistory, mergeHistoryMessages } from '@/lib/chat/chat-history';
import { sendChatMessage } from '@/lib/chat/chat-send';
import type { ChatMessage } from '@/types/chat/chat.types';

const HISTORY_SIZE = 20;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);
  const loadedRef = useRef(false);
  const pendingIdRef = useRef<string | null>(null);

  const loadLatest = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError(false);
    try {
      const first = await fetchChatHistory(1, HISTORY_SIZE);
      if (first.totalPages > 1) {
        const last = await fetchChatHistory(first.totalPages, HISTORY_SIZE);
        setMessages((current) => mergeHistoryMessages(last.data, current));
        setPage(last.page);
        setHasMore(last.page > 1);
      } else {
        setMessages((current) => mergeHistoryMessages(first.data, current));
        setPage(first.page);
        setHasMore(false);
      }
    } catch {
      setHistoryError(true);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (loadedRef.current) {
      return;
    }
    loadedRef.current = true;
    void loadLatest();
  }, [loadLatest]);

  function appendToken(pairId: string, delta: string) {
    setMessages((current) =>
      current.map((message) =>
        message.id === pairId
          ? { ...message, answer: `${message.answer ?? ''}${delta}` }
          : message,
      ),
    );
  }

  function finishStreamedPair(
    pairId: string,
    patch: Partial<Pick<ChatMessage, 'answer' | 'status'>>,
  ) {
    pendingIdRef.current = null;
    const now = new Date().toISOString();
    setMessages((current) =>
      current.map((message) =>
        message.id === pairId
          ? { ...message, ...patch, updatedAt: now }
          : message,
      ),
    );
    setStreaming(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }
    const socket: Socket = io(CHAT_API_BASE_URL, { withCredentials: true });
    socket.on('chat:token', (payload: { delta: string }) => {
      const pairId = pendingIdRef.current;
      if (pairId) {
        appendToken(pairId, payload.delta);
      }
    });
    socket.on('chat:done', (payload: { answer: string }) => {
      const pairId = pendingIdRef.current;
      if (!pairId) {
        return;
      }
      finishStreamedPair(pairId, { answer: payload.answer, status: 'done' });
    });
    socket.on('chat:error', () => {
      const pairId = pendingIdRef.current;
      if (!pairId) {
        return;
      }
      finishStreamedPair(pairId, { status: 'failed' });
      toast.error('Não foi possível responder. Tente novamente.');
    });
    return () => {
      socket.disconnect();
    };
  }, [open]);

  async function handleLoadMore() {
    if (loadingMore || !hasMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const older = await fetchChatHistory(page - 1, HISTORY_SIZE);
      setMessages((current) => [...older.data, ...current]);
      setPage(older.page);
      setHasMore(older.page > 1);
    } catch {
      // Mantém a lista e permite tentar de novo rolando: sem estado novo.
    } finally {
      setLoadingMore(false);
    }
  }

  function handleToggle() {
    setOpen((current) => !current);
  }

  function handleClose() {
    setOpen(false);
    fabRef.current?.focus();
  }

  async function handleSend(text: string) {
    if (streaming) {
      return;
    }
    setStreaming(true);
    try {
      const result = await sendChatMessage(text);
      const now = new Date().toISOString();
      if (result.kind === 'invalid') {
        setMessages((current) => [
          ...current,
          {
            id: `invalid-${Date.now()}`,
            question: text,
            answer: result.answer,
            status: 'done',
            createdAt: now,
            updatedAt: now,
          },
        ]);
        setStreaming(false);
      } else {
        pendingIdRef.current = result.id;
        setMessages((current) => [
          ...current,
          {
            id: result.id,
            question: text,
            answer: null,
            status: 'pending',
            createdAt: result.createdAt,
            updatedAt: result.createdAt,
          },
        ]);
        // Libera no `done`/`error` do socket; até lá, segue pendente.
      }
    } catch {
      // Falha no envio não cria par: só toast. Nada persiste sem `POST` ok.
      toast.error('Não foi possível responder. Tente novamente.');
      setStreaming(false);
    }
  }

  function renderPanelContent() {
    if (historyError && messages.length === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
          <p className="text-center text-sm text-slate-300">
            Não foi possível carregar a conversa. Tente novamente.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void loadLatest()}>
            Tentar de novo
          </Button>
        </div>
      );
    }
    if (loadingHistory && messages.length === 0) {
      return (
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-center text-sm text-slate-400">Carregando conversa...</p>
        </div>
      );
    }
    return (
      <ChatMessages
        messages={messages}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={() => void handleLoadMore()}
        onRetry={handleSend}
      />
    );
  }

  return (
    <>
      <ChatFab fabRef={fabRef} expanded={open} onToggle={handleToggle} />
      {open ? (
        <ChatPanel onClose={handleClose}>
          {renderPanelContent()}
          <ChatInput disabled={streaming} onSubmit={handleSend} />
        </ChatPanel>
      ) : null}
    </>
  );
}
