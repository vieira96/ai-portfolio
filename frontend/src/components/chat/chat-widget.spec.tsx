import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { ChatWidget } from './chat-widget';

const { socketListeners, mockIo, mockSocketDisconnect, emitServerEvent } =
  vi.hoisted(() => {
    const socketListeners = new Map<string, Array<(payload: unknown) => void>>();
    const mockSocketDisconnect = vi.fn();
    const mockIo = vi.fn(() => ({
      on: vi.fn((event: string, callback: (payload: unknown) => void) => {
        const current = socketListeners.get(event) ?? [];
        current.push(callback);
        socketListeners.set(event, current);
      }),
      disconnect: mockSocketDisconnect,
    }));
    function emitServerEvent(event: string, payload: unknown) {
      for (const callback of socketListeners.get(event) ?? []) {
        callback(payload);
      }
    }
    return { socketListeners, mockIo, mockSocketDisconnect, emitServerEvent };
  });

vi.mock('socket.io-client', () => ({ io: mockIo }));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

interface MockItem {
  id: string;
  question: string;
  answer: string | null;
  status: 'pending' | 'done' | 'failed';
  createdAt: string;
  updatedAt: string;
}

function historyResponse(page: number, size: number, total: number) {
  const totalPages = Math.ceil(total / size);
  const start = (page - 1) * size + 1;
  const end = Math.min(page * size, total);
  const data: MockItem[] = [];
  for (let n = start; n <= end; n += 1) {
    data.push({
      id: `m-${n}`,
      question: `pergunta ${n}?`,
      answer: `resposta ${n}`,
      status: 'done',
      createdAt: `2026-10-01T12:00:00.000Z`,
      updatedAt: `2026-10-01T12:00:00.000Z`,
    });
  }
  return { data, total, page, totalPages };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function openPanel() {
  fireEvent.click(screen.getByRole('button', { name: /abrir chat/i }));
}

describe('ChatWidget history', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches once on mount and renders history in order', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, historyResponse(1, 20, 2)));
    render(<ChatWidget />);
    openPanel();

    await waitFor(() => {
      expect(screen.getByText('pergunta 1?')).toBeInTheDocument();
    });
    expect(screen.getByText('resposta 2')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/messages?page=1&size=20'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('loads the last page first and older ones on scroll up', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input);
      const page = Number(/page=(\d+)/.exec(url)?.[1] ?? 1);
      return Promise.resolve(jsonResponse(200, historyResponse(page, 20, 45)));
    });
    render(<ChatWidget />);
    openPanel();

    await waitFor(() => {
      expect(screen.getByText('pergunta 45?')).toBeInTheDocument();
    });
    expect(screen.queryByText('pergunta 1?')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);

    fireEvent.scroll(screen.getByRole('log'));

    await waitFor(() => {
      expect(screen.getByText('pergunta 21?')).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledTimes(3);
    const calls = vi.mocked(fetch).mock.calls.map((call) => String(call[0]));
    expect(calls[2]).toContain('page=2');
  });

  it('fails silently on mount and retries from the error state', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network'));
    render(<ChatWidget />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    openPanel();

    await waitFor(() => {
      expect(
        screen.getByText('Não foi possível carregar a conversa. Tente novamente.'),
      ).toBeInTheDocument();
    });

    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, historyResponse(1, 20, 1)));
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    await waitFor(() => {
      expect(screen.getByText('pergunta 1?')).toBeInTheDocument();
    });
  });

  it('shows the oriented empty state without history', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, historyResponse(1, 20, 0)));
    render(<ChatWidget />);
    openPanel();

    await waitFor(() => {
      expect(
        screen.getByText('Pergunte sobre experiência, projetos e habilidades.'),
      ).toBeInTheDocument();
    });
  });

});

