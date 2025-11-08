import { AppDataSource } from '../src/data-source';
import { User, UserRole } from '../src/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function runSeed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  const adminPassword = await bcrypt.hash('Admin123*', 10);
  const userPassword = await bcrypt.hash('User123*', 10);

  const admin = userRepo.create({
    nombre: 'Admin',
    apellido: 'System',
    nombreUsuario: 'admin',
    email: 'admin@mail.com',
    contraseña: adminPassword,
    role: UserRole.ADMIN,
  });

  const user1 = userRepo.create({
    nombre: 'Carlos',
    apellido: 'Pérez',
    nombreUsuario: 'carlos',
    email: 'carlos@mail.com',
    contraseña: userPassword,
    role: UserRole.USER,
  });

  const user2 = userRepo.create({
    nombre: 'Laura',
    apellido: 'García',
    nombreUsuario: 'laura',
    email: 'laura@mail.com',
    contraseña: userPassword,
    role: UserRole.USER,
  });

  await userRepo.save([admin, user1, user2]);
  console.log(' Seeds ejecutados correctamente');

  await AppDataSource.destroy();
}

runSeed().catch((err) => console.error(err));
