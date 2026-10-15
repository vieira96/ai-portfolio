import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { EducationsModule } from '../educations/educations.module.js';
import { ExperiencesModule } from '../experiences/experiences.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { TechnologiesModule } from '../technologies/technologies.module.js';
import { UsersModule } from '../users/users.module.js';
import { AiModule } from '../ai/ai.module.js';
import { ChatGateway } from './gateways/chat.gateway.js';
import { ChatController } from './controllers/chat.controller.js';
import { ChatGenerationProcessor } from './processors/chat-generation.processor.js';
import { ChatMessageRepository } from './repositories/chat-message.repository.js';
import { ChatService } from './services/chat.service.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.getOrThrow<string>('REDIS_URL'),
          maxRetriesPerRequest: null,
        },
        forceDisconnectOnShutdown: true,
      }),
    }),
    BullModule.registerQueue({ name: 'chat-generation' }),
    AiModule,
    UsersModule,
    ProjectsModule,
    ExperiencesModule,
    TechnologiesModule,
    EducationsModule,
  ],
  providers: [
    ChatGateway,
    ChatMessageRepository,
    ChatService,
    ChatGenerationProcessor,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
