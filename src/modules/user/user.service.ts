import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeactivateUserDto } from './dto/desactivate-user.dto';
import { AuditLog } from '../../entities/audit-log.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async create(dto: CreateUserDto, actor: string) {
    const exists = await this.usersRepo.findOne({
      where: [{ email: dto.email }, { nombreUsuario: dto.nombreUsuario }],
    });
    if (exists) throw new BadRequestException('El usuario o email ya existe');

    const user = this.usersRepo.create({
      ...dto,
      password: await bcrypt.hash(dto.password, 10),
    });
    await this.usersRepo.save(user);

    await this.auditRepo.save({
      actor,
      action: 'create',
      motivo: `Creación del usuario ${user.nombreUsuario}`,
    });

    return user;
  }

  findAll() {
    return this.usersRepo.find();
  }

  async findOne(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: number, dto: UpdateUserDto, actor: string) {
    const user = await this.findOne(id);

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);
    await this.usersRepo.save(user);

    await this.auditRepo.save({
      actor,
      action: 'update',
      motivo: `Actualización del usuario ${user.nombreUsuario}`,
    });

    return user;
  }

  async deactivate(id: number, dto: DeactivateUserDto, actor: string) {
    const user = await this.findOne(id);
    user.status = UserStatus.INACTIVE;
    await this.usersRepo.save(user);

    await this.auditRepo.save({
      actor,
      action: 'deactivate',
      motivo: dto.motivo,
    });

    return { message: 'Usuario desactivado', user };
  }
}
