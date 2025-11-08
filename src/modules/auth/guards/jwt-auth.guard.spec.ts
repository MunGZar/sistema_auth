import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User, UserStatus, UserRole } from '../../../entities/user.entity';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let usersRepository: Repository<User>;

  const mockUser: User = {
    id: 1,
    nombre: 'Test',
    apellido: 'User',
    nombreUsuario: 'testuser',
    email: 'test@example.com',
    contraseña: 'hashedPassword',
    role: UserRole.USER,
    estado: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayload = {
    userId: 1,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  };

  const createMockExecutionContext = (headers: any): ExecutionContext => {
    const request = {
      headers,
      user: null,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('debe permitir acceso con token válido', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(context.switchToHttp().getRequest().user).toEqual(mockUser);
    });

    it('debe adjuntar usuario al request', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

      await guard.canActivate(context);

      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual(mockUser);
    });

    it('debe lanzar error si no hay token', async () => {
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token no proporcionado',
      );
    });

    it('debe lanzar error si token es inválido', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer invalid-token',
      });

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Token inválido'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token inválido o expirado',
      );
    });

    it('debe lanzar error si usuario no existe', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Usuario no encontrado',
      );
    });

    it('debe lanzar error si usuario está desactivado', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(inactiveUser);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Usuario desactivado',
      );
    });

    it('debe extraer token del header Authorization', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer my-token-123',
      });

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

      await guard.canActivate(context);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('my-token-123', {
        secret: process.env.JWT_SECRET || 'default-secret',
      });
    });

    it('debe manejar formato incorrecto de Authorization header', async () => {
      const context = createMockExecutionContext({
        authorization: 'InvalidFormat token',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe propagar UnauthorizedException del servicio', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer valid-token',
      });

      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
