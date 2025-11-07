import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy, JwtPayload } from './jwt.strategy';
import { User, UserStatus, UserRole } from '../../../entities/user.entity';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersRepository: Repository<User>;

  const mockUser: User = {
    id: 1,
    nombreUsuario: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayload: JwtPayload = {
    userId: 1,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('debe validar payload y retornar usuario', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPayload.userId },
      });
      expect(result).toEqual(mockUser);
    });

    it('debe lanzar error si usuario no existe', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        'Usuario no encontrado',
      );
    });

    it('debe lanzar error si usuario está desactivado', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.INACTIVE };
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(inactiveUser);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        'Usuario desactivado',
      );
    });

    it('debe buscar usuario por userId del payload', async () => {
      const payload: JwtPayload = {
        userId: 123,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      };
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

      await strategy.validate(payload);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 123 },
      });
    });
  });
});
