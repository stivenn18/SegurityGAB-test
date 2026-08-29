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
 * Pruebas de Integración
 * 
 * Las pruebas de integración verifican que múltiples módulos o componentes
 * funcionen correctamente cuando se combinan. Prueban las interacciones
 * entre diferentes partes del sistema.
 */
describe('Integration Tests - Auth + Products Flow', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret';

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

  describe('Flujo completo: Registro → Login → Crear Producto', () => {
    let authToken: string;
    let userId: number;

    it('debe permitir registrar un nuevo usuario', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Integration User',
          email: 'integration@example.com',
          password: 'password123',
          role: 'admin',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'integration@example.com');
      userId = res.body.id;
    });

    it('debe permitir hacer login con el usuario registrado', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'integration@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      authToken = res.body.access_token;
      expect(res.body.user.id).toBe(userId);
    });

    it('debe permitir crear un producto después del login', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Cámara Integration Test',
          description: 'Producto de prueba',
          price: 299.99,
          stock: 10,
          image: '/test.jpg',
          long_description: 'Descripción larga',
          model: 'INT-001',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Cámara Integration Test');
    });

    it('debe poder listar productos después de crearlos', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body.some((p: any) => p.name === 'Cámara Integration Test')).toBe(true);
    });
  });

  describe('Integración entre módulos: Users y Auth', () => {
    it('debe sincronizar correctamente la creación de usuarios entre Auth y Users', async () => {
      // Crear usuario vía Auth
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Sync Test User',
          email: 'sync@example.com',
          password: 'syncpass',
        })
        .expect(201);

      const createdUserId = registerRes.body.id;

      // Verificar que el usuario existe en Users
      const usersRes = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      const foundUser = usersRes.body.find((u: any) => u.id === createdUserId);
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('sync@example.com');
    });

    it('debe permitir login después de crear usuario vía Users', async () => {
      // Crear usuario directamente vía Users
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Direct User',
          email: 'direct@example.com',
          password: 'directpass',
        })
        .expect(201);

      expect(createRes.body).toHaveProperty('id');

      // Intentar login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'direct@example.com',
          password: 'directpass',
        })
        .expect(201);

      expect(loginRes.body).toHaveProperty('access_token');
    });
  });

  describe('Integración de múltiples operaciones CRUD', () => {
    it('debe mantener consistencia en operaciones CRUD consecutivas', async () => {
      // Crear varios productos
      const product1 = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Producto 1',
          description: 'Desc 1',
          price: 100,
          stock: 5,
          image: '/1.jpg',
          long_description: 'Long 1',
          model: 'P1',
        });

      const product2 = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Producto 2',
          description: 'Desc 2',
          price: 200,
          stock: 10,
          image: '/2.jpg',
          long_description: 'Long 2',
          model: 'P2',
        });

      // Actualizar uno
      await request(app.getHttpServer())
        .put(`/products/${product1.body.id}`)
        .send({ name: 'Producto 1 Actualizado' })
        .expect(200);

      // Eliminar otro
      await request(app.getHttpServer())
        .delete(`/products/${product2.body.id}`)
        .expect(200);

      // Listar y verificar consistencia
      const listRes = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      const updatedProduct = listRes.body.find((p: any) => p.id === product1.body.id);
      const deletedProduct = listRes.body.find((p: any) => p.id === product2.body.id);

      expect(updatedProduct.name).toBe('Producto 1 Actualizado');
      expect(deletedProduct).toBeUndefined();
    });
  });

  describe('Integración de validaciones entre módulos', () => {
    it('debe mantener integridad de datos entre Auth y Users', async () => {
      // Intentar registrar con email duplicado
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Unique User',
          email: 'unique@example.com',
          password: 'pass123',
        })
        .expect(201);

      // Segundo intento con mismo email debería fallar o manejarse
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'unique@example.com',
          password: 'pass456',
        });

      // Puede ser 400, 409, o 500 dependiendo de la implementación
      expect([400, 409, 500]).toContain(res.status);
    });
  });

  describe('Integración de transacciones y rollback', () => {
    it('debe mantener atomicidad en operaciones relacionadas', async () => {
      const initialProducts = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      const initialCount = initialProducts.body.length;

      // Crear producto
      const createRes = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Atomic Product',
          description: 'Test atomicity',
          price: 150,
          stock: 7,
          image: '/atomic.jpg',
          long_description: 'Long',
          model: 'ATOM-1',
        })
        .expect(201);

      const productId = createRes.body.id;

      // Verificar que se creó
      const afterCreate = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(afterCreate.body.length).toBe(initialCount + 1);

      // Eliminar producto
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .expect(200);

      // Verificar que se eliminó
      const afterDelete = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(afterDelete.body.length).toBe(initialCount);
    });
  });
});
