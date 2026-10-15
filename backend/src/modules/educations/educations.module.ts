import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EducationsController } from './controllers/educations.controller.js';
import { EducationRepository } from './repositories/education.repository.js';
import { EducationsService } from './services/educations.service.js';

@Module({
  imports: [AuthModule],
  controllers: [EducationsController],
  providers: [EducationsService, EducationRepository],
  exports: [EducationsService],
})
export class EducationsModule {}