describe('ChatWidget send (POST)', () => {
  const createdAt = '2026-10-08T12:00:00.000Z';

  function postCalls() {
    return vi
      .mocked(fetch)
      .mock.calls.filter(
        (call) => (call[1] as RequestInit)?.method === 'POST',
      );
  }

  async function sendMessage(text: string) {
    fireEvent.change(screen.getByLabelText(/digite sua pergunta/i), {
      target: { value: text },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pergunta' }));
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts the message and shows pending on 201', async () => {
    vi.mocked(fetch).mockImplementation((input, init) => {
      if ((init as RequestInit)?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(201, { id: 'new-1', status: 'pending', createdAt }),
        );
      }
      return Promise.resolve(jsonResponse(200, historyResponse(1, 20, 0)));
    });
    render(<ChatWidget />);
    openPanel();

    await waitFor(() => {
      expect(
        screen.getByText('Pergunte sobre experiência, projetos e habilidades.'),
      ).toBeInTheDocument();
    });

    await sendMessage('pergunta nova?');

    expect(postCalls()).toHaveLength(1);
    expect(postCalls()[0][0]).toMatch(/\/chat\/messages$/);
    expect(postCalls()[0][1]).toMatchObject({
      method: 'POST',
      credentials: 'include',
    });
    expect(
      JSON.parse(String((postCalls()[0][1] as RequestInit).body)),
    ).toEqual({ message: 'pergunta nova?' });
    await waitFor(() => {
      expect(screen.getByText('pergunta nova?')).toBeInTheDocument();
      expect(screen.getByLabelText('IA digitando')).toBeInTheDocument();
    });
  });

  it('renders the invalid-subject answer on 200 without queueing', async () => {
    vi.mocked(fetch).mockImplementation((input, init) => {
      if ((init as RequestInit)?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(200, {
            answer:
              'Desculpe, só respondo perguntas sobre experiência, projetos, habilidades e formação.',
          }),
        );
      }
      return Promise.resolve(jsonResponse(200, historyResponse(1, 20, 0)));
    });
    render(<ChatWidget />);
    openPanel();

    await sendMessage('qual seu telefone?');

    await waitFor(() => {
      expect(
        screen.getByText(/Desculpe, só respondo perguntas sobre/),
      ).toBeInTheDocument();
    });
    expect(postCalls()).toHaveLength(1);
    expect(screen.queryByLabelText('IA digitando')).not.toBeInTheDocument();
  });

  it('shows only toast without a pair on 503', async () => {
    vi.mocked(fetch).mockImplementation((input, init) => {
      if ((init as RequestInit)?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(503, { code: 'QUEUE_UNAVAILABLE' }),
        );
      }
      return Promise.resolve(jsonResponse(200, historyResponse(1, 20, 0)));
    });
    render(<ChatWidget />);
    openPanel();

    await sendMessage('pergunta nova?');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Não foi possível responder. Tente novamente.',
      );
    });
    expect(screen.queryByText('pergunta nova?')).not.toBeInTheDocument();
  });

  it('keeps user-sent pairs when history resolves late (mount race)', async () => {
    let resolveHistory!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation((input, init) => {
      if ((init as RequestInit)?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(201, {
            id: 'new-9',
            status: 'pending',
            createdAt: '2026-10-08T12:00:00.000Z',
          }),
        );
      }
      return new Promise<Response>((resolve) => {
        resolveHistory = resolve;
      });
    });
    render(<ChatWidget />);
    openPanel();

    await sendMessage('pergunta corrida?');

    await waitFor(() => {
      expect(screen.getByText('pergunta corrida?')).toBeInTheDocument();
    });

    resolveHistory(jsonResponse(200, historyResponse(1, 20, 1)));

    await waitFor(() => {
      expect(screen.getByText('pergunta 1?')).toBeInTheDocument();
    });
    expect(screen.getByText('pergunta corrida?')).toBeInTheDocument();
  });

  it('shows only toast without a pair on network failure', async () => {
    vi.mocked(fetch).mockImplementation((input, init) => {
      if ((init as RequestInit)?.method === 'POST') {
        return Promise.reject(new Error('network'));
      }
      return Promise.resolve(jsonResponse(200, historyResponse(1, 20, 0)));
    });
    render(<ChatWidget />);
    openPanel();

    await sendMessage('pergunta nova?');

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
    expect(screen.queryByText('pergunta nova?')).not.toBeInTheDocument();
  });

  it('blocks empty submit without posting', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, historyResponse(1, 20, 0)),
    );
    render(<ChatWidget />);
    openPanel();

    fireEvent.change(screen.getByLabelText(/digite sua pergunta/i), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pergunta' }));

    await waitFor(() => {
      expect(screen.getByText('Digite uma pergunta.')).toBeInTheDocument();
    });
    expect(postCalls()).toHaveLength(0);
  });
});

