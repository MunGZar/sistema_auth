import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { RecoveryCode } from './entities/recovery-code.entity';
import { AuditLog } from './entities/audit-log.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [User, RecoveryCode, AuditLog],
 synchronize: true,
  logging: false,
});
