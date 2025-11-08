import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'; // agregado MiddlewareConsumer y NestModule
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './entities/user.entity';
import { RecoveryCode } from './entities/recovery-code.entity';
import { AuditLog } from './entities/audit-log.entity';
import { UsersModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { LoggerMiddleware } from './middleware/logger.middleware'; // agregado

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables de entorno estén disponibles globalmente
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'Admin01@',
      database: process.env.DB_NAME || 'sistema_auth',
      entities: [User, RecoveryCode, AuditLog],
      synchronize: true,
      autoLoadEntities: true,
      logging: true,
    }),
    UsersModule,
    AuthModule,
    EmailModule,
  ],
})
export class AppModule implements NestModule {
  //  implementa NestModule

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*'); //  aplica el middleware globalmente
  }
}
