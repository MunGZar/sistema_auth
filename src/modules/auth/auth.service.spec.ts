import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../user/user.service';
import { User, UserStatus, UserRole } from '../../entities/user.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: Repository<User>;
  let auditRepository: Repository<AuditLog>;
  let jwtService: JwtService;
  let usersService: UsersService;

  // Mock data
  const mockUser: User = {
    id: 1,
    nombreUsuario: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRegisterDto: RegisterDto = {
    nombreUsuario: 'testuser',
    email: 'test@example.com',
    password: 'Test123!@#',
  };

  const mockLoginDto: LoginDto = {
    emailOrUsername: 'test@example.com',
    password: 'Test123!@#',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    auditRepository = module.get<Repository<AuditLog>>(
      getRepositoryToken(AuditLog),
    );
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('debe registrar un usuario exitosamente', async () => {
      const createdUser = { ...mockUser };
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUser);

      const result = await service.register(mockRegisterDto);

      expect(usersService.create).toHaveBeenCalledWith(
        {
          nombreUsuario: mockRegisterDto.nombreUsuario,
          email: mockRegisterDto.email,
          password: mockRegisterDto.password,
          role: UserRole.USER,
        },
        mockRegisterDto.nombreUsuario,
      );
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('debe retornar usuario sin contraseña', async () => {
      const createdUser = { ...mockUser };
      jest.spyOn(usersService, 'create').mockResolvedValue(createdUser);

      const result = await service.register(mockRegisterDto);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('nombreUsuario');
    });

    it('debe propagar errores de UsersService', async () => {
      const error = new BadRequestException('El usuario o email ya existe');
      jest.spyOn(usersService, 'create').mockRejectedValue(error);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(usersService.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      // Mock bcrypt.compare para que siempre retorne true por defecto
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');
    });

    it('debe hacer login exitoso con email', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(auditRepository, 'save').mockResolvedValue({} as AuditLog);

      const result = await service.login(mockLoginDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: 'test@example.com' },
          { nombreUsuario: 'test@example.com' },
        ],
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: mockUser.id,
        role: mockUser.role,
        status: mockUser.status,
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user).not.toHaveProperty('password');
    });

    it('debe hacer login exitoso con nombreUsuario', async () => {
      const loginDto: LoginDto = {
        emailOrUsername: 'TestUser',
        password: 'Test123!@#',
      };
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(auditRepository, 'save').mockResolvedValue({} as AuditLog);

      const result = await service.login(loginDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: 'testuser' }, { nombreUsuario: 'testuser' }],
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('debe normalizar el input (trim, lowercase)', async () => {
      const loginDto: LoginDto = {
        emailOrUsername: '  TestUser@Example.com  ',
        password: 'Test123!@#',
      };
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(auditRepository, 'save').mockResolvedValue({} as AuditLog);

      await service.login(loginDto);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: 'testuser@example.com' },
          { nombreUsuario: 'testuser@example.com' },
        ],
      });
    });

    it('debe generar JWT con payload correcto', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(auditRepository, 'save').mockResolvedValue({} as AuditLog);

      await service.login(mockLoginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: mockUser.id,
        role: mockUser.role,
        status: mockUser.status,
      });
    });

    it('debe registrar evento login_ok en audit_logs', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(auditRepository, 'save').mockResolvedValue({} as AuditLog);

      await service.login(mockLoginDto);

      expect(auditRepository.save).toHaveBeenCalledWith({
        actor: mockUser.nombreUsuario,
        action: 'login_ok',
        motivo: 'Login exitoso',
      });
    });

    it('debe lanzar error si usuario no existe', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(auditRepository, 'save').mockResolvedValue({} as AuditLog);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );

      expect(auditRepository.save).toHaveBeenCalledWith({
        actor: 'test@example.com',
        action: 'login_fail',
        motivo: 'Intento de login con credenciales inválidas',
      });
    });

    it('debe registrar evento login_fail si usuario no existe', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(auditRepository, 'save').mockResolvedValue({} as AuditLog);

      try {
        await service.login(mockLoginDto);
      } catch (error) {
        // Expected error
      }

      expect(auditRepository.save).toHaveBeenCalledWith({
        actor: 'test@example.com',
        action: 'login_fail',
        motivo: 'Intento de login con credenciales inválidas',
      });
    });

    it('debe lanzar error si usuario está desactivado', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(inactiveUser);
      jest.spyOn(auditRepository, 'save').mockResolvedValue({} as AuditLog);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        'Usuario desactivado',
      );
    });

    it('debe registrar evento login_fail si usuario desactivado', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(inactiveUser);
      jest.spyOn(auditRepository, 'save').mockResolvedValue({} as AuditLog);

      try {
        await service.login(mockLoginDto);
      } catch (error) {
        // Expected error
      }

      expect(auditRepository.save).toHaveBeenCalledWith({
        actor: inactiveUser.nombreUsuario,
        action: 'login_fail',
        motivo: 'Intento de login con usuario desactivado',
      });
    });

    it('debe lanzar error si contraseña es incorrecta', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      jest.spyOn(auditRepository, 'save').mockResolvedValue({} as AuditLog);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
    });

    it('debe registrar evento login_fail si contraseña incorrecta', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      jest.spyOn(auditRepository, 'save').mockResolvedValue({} as AuditLog);

      try {
        await service.login(mockLoginDto);
      } catch (error) {
        // Expected error
      }

      expect(auditRepository.save).toHaveBeenCalledWith({
        actor: mockUser.nombreUsuario,
        action: 'login_fail',
        motivo: 'Contraseña incorrecta',
      });
    });
  });

  describe('getProfile', () => {
    it('debe retornar perfil del usuario sin contraseña', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('debe lanzar error si usuario no existe', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getProfile(999)).rejects.toThrow(
        'Usuario no encontrado',
      );
    });
  });
});
