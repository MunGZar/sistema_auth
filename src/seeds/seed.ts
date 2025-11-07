import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

async function runSeed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  const adminPassword = await bcrypt.hash('Admin123*', 10);
  const userPassword = await bcrypt.hash('User123*', 10);

  const admin = userRepo.create({
    nombreUsuario: 'admin',
    email: 'admin@mail.com',
    password: adminPassword,
    role: UserRole.ADMIN,
  });

  const user1 = userRepo.create({
    nombreUsuario: 'carlos',
    email: 'carlos@mail.com',
    password: userPassword,
    role: UserRole.USER,
  });

  const user2 = userRepo.create({
    nombreUsuario: 'laura',
    email: 'laura@mail.com',
    password: userPassword,
    role: UserRole.USER,
  });

  await userRepo.save([admin, user1, user2]);
  console.log(' Seeds ejecutados correctamente');

  await AppDataSource.destroy();
}

runSeed().catch((err) => console.error(err));
