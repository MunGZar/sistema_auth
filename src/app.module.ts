

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RecoveryCode } from './entities/recovery-code.entity';
import { AuditLog } from './entities/audit-log.entity';
import { UsersModule } from './modules/user/user.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'Admin01@',
      database: process.env.DB_NAME || 'sistema_auth',
      entities: [User, RecoveryCode, AuditLog,],
      synchronize: false, 
      logging: true,
    }),
    UsersModule
  ],
})
export class AppModule {}


