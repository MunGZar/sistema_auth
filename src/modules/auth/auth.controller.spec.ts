import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserRole, UserStatus } from '../../entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
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

  const mockRegisterDto: RegisterDto = {
    nombre: 'Test',
    apellido: 'User',
    nombreUsuario: 'testuser',
    email: 'test@example.com',
    password: 'Test123!@#',
  };

  const mockLoginDto: LoginDto = {
    emailOrUsername: 'test@example.com',
    password: 'Test123!@#',
  };

  const mockLoginResponse = {
    accessToken: 'mock-jwt-token',
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            getProfile: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('debe llamar a authService.register()', async () => {
      jest.spyOn(authService, 'register').mockResolvedValue(mockUser as User);

      const result = await controller.register(mockRegisterDto);

      expect(authService.register).toHaveBeenCalledWith(mockRegisterDto);
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('debe retornar usuario creado', async () => {
      jest.spyOn(authService, 'register').mockResolvedValue(mockUser as User);

      const result = await controller.register(mockRegisterDto);

      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('debe llamar a authService.login()', async () => {
      jest
        .spyOn(authService, 'login')
        .mockResolvedValue(mockLoginResponse as any);

      const result = await controller.login(mockLoginDto);

      expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLoginResponse);
    });

    it('debe retornar accessToken y user', async () => {
      jest
        .spyOn(authService, 'login')
        .mockResolvedValue(mockLoginResponse as any);

      const result = await controller.login(mockLoginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.id).toBe(mockUser.id);
    });
  });

  describe('getProfile', () => {
    it('debe llamar a authService.getProfile()', async () => {
      const mockRequest = {
        user: { id: mockUser.id },
      };
      jest.spyOn(authService, 'getProfile').mockResolvedValue(mockUser as User);

      const result = await controller.getProfile(mockRequest as any);

      expect(authService.getProfile).toHaveBeenCalledWith(mockUser.id);
      expect(authService.getProfile).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('debe usar el userId del request.user', async () => {
      const mockRequest = {
        user: { id: 123 },
      };
      jest.spyOn(authService, 'getProfile').mockResolvedValue(mockUser as User);

      await controller.getProfile(mockRequest as any);

      expect(authService.getProfile).toHaveBeenCalledWith(123);
    });

    it('debe retornar perfil sin contraseña', async () => {
      const mockRequest = {
        user: { id: mockUser.id },
      };
      jest.spyOn(authService, 'getProfile').mockResolvedValue(mockUser as User);

      const result = await controller.getProfile(mockRequest as any);

      expect(result).not.toHaveProperty('password');
    });
  });
});
