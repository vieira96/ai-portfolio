import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import type { Socket } from 'socket.io';
import { ChatGateway, resolveVisitorId, roomForVisitor } from './chat.gateway.js';

describe('ChatGateway', () => {
  function createClient(overrides: {
    requestVisitorId?: unknown;
    cookie?: string;
  } = {}) {
    const joinedRooms: string[] = [];
    const client = {
      handshake: { headers: { cookie: overrides.cookie } },
      request: { visitorId: overrides.requestVisitorId },
      data: {} as Record<string, unknown>,
      join: vi.fn(async (room: string) => {
        joinedRooms.push(room);
      }),
    } as unknown as Socket;
    return { client, joinedRooms };
  }

  async function createGateway(): Promise<ChatGateway> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatGateway],
    }).compile();

    return module.get<ChatGateway>(ChatGateway);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins the visitor room from the middleware id', async () => {
    const gateway = await createGateway();
    const visitorId = '123e4567-e89b-42d3-a456-426614174000';
    const { client, joinedRooms } = createClient({
      requestVisitorId: visitorId,
    });

    gateway.handleConnection(client);

    expect(client.data.visitorId).toBe(visitorId);
    expect(joinedRooms).toEqual([`visitor:${visitorId}`]);
  });

  it('falls back to the handshake cookie and then to a generated id', () => {
    const cookieId = '123e4567-e89b-42d3-a456-426614174000';
    expect(
      resolveVisitorId(createClient({ cookie: `chat_visitor=${cookieId}` }).client),
    ).toBe(cookieId);

    expect(roomForVisitor(cookieId)).toBe(`visitor:${cookieId}`);

    const generated = resolveVisitorId(createClient({}).client);
    expect(generated).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('exposes no send handler: the socket is push-only', async () => {
    const gateway = await createGateway();

    expect('handleSend' in gateway).toBe(false);
  });
});
