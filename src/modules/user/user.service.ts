import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(data: Partial<User>) {
    if (!data.nombre || !data.email || !data.contraseña) {
      throw new Error('Nombre, email y contraseña son requeridos');
    }
    
    data.nombreUsuario = data.nombre.trim().toLowerCase();
    data.email = data.email.trim().toLowerCase();
    data.contraseña = await bcrypt.hash(data.contraseña, 10) as string;
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  findAll() {
    return this.userRepo.find();
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: number, data: Partial<User>) {
    const user = await this.findOne(id);
    Object.assign(user, data);
    return this.userRepo.save(user);
  }

  async deactivate(id: number, motivo: string) {
    const user = await this.findOne(id);
    user.estado = UserStatus.INACTIVE;
    // Aquí podrías registrar en audit_logs el motivo
    return this.userRepo.save(user);
  }
}
