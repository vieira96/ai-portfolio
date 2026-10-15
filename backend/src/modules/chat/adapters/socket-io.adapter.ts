import { type INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

// O handshake do Socket.IO (polling) não passa pelos middlewares do Express,
// então o `enableCors` não o alcança: o cors do socket vive aqui.
export class SocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origins: string[],
  ) {
    super(app);
  }

  override create(
    port: number,
    options?: Parameters<IoAdapter['create']>[1],
  ): ReturnType<IoAdapter['create']> {
    // Parcial é válido em runtime (o engine.io aplica defaults via Object.assign
    // e amarra o middleware de cors na construção); o .d.ts aninhado do socket.io
    // exige o objeto cheio, daí a asserção contida — sem ela, só importando
    // internos do node_modules aninhado ou vendorizando defaults do engine.
    return super.create(port, {
      ...options,
      cors: { origin: this.origins, credentials: true },
    } as Parameters<IoAdapter['create']>[1]);
  }
}
