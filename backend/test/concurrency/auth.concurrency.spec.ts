import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { User } from '../../src/modules/users/user_entity/user.entity';

describe('Auth Module - Concurrency Tests (15)', () => {
  let app: INestApplication;
  let validToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqljs',
          autoSave: false,
          synchronize: true,
          dropSchema: true,
          entities: [User],
        }),
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    // Usuario base
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Base User',
        email: 'base@test.com',
        password: '123456',
      });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'base@test.com',
        password: '123456',
      });

    validToken = login.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  // 1
  it('1-15. Concurrent POST /auth/register (mismo email)', async () => {
    const payload = {
      name: 'Concurrent',
      email: 'concurrent@test.com',
      password: '123456',
    };

    const requests = Array.from({ length: 15 }).map(() =>
      request(app.getHttpServer()).post('/auth/register').send(payload),
    );

    const responses = await Promise.all(requests);

    const success = responses.filter(r => r.status === 201);
    const failed = responses.filter(r => r.status !== 201);

    expect(success.length).toBe(1);
    expect(failed.length).toBeGreaterThan(0);
  });

  // 2
  it('debería permitir 5 logins simultáneos', async () => {
    const logins = Array.from({ length: 5 }).map(() =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'base@test.com', password: '123456' }),
    );

    const responses = await Promise.all(logins);
    const success = responses.filter(r => r.status === 201);

    expect(success.length).toBeGreaterThan(0);
  });

  // 3
  it('debería permitir registros simultáneos con datos distintos', async () => {
    const requests = Array.from({ length: 5 }).map((_, i) =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: `User ${i}`,
          email: `user${i}@test.com`,
          password: '123456',
        }),
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => expect(res.status).toBe(201));
  });

  // 4
  it('debería manejar 10 logins incorrectos concurrentes', async () => {
    const logins = Array.from({ length: 10 }).map(() =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'base@test.com', password: 'wrong' }),
    );

    const responses = await Promise.all(logins);
    responses.forEach(res => expect(res.status).toBe(401));
  });

  // 5
  it('debería manejar múltiples registros con el mismo email', async () => {
    const payload = {
      name: 'Dup',
      email: 'dup@test.com',
      password: '123456',
    };

    const requests = Array.from({ length: 10 }).map(() =>
      request(app.getHttpServer()).post('/auth/register').send(payload),
    );

    const responses = await Promise.all(requests);
    const success = responses.filter(r => r.status === 201);

    expect(success.length).toBe(1);
  });

  // 6
  it('debería manejar 5 POST válidos concurrentes', async () => {
    const requests = Array.from({ length: 5 }).map((_, i) =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: `Valid ${i}`,
          email: `valid${i}@test.com`,
          password: '123456',
        }),
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => expect(res.status).toBe(201));
  });

  // 7
  it('debería permitir 5 logins concurrentes válidos', async () => {
    const logins = Array.from({ length: 5 }).map(() =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'base@test.com', password: '123456' }),
    );

    const responses = await Promise.all(logins);
    const success = responses.filter(r => r.status === 201);

    expect(success.length).toBeGreaterThan(0);
  });

  // 8
  it('debería manejar POST y GET simultáneos', async () => {
    const post = request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Mixed',
        email: 'mixed@test.com',
        password: '123456',
      });

    const get = request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${validToken}`);

    const [postRes, getRes] = await Promise.all([post, get]);

    expect([200, 201]).toContain(postRes.status);
    expect([200, 401]).toContain(getRes.status);
  });

  // 9
  it('debería manejar 15 requests inválidas concurrentes', async () => {
    const requests = Array.from({ length: 15 }).map(() =>
      request(app.getHttpServer()).post('/auth/register').send({}),
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => expect(res.status).toBe(400));
  });

  // 10
  it('debería manejar múltiples registros con mismo nombre', async () => {
    const requests = Array.from({ length: 5 }).map((_, i) =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Same Name',
          email: `same${i}@test.com`,
          password: '123456',
        }),
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => expect(res.status).toBe(201));
  });

  // 11
  it('debería manejar 5 registros con la misma contraseña', async () => {
    const requests = Array.from({ length: 5 }).map((_, i) =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: `Pass ${i}`,
          email: `pass${i}@test.com`,
          password: 'samepass',
        }),
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => expect(res.status).toBe(201));
  });

  // 12
  it('debería manejar múltiples roles concurrentes', async () => {
    const requests = Array.from({ length: 5 }).map((_, i) =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: `Role ${i}`,
          email: `role${i}@test.com`,
          password: '123456',
          role: i % 2 === 0 ? 'user' : 'admin',
        }),
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => expect(res.status).toBe(201));
  });

  // 13
  it('debería manejar login y registro simultáneo', async () => {
    const login = request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'base@test.com', password: '123456' });

    const register = request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Parallel',
        email: 'parallel@test.com',
        password: '123456',
      });

    const [loginRes, regRes] = await Promise.all([login, register]);

    expect([200, 201]).toContain(loginRes.status);
    expect(regRes.status).toBe(201);
  });

  // 14
  it('debería manejar tokens inválidos concurrentes', async () => {
    const requests = Array.from({ length: 5 }).map(() =>
      request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer invalid'),
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => expect(res.status).toBe(401));
  });

  // 15
  it('debería mantenerse estable bajo carga concurrente', async () => {
    const requests = Array.from({ length: 10 }).map((_, i) =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: `Stress ${i}`,
          email: `stress${i}@test.com`,
          password: '123456',
        }),
    );

    const responses = await Promise.all(requests);
    responses.forEach(res => expect([201, 400]).toContain(res.status));
  });
});
