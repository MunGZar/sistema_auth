import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserStatus, UserRole } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UsersService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Registro de nuevo usuario
   */
  async register(registerDto: RegisterDto) {
    // Usar UsersService para crear el usuario
    const user = await this.usersService.create(
      {
        nombreUsuario: registerDto.nombreUsuario,
        email: registerDto.email,
        password: registerDto.password,
        role: UserRole.USER,
      },
      registerDto.nombreUsuario,
    );

    // TODO: Llamar a EmailService para enviar correo de bienvenida
    // await this.emailService.sendWelcomeEmail(user);

    // Retornar usuario sin contraseña
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Inicio de sesión
   */
  async login(loginDto: LoginDto) {
    // Normalizar input
    const emailOrUsername = loginDto.emailOrUsername.trim().toLowerCase();

    // Buscar usuario por email o nombreUsuario
    const user = await this.usersRepository.findOne({
      where: [
        { email: emailOrUsername },
        { nombreUsuario: emailOrUsername },
      ],
    });

    if (!user) {
      // Registrar evento login_fail
      await this.auditRepository.save({
        actor: emailOrUsername,
        action: 'login_fail',
        motivo: 'Intento de login con credenciales inválidas',
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar estado activo
    if (user.status !== UserStatus.ACTIVE) {
      await this.auditRepository.save({
        actor: user.nombreUsuario,
        action: 'login_fail',
        motivo: 'Intento de login con usuario desactivado',
      });
      throw new UnauthorizedException('Usuario desactivado');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      // Registrar evento login_fail
      await this.auditRepository.save({
        actor: user.nombreUsuario,
        action: 'login_fail',
        motivo: 'Contraseña incorrecta',
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar JWT
    const payload: JwtPayload = {
      userId: user.id,
      role: user.role,
      status: user.status,
    };

    const accessToken = this.jwtService.sign(payload);

    // Registrar evento login_ok
    await this.auditRepository.save({
      actor: user.nombreUsuario,
      action: 'login_ok',
      motivo: 'Login exitoso',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        nombreUsuario: user.nombreUsuario,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Retornar todos los datos excepto la contraseña
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

