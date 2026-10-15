import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchChatHistory, mergeHistoryMessages } from './chat-history';
import type { ChatMessage } from '@/types/chat/chat.types';

describe('fetchChatHistory', () => {
  const page = {
    data: [
      {
        id: 'msg-1',
        question: 'onde atuou?',
        answer: 'Atuei na Levante.',
        status: 'done',
        createdAt: '2026-10-01T12:00:00.000Z',
        updatedAt: '2026-10-01T12:00:31.000Z',
      },
    ],
    total: 1,
    page: 1,
    totalPages: 1,
  };

  function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls GET once with page, size and credentials', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, page));

    const result = await fetchChatHistory(2, 20);

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/messages?page=2&size=20'),
      expect.objectContaining({ credentials: 'include' }),
    );
    expect(result).toEqual(page);
  });

  it('throws a friendly error when the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, {}));

    await expect(fetchChatHistory(1, 20)).rejects.toThrow(
      'Não foi possível carregar o histórico',
    );
  });

  it('throws on network failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network'));

    await expect(fetchChatHistory(1, 20)).rejects.toThrow();
  });
});

describe('mergeHistoryMessages', () => {
  function pair(id: string, status: ChatMessage['status'] = 'done'): ChatMessage {
    return {
      id,
      question: `q-${id}?`,
      answer: status === 'done' ? `a-${id}` : null,
      status,
      createdAt: '2026-10-01T12:00:00.000Z',
      updatedAt: '2026-10-01T12:00:00.000Z',
    };
  }

  it('puts server first and local after', () => {
    expect(
      mergeHistoryMessages([pair('s-1'), pair('s-2')], [pair('l-1')]).map(
        (message) => message.id,
      ),
    ).toEqual(['s-1', 's-2', 'l-1']);
  });

  it('prefers the local copy on id conflict', () => {
    const merged = mergeHistoryMessages(
      [{ ...pair('x'), status: 'pending', answer: null }],
      [{ ...pair('x'), status: 'done', answer: 'pronta' }],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ status: 'done', answer: 'pronta' });
  });

  it('handles empty sides', () => {
    expect(mergeHistoryMessages([], [pair('l-1')]).map((m) => m.id)).toEqual([
      'l-1',
    ]);
    expect(mergeHistoryMessages([pair('s-1')], []).map((m) => m.id)).toEqual([
      's-1',
    ]);
  });
});
