import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TechnologiesController } from './controllers/technologies.controller.js';
import { TechnologyRepository } from './repositories/technology.repository.js';
import { TechnologiesService } from './services/technologies.service.js';

@Module({
  imports: [AuthModule],
  controllers: [TechnologiesController],
  providers: [TechnologiesService, TechnologyRepository],
  exports: [TechnologiesService],
})
export class TechnologiesModule {}
