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
import { RecoveryCode } from '../../entities/recovery-code.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UsersService } from '../user/user.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    @InjectRepository(RecoveryCode)
    private readonly recoveryCodeRepository: Repository<RecoveryCode>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Registro de nuevo usuario
   */
  async register(registerDto: RegisterDto) {
    // Usar UsersService para crear el usuario
    const user = await this.usersService.create({
      nombre: registerDto.nombre,
      apellido: registerDto.apellido,
      nombreUsuario: registerDto.nombreUsuario,
      email: registerDto.email,
      contraseña: registerDto.password,
    });

    // Enviar correo de bienvenida
    await this.emailService.sendWelcomeEmail(user);

    // Retornar usuario sin contraseña
    const { contraseña, ...userWithoutPassword } = user;
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
      where: [{ email: emailOrUsername }, { nombreUsuario: emailOrUsername }],
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
    if (user.estado !== UserStatus.ACTIVE) {
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
      user.contraseña,
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
      status: user.estado,
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
        status: user.estado,
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
    const { contraseña, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Solicitar código de recuperación de contraseña
   */
  async requestPasswordReset(email: string) {
    const user = await this.usersRepository.findOne({ where: { email } });

    // Falla silenciosamente si el usuario no existe para evitar enumeración de usuarios
    if (!user) {
      return;
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Establecer fecha de expiración (2 minutos desde ahora)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 2);

    // Guardar el código de recuperación
    const recoveryCode = this.recoveryCodeRepository.create({
      user,
      code,
      expiresAt,
    });
    await this.recoveryCodeRepository.save(recoveryCode);

    // Enviar el correo electrónico
    await this.emailService.sendPasswordResetEmail(user, code);
  }

  /**
   * Resetea la contraseña usando un código de recuperación válido
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { code, password } = resetPasswordDto;

    const recoveryCode = await this.recoveryCodeRepository.findOne({
      where: { code },
      relations: ['user'],
    });

    if (!recoveryCode) {
      throw new BadRequestException('El código de recuperación es inválido.');
    }

    if (recoveryCode.used) {
      throw new BadRequestException('Este código ya ha sido utilizado.');
    }

    if (recoveryCode.expiresAt < new Date()) {
      throw new BadRequestException('El código de recuperación ha expirado.');
    }

    // El código es válido, hashear la nueva contraseña y actualizar el usuario
    const user = recoveryCode.user;
    user.contraseña = await bcrypt.hash(password, 10);
    await this.usersRepository.save(user);

    // Marcar el código como usado
    recoveryCode.used = true;
    await this.recoveryCodeRepository.save(recoveryCode);
  }
}
