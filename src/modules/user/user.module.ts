import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { AuditLog } from 'src/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User,AuditLog])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
