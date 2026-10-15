import { join } from 'node:path';

export function buildPinoOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  const today = new Date().toISOString().slice(0, 10);

  return {
    pinoHttp: {
      level: isProduction ? 'info' : 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          destination: join(process.cwd(), 'logs', `app-${today}.log`),
          mkdir: true,
          colorize: false,
          singleLine: false,
        },
      },
    },
  };
}
