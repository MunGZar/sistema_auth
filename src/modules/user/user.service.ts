import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus, UserRole } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  // Crear usuario con validaciones
  async create(data: Partial<User>) {
    if (!data.nombre || !data.email || !data.contraseña) {
      throw new BadRequestException(
        'Los campos nombre, email y contraseña son obligatorios.',
      );
    }

    const existingUser = await this.userRepo.findOne({
      where: [{ email: data.email }, { nombreUsuario: data.nombreUsuario }],
    });

    if (existingUser) {
      throw new BadRequestException('El usuario o email ya están registrados.');
    }

    const hashedPassword = await bcrypt.hash(data.contraseña, 10);

    const user = this.userRepo.create({
      nombre: data.nombre.trim(),
      apellido: data.apellido?.trim() || '',
      nombreUsuario: data.nombreUsuario?.trim().toLowerCase() || data.nombre.toLowerCase(),
      email: data.email.trim().toLowerCase(),
      contraseña: hashedPassword,
      role: (data.role as UserRole) || UserRole.USER,
      estado: UserStatus.ACTIVE,
    });

    const savedUser = await this.userRepo.save(user);

    // Registrar acción en logs
    await this.auditRepo.save({
      actor: user.nombreUsuario,
      action: 'crear',
      motivo: 'Creación de nuevo usuario',
      fecha: new Date(),
    });

    return savedUser;
  }

  //  Listar todos los usuarios
  async findAll() {
    return await this.userRepo.find();
  }

  // Buscar usuario por ID
  async findOne(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }
    return user;
  }

  //  Actualizar usuario
  async update(id: number, data: Partial<User>) {
    const user = await this.findOne(id);

    if (data.contraseña) {
      data.contraseña = await bcrypt.hash(data.contraseña, 10);
    }

    Object.assign(user, data);

    const updatedUser = await this.userRepo.save(user);

    await this.auditRepo.save({
      actor: user.nombreUsuario,
      action: 'actualizar',
      motivo: `Actualización de datos del usuario con ID ${id}`,
      fecha: new Date(),
    });

    return updatedUser;
  }

  // Desactivar usuario con motivo
  async deactivate(id: number, motivo: string) {
    const user = await this.findOne(id);

    if (user.estado === UserStatus.INACTIVE) {
      throw new BadRequestException('El usuario ya está inactivo.');
    }

    user.estado = UserStatus.INACTIVE;
    const updatedUser = await this.userRepo.save(user);

    await this.auditRepo.save({
      actor: user.nombreUsuario,
      action: 'desactivar',
      motivo: motivo || 'Desactivación de usuario',
      fecha: new Date(),
    });

    return updatedUser;
  }
}
