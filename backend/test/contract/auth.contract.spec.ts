import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { User } from '../../src/modules/users/user_entity/user.entity';

/**
 * Pruebas de Contrato - Módulo Auth
 *
 * Validan que la estructura de las respuestas
 * sea consistente y estable.
 */
describe('Auth Module - Contract Tests (15)', () => {
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
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------- REGISTER CONTRACT ----------

  it('1. register debe devolver un objeto', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Contrato Test',
        email: 'contract1@test.com',
        password: 'password123',
      });

    expect(typeof res.body).toBe('object');
  });

  it('2. register debe devolver id', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Contrato Test',
        email: 'contract2@test.com',
        password: 'password123',
      });

    expect(res.body).toHaveProperty('id');
  });

  it('3. register debe devolver name', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Contrato Nombre',
        email: 'contract3@test.com',
        password: 'password123',
      });

    expect(res.body).toHaveProperty('name');
  });

  it('4. register debe devolver email', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Contrato Email',
        email: 'contract4@test.com',
        password: 'password123',
      });

    expect(res.body).toHaveProperty('email');
  });

  it('5. register debe devolver role', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Contrato Role',
        email: 'contract5@test.com',
        password: 'password123',
      });

    expect(res.body).toHaveProperty('role');
  });

  it('6. register NO debe devolver password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Contrato Seguro',
        email: 'contract6@test.com',
        password: 'password123',
      });

    expect(res.body).not.toHaveProperty('password');
  });

  it('7. role por defecto debe ser user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Contrato Default',
        email: 'contract7@test.com',
        password: 'password123',
      });

    expect(res.body.role).toBe('user');
  });

  // ---------- LOGIN CONTRACT ----------

  it('8. login debe devolver message', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Login Contract',
        email: 'login1@test.com',
        password: 'password123',
      });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login1@test.com',
        password: 'password123',
      });

    expect(res.body).toHaveProperty('message');
  });

  it('9. login debe devolver access_token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login1@test.com',
        password: 'password123',
      });

    expect(res.body).toHaveProperty('access_token');
  });

  it('10. access_token debe ser string', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login1@test.com',
        password: 'password123',
      });

    expect(typeof res.body.access_token).toBe('string');
  });

  it('11. token debe tener formato JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login1@test.com',
        password: 'password123',
      });

    const parts = res.body.access_token.split('.');
    expect(parts).toHaveLength(3);
  });

  it('12. login debe devolver user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login1@test.com',
        password: 'password123',
      });

    expect(res.body).toHaveProperty('user');
  });

  it('13. user debe tener id', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login1@test.com',
        password: 'password123',
      });

    expect(res.body.user).toHaveProperty('id');
  });

  it('14. user debe tener email', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login1@test.com',
        password: 'password123',
      });

    expect(res.body.user).toHaveProperty('email');
  });

  it('15. user NO debe tener password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'login1@test.com',
        password: 'password123',
      });

    expect(res.body.user).not.toHaveProperty('password');
  });
});
