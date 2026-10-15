import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TechnologiesModule } from '../technologies/technologies.module.js';
import { ExperiencesController } from './controllers/experiences.controller.js';
import { ExperienceRepository } from './repositories/experience.repository.js';
import { ExperiencesService } from './services/experiences.service.js';

@Module({
  imports: [AuthModule, TechnologiesModule],
  controllers: [ExperiencesController],
  providers: [ExperiencesService, ExperienceRepository],
  exports: [ExperiencesService],
})
export class ExperiencesModule {}
