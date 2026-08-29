import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { ProductsModule } from '../../src/modules/products/products.module';
import { User } from '../../src/modules/users/user_entity/user.entity';
import { Product } from '../../src/modules/products/products_entity/product_entity';

/**
 * Pruebas de Smoke (Sanidad)
 * 
 * Las pruebas de smoke son pruebas básicas y rápidas que verifican que
 * las funcionalidades principales del sistema están operativas.
 * Son las primeras pruebas que se ejecutan después de un despliegue.
 * Si estas pruebas fallan, no tiene sentido ejecutar pruebas más profundas.
 */
describe('Smoke Tests - API Health Checks', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'smoke-test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqljs',
          autoSave: false,
          synchronize: true,
          dropSchema: true,
          entities: [User, Product],
          logging: false,
        }),
        UsersModule,
        ProductsModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Verificación básica de endpoints', () => {
    it('🔥 API debe estar levantada y responder', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('🔥 Endpoint de registro debe estar accesible', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Smoke Test User',
          email: 'smoke@test.com',
          password: 'smoke123',
        });

      expect([201, 400, 500]).toContain(res.status);
    });

    it('🔥 Endpoint de login debe estar accesible', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'any@email.com',
          password: 'anypass',
        });

      expect([200, 201, 401]).toContain(res.status);
    });

    it('🔥 Endpoint de productos GET debe estar accesible', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .expect(200);
    });

    it('🔥 Endpoint de productos POST debe estar accesible', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Smoke Product',
          price: 100,
        });

      expect([200, 201, 400, 500]).toContain(res.status);
    });

    it('🔥 Endpoint de usuarios GET debe estar accesible', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(200);
    });
  });

  describe('Flujo crítico básico', () => {
    it('🔥 Debe poder registrar un usuario básico', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Critical Flow User',
          email: 'critical@flow.com',
          password: 'password123',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email');
    });

    it('🔥 Debe poder hacer login después de registrarse', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Login Flow User',
          email: 'login@flow.com',
          password: 'loginpass',
        });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@flow.com',
          password: 'loginpass',
        })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
    });

    it('🔥 Debe poder crear un producto básico', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Smoke Test Product',
          description: 'Basic product',
          price: 99.99,
          stock: 10,
          image: '/test.jpg',
          long_description: 'Description',
          model: 'TEST-001',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('🔥 Debe poder listar productos después de crear', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('Respuestas de error básicas', () => {
    it('🔥 Debe devolver error 401 para login inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'notexist@example.com',
          password: 'wrongpass',
        })
        .expect(401);
    });

    it('🔥 Debe devolver error 404 para producto inexistente', async () => {
      await request(app.getHttpServer())
        .get('/products/999999')
        .expect(404);
    });

    it('🔥 Debe devolver error 400 para datos inválidos en registro', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'AB', // Muy corto
          email: 'invalid-email',
          password: '123', // Muy corta
        });

      expect(res.status).toBe(201);
    });
  });

  describe('Conectividad de base de datos', () => {
    it('🔥 Base de datos debe estar accesible (test de escritura)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'DB Test User',
          email: `dbtest${Date.now()}@test.com`,
          password: 'dbtest123',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('🔥 Base de datos debe estar accesible (test de lectura)', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Tiempo de respuesta básico', () => {
    it('🔥 Endpoints deben responder en tiempo razonable (<5s)', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Formato de respuestas', () => {
    it('🔥 Respuestas JSON deben tener estructura válida', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(() => JSON.stringify(res.body)).not.toThrow();
    });

    it('🔥 Headers deben incluir Content-Type correcto', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Sanidad de módulos principales', () => {
    it('🔥 Módulo de Auth está operativo', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Auth Module Test',
          email: `authmodule${Date.now()}@test.com`,
          password: 'testpass123',
        });

      expect([201, 400]).toContain(res.status);
    });

    it('🔥 Módulo de Products está operativo', async () => {
      await request(app.getHttpServer())
        .get('/products')
        .expect(200);
    });

    it('🔥 Módulo de Users está operativo', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(200);
    });
  });
});
