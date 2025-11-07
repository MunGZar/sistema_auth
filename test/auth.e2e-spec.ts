import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole, UserStatus } from '../src/entities/user.entity';
import { AuditLog } from '../src/entities/audit-log.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../src/modules/user/user.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

describe('Auth module (e2e) - mocked repositories (no DB)', () => {
  let app: INestApplication;

  const mockUser: Partial<User> = {
    id: 1,
    nombreUsuario: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  };

  const usersRepoMock = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const auditRepoMock = {
    save: jest.fn(),
  };

  const jwtServiceMock = {
    sign: jest.fn(),
  };

  const usersServiceMock = {
    create: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepoMock,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: auditRepoMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          // set a default user for perfil tests
          req.user = { id: 1 };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /auth/register -> 201 and returns user without password', async () => {
    const createdUser = { ...mockUser };
    usersServiceMock.create.mockResolvedValue(createdUser);

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        nombreUsuario: 'testuser',
        email: 'test@example.com',
        password: 'Test123!@#',
      })
      .expect(201);

    expect(usersServiceMock.create).toHaveBeenCalled();
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password');
  });

  it('POST /auth/login -> 200 and returns accessToken and user', async () => {
    usersRepoMock.findOne.mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtServiceMock.sign.mockReturnValue('mock-jwt-token');
    auditRepoMock.save.mockResolvedValue({});

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ emailOrUsername: 'test@example.com', password: 'Test123!@#' })
      .expect((r) => {
        if (![200, 201].includes(r.status))
          throw new Error(`Unexpected status ${r.status}`);
      });

    expect(usersRepoMock.findOne).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(jwtServiceMock.sign).toHaveBeenCalled();
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.accessToken).toBe('mock-jwt-token');
    expect(res.body.user.id).toBe(1);
  });

  it('GET /auth/perfil -> 200 and returns user profile (guard mocked)', async () => {
    usersRepoMock.findOne.mockResolvedValue(mockUser);

    const res = await request(app.getHttpServer())
      .get('/auth/perfil')
      .set('Authorization', 'Bearer mock-jwt-token')
      .expect(200);

    expect(usersRepoMock.findOne).toHaveBeenCalled();
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password');
  });
});
