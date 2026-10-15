import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { validateEnv } from './config/env.validation.js';
import { buildPinoOptions } from './config/pino.config.js';
import { PrismaModule } from './infra/database/prisma.module.js';
import { FileStorageModule } from './infra/storage/file-storage.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { TechnologiesModule } from './modules/technologies/technologies.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { EducationsModule } from './modules/educations/educations.module.js';
import { ExperiencesModule } from './modules/experiences/experiences.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot(buildPinoOptions()),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    FileStorageModule,
    AuthModule,
    UploadsModule,
    UsersModule,
    TechnologiesModule,
    ProjectsModule,
    ExperiencesModule,
    EducationsModule,
    AiModule,
    ChatModule,
  ],
})
export class AppModule {}
