import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { SocketIoAdapter } from './modules/chat/adapters/socket-io.adapter.js';
import { visitorCookieMiddleware } from './modules/chat/middlewares/visitor-cookie.middleware.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const corsOrigins = configService.getOrThrow<string[]>('CORS_ORIGINS');

  app.useWebSocketAdapter(new SocketIoAdapter(app, corsOrigins));
  app.use(cookieParser());
  app.use(visitorCookieMiddleware);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  
  app.useGlobalFilters(new GlobalExceptionFilter());

  const openApiConfig = new DocumentBuilder()
    .setTitle('Portfolio AI')
    .setDescription('Portfolio AI Agent API')
    .setVersion('0.0.1')
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);

  app.use('/docs', apiReference({ content: openApiDocument }));
  app
    .getHttpAdapter()
    .get('/openapi.json', (_, response) => response.json(openApiDocument));

  const port = configService.get<number>('PORT') ?? 8000;
  await app.listen(port);
}
await bootstrap();
