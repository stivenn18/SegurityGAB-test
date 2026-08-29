import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { User } from '../../src/modules/users/user_entity/user.entity';

/**
 * Pruebas de Validación - CreateUserDto
 * 
 * Validan que las reglas definidas en el DTO
 * se cumplan correctamente (class-validator).
 */
describe('Auth Register - Validation Tests (15)', () => {
  let app: INestApplication;

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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // 1
  it('debería rechazar registro sin body', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({})
      .expect(400);
  });

  // 2
  it('debería rechazar nombre vacío', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: '',
        email: 'test@test.com',
        password: 'password123',
      })
      .expect(400);
  });

  // 3
  it('debería rechazar nombre con menos de 3 caracteres', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'AB',
        email: 'test@test.com',
        password: 'password123',
      })
      .expect(400);
  });

  // 4
  it('debería rechazar nombre que no sea string', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 123,
        email: 'test@test.com',
        password: 'password123',
      })
      .expect(400);
  });

  // 5
  it('debería rechazar email inválido', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Usuario Test',
        email: 'correo-invalido',
        password: 'password123',
      })
      .expect(400);
  });

  // 6
  it('debería rechazar registro sin email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Usuario Test',
        password: 'password123',
      })
      .expect(400);
  });

  // 7
  it('debería rechazar contraseña corta', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Usuario Test',
        email: 'test@test.com',
        password: '12345',
      })
      .expect(400);
  });

  // 8
  it('debería rechazar registro sin contraseña', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Usuario Test',
        email: 'test@test.com',
      })
      .expect(400);
  });

  // 9
  it('debería rechazar rol inválido', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Usuario Test',
        email: 'test@test.com',
        password: 'password123',
        role: 'superadmin',
      })
      .expect(400);
  });

  // 10
  it('debería aceptar rol user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'User Test',
        email: 'user@test.com',
        password: 'password123',
        role: 'user',
      })
      .expect(201);

    expect(res.body.role).toBe('user');
  });

  // 11
  it('debería aceptar rol admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Admin Test',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
      })
      .expect(201);

    expect(res.body.role).toBe('admin');
  });

  // 12
  it('debería rechazar campos extra (whitelist)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Usuario Test',
        email: 'test@test.com',
        password: 'password123',
        hack: true,
      })
      .expect(400);
  });

  // 13
  it('debería rechazar email null', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Usuario Test',
        email: null,
        password: 'password123',
      })
      .expect(400);
  });

  // 14
  it('debería rechazar password null', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Usuario Test',
        email: 'test@test.com',
        password: null,
      })
      .expect(400);
  });

  // 15
  it('debería registrar correctamente con datos válidos', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Usuario Final',
        email: 'final@test.com',
        password: 'password123',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).not.toHaveProperty('password');
  });
});