describe('ChatWidget retry', () => {
  const createdAt = '2026-10-08T12:00:00.000Z';

  function failedHistory() {
    return {
      data: [
        {
          id: 'old-1',
          question: 'pergunta falha?',
          answer: null,
          status: 'failed',
          createdAt,
          updatedAt: createdAt,
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    };
  }

  function postCalls() {
    return vi
      .mocked(fetch)
      .mock.calls.filter(
        (call) => (call[1] as RequestInit)?.method === 'POST',
      );
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows retry on history failed pairs', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, failedHistory()));
    render(<ChatWidget />);
    openPanel();

    await waitFor(() => {
      expect(screen.getByText('pergunta falha?')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: 'Tentar de novo' }),
    ).toBeInTheDocument();
  });

  it('retry posts again and appends a new pair without editing the failed one', async () => {
    vi.mocked(fetch).mockImplementation((input, init) => {
      if ((init as RequestInit)?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(201, { id: 'new-2', status: 'pending', createdAt }),
        );
      }
      return Promise.resolve(jsonResponse(200, failedHistory()));
    });
    render(<ChatWidget />);
    openPanel();

    await waitFor(() => {
      expect(screen.getByText('pergunta falha?')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    await waitFor(() => {
      expect(postCalls()).toHaveLength(1);
    });
    expect(JSON.parse(String((postCalls()[0][1] as RequestInit).body))).toEqual({
      message: 'pergunta falha?',
    });
    const questions = screen.getAllByText('pergunta falha?');
    expect(questions).toHaveLength(2);
  });
});

describe('ChatWidget stream (socket)', () => {
  const createdAt = '2026-10-08T12:00:00.000Z';

  function stubPost201() {
    vi.mocked(fetch).mockImplementation((input, init) => {
      if ((init as RequestInit)?.method === 'POST') {
        return Promise.resolve(
          jsonResponse(201, { id: 'sock-1', status: 'pending', createdAt }),
        );
      }
      return Promise.resolve(jsonResponse(200, historyResponse(1, 20, 0)));
    });
  }

  async function sendAndWaitPending(text: string) {
    fireEvent.change(screen.getByLabelText(/digite sua pergunta/i), {
      target: { value: text },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pergunta' }));
    await waitFor(() => {
      expect(screen.getByLabelText('IA digitando')).toBeInTheDocument();
    });
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    socketListeners.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('connects on open with the backend URL and disconnects on close', async () => {
    stubPost201();
    render(<ChatWidget />);
    expect(mockIo).not.toHaveBeenCalled();

    openPanel();

    await waitFor(() => {
      expect(mockIo).toHaveBeenCalledTimes(1);
    });
    expect(mockIo).toHaveBeenCalledWith(
      expect.stringContaining('http'),
      expect.anything(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fechar chat' }));

    await waitFor(() => {
      expect(mockSocketDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  it('appends tokens and freezes on done', async () => {
    stubPost201();
    render(<ChatWidget />);
    openPanel();
    await sendAndWaitPending('pergunta socket?');

    act(() => {
      emitServerEvent('chat:token', { delta: 'Olá ' });
      emitServerEvent('chat:token', { delta: 'mundo' });
      emitServerEvent('chat:done', { answer: 'Olá mundo' });
    });

    await waitFor(() => {
      expect(screen.getByText('Olá mundo')).toBeInTheDocument();
    });
    expect(screen.queryByLabelText('IA digitando')).not.toBeInTheDocument();
  });

  it('fails the pair and toasts on chat:error without done', async () => {
    stubPost201();
    render(<ChatWidget />);
    openPanel();
    await sendAndWaitPending('pergunta socket?');

    act(() => {
      emitServerEvent('chat:error', { code: 'TIMEOUT', message: 'Demorou.' });
    });

    await waitFor(() => {
      expect(
        screen.getByText('Não foi possível responder. Tente novamente.'),
      ).toBeInTheDocument();
    });
    expect(toast.error).toHaveBeenCalled();
  });
});
