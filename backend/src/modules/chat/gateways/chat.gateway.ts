import { randomUUID } from 'node:crypto';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import {
  isVisitorId,
  readVisitorCookie,
} from '../middlewares/visitor-cookie.middleware.js';

export function roomForVisitor(visitorId: string): string {
  return `visitor:${visitorId}`;
}

export function resolveVisitorId(client: Socket): string {
  const fromRequest = (client.request as { visitorId?: unknown } | undefined)
    ?.visitorId;
  if (isVisitorId(fromRequest)) {
    return fromRequest;
  }
  const fromCookie = readVisitorCookie(client.handshake?.headers?.cookie);
  if (fromCookie) {
    return fromCookie;
  }
  return randomUUID();
}

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  private readonly server!: Server;

  handleConnection(client: Socket): void {
    const visitorId = resolveVisitorId(client);
    client.data.visitorId = visitorId;
    void client.join(roomForVisitor(visitorId));
  }

  emitToVisitor(visitorId: string, event: string, payload: unknown): void {
    this.server.to(roomForVisitor(visitorId)).emit(event, payload);
  }
}
