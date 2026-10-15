import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UsersController } from './controllers/users.controller.js';
import { UserRepository } from './repositories/user.repository.js';
import { UsersService } from './services/users.service.js';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService],
})
export class UsersModule {}
