import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TechnologiesModule } from '../technologies/technologies.module.js';
import { ProjectsController } from './controllers/projects.controller.js';
import { ProjectRepository } from './repositories/project.repository.js';
import { ProjectsService } from './services/projects.service.js';

@Module({
  imports: [AuthModule, TechnologiesModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectRepository],
  exports: [ProjectsService],
})
export class ProjectsModule {}
