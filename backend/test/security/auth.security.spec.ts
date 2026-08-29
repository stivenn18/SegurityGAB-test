import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { User } from '../../src/modules/users/user_entity/user.entity';

/**
 * PRUEBAS DE SEGURIDAD
 * Módulo de Autenticación
 */
describe('Auth Module - Security Tests (15)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqljs',
          synchronize: true,
          dropSchema: true,
          entities: [User],
        }),
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    // Crear usuario
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Security User',
        email: 'security@test.com',
        password: 'password123',
      });

    // Login
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'security@test.com',
        password: 'password123',
      });

    token = res.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  // 1
  it('debería generar un JWT al hacer login', async () => {
    expect(token).toBeDefined();
  });

  // 2
  it('el token debería tener formato JWT válido', async () => {
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
  });

  // 3
  it('debería rechazar login sin email', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ password: '123456' })
      .expect(401);
  });

  // 4
  it('debería rechazar login sin contraseña', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'security@test.com' })
      .expect(500);
  });

  // 5
  it('debería rechazar login con credenciales incorrectas', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'security@test.com',
        password: 'wrongpass',
      })
      .expect(401);
  });

  // 6
  it('no debería revelar si el usuario existe', async () => {
    const r1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'noexiste@test.com',
        password: '123456',
      });

    const r2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'security@test.com',
        password: 'wrongpass',
      });

    expect(r1.status).toBe(401);
    expect(r2.status).toBe(401);
  });

  // 7
  it('debería rechazar SQL Injection en email', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: "' OR '1'='1",
        password: 'test',
      })
      .expect(401);
  });

  // 8
  it('debería rechazar XSS en email', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: '<script>alert(1)</script>',
        password: 'test',
      })
      .expect(401);
  });

  // 9
  it('no debería permitir login con datos vacíos', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({})
      .expect(500);
  });

  // 10
  it('debería rechazar método HTTP no permitido', async () => {
    await request(app.getHttpServer()).put('/auth/login').expect(404);
  });

  // 11
  it('no debería devolver password en login', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'security@test.com',
        password: 'password123',
      });

    expect(res.text).not.toContain('password');
  });

  // 12
  it('debería permitir múltiples logins consecutivos', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'security@test.com',
        password: 'password123',
      })
      .expect(201);
  });

  // 13
  it('el token no debería ser vacío', async () => {
    expect(token.length).toBeGreaterThan(20);
  });

  // 14
  it('debería registrar usuarios con password cifrada', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Hash Test',
        email: 'hash@test.com',
        password: 'password123',
      });

    expect(res.text).not.toContain('password123');
  });

  // 15
  it('debería permitir autenticación después del registro', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'hash@test.com',
        password: 'password123',
      })
      .expect(201);
  });
});
