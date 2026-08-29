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
 * Pruebas de Performance (Rendimiento)
 * 
 * Las pruebas de performance evalúan el comportamiento del sistema bajo
 * diferentes condiciones de carga, midiendo tiempos de respuesta,
 * throughput y uso de recursos.
 * 
 * Tipos incluidos:
 * - Pruebas de Carga: Comportamiento bajo carga normal/alta
 * - Pruebas de Estrés: Límites del sistema
 * - Pruebas de Picos: Comportamiento ante cambios súbitos
 */
describe('Performance Tests - Load & Stress', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'performance-test-secret';

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

  describe('⚡ Tiempo de respuesta individual', () => {
    it('GET /products debe responder en menos de 100ms (sin carga)', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      const duration = Date.now() - startTime;
      
      console.log(`⏱️  GET /products: ${duration}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('POST /auth/register debe responder en menos de 500ms', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Perf User',
          email: `perfuser${Date.now()}@test.com`,
          password: 'perfpass123',
        })
        .expect(201);

      const duration = Date.now() - startTime;
      
      console.log(`⏱️  POST /auth/register: ${duration}ms`);
      expect(duration).toBeLessThan(500);
    });

    it('POST /auth/login debe responder en menos de 300ms', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Login Perf',
          email: 'loginperf@test.com',
          password: 'perfpass',
        });

      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'loginperf@test.com',
          password: 'perfpass',
        })
        .expect(201);

      const duration = Date.now() - startTime;
      
      console.log(`⏱️  POST /auth/login: ${duration}ms`);
      expect(duration).toBeLessThan(300);
    });

    it('POST /products debe responder en menos de 200ms', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Performance Product',
          description: 'Perf test',
          price: 99.99,
          stock: 10,
          image: '/perf.jpg',
          long_description: 'Long desc',
          model: 'PERF-001',
        })
        .expect(201);

      const duration = Date.now() - startTime;
      
      console.log(`⏱️  POST /products: ${duration}ms`);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('⚡ Pruebas de carga - Múltiples requests', () => {
    it('debe manejar 10 consultas GET /products concurrentes', async () => {
      const promises = [];
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app.getHttpServer())
            .get('/products')
            .expect(200)
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      console.log(`⏱️  10 requests concurrentes: ${duration}ms`);
      expect(duration).toBeLessThan(2000); // 2 segundos para 10 requests
    });

    it('debe manejar 20 registros de usuarios concurrentes', async () => {
      const promises = [];
      const startTime = Date.now();

      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/auth/register')
            .send({
              name: `Load Test User ${i}`,
              email: `loadtest${i}${Date.now()}@test.com`,
              password: 'loadpass123',
            })
        );
      }

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      const successCount = results.filter(r => r.status === 201).length;

      console.log(`⏱️  20 registros concurrentes: ${duration}ms (${successCount} exitosos)`);
      expect(successCount).toBeGreaterThan(15); // Al menos 75% exitoso
      expect(duration).toBeLessThan(10000); // 10 segundos máximo
    });

    it('debe crear 50 productos en tiempo razonable', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        await request(app.getHttpServer())
          .post('/products')
          .send({
            name: `Bulk Product ${i}`,
            description: `Product ${i}`,
            price: 100 + i,
            stock: 10,
            image: `/product${i}.jpg`,
            long_description: `Long description ${i}`,
            model: `BULK-${i}`,
          })
          .expect(201);
      }

      const duration = Date.now() - startTime;

      console.log(`⏱️  50 productos secuenciales: ${duration}ms`);
      expect(duration).toBeLessThan(15000); // 15 segundos para 50 productos
    });
  });

  describe('⚡ Pruebas de estrés - Límites del sistema', () => {
    it('debe manejar productos con nombres muy largos', async () => {
      const longName = 'A'.repeat(1000);

      const startTime = Date.now();

      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: longName,
          description: 'Test long name',
          price: 100,
          stock: 1,
          image: '/long.jpg',
          long_description: 'Test',
          model: 'LONG-1',
        });

      const duration = Date.now() - startTime;

      console.log(`⏱️  Producto con nombre largo: ${duration}ms (Status: ${res.status})`);
      expect(duration).toBeLessThan(500);
    });

    it('debe manejar múltiples actualizaciones rápidas del mismo producto', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Update Test',
          description: 'Test',
          price: 100,
          stock: 5,
          image: '/test.jpg',
          long_description: 'Test',
          model: 'UPD-1',
        });

      const productId = createRes.body.id;
      const startTime = Date.now();

      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .put(`/products/${productId}`)
          .send({ price: 100 + i });
      }

      const duration = Date.now() - startTime;

      console.log(`⏱️  10 actualizaciones consecutivas: ${duration}ms`);
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('⚡ Degradación de performance con volumen', () => {
    it('debe mantener performance al listar muchos productos', async () => {
      // Crear 100 productos
      console.log('📦 Creando 100 productos...');
      for (let i = 0; i < 100; i++) {
        await request(app.getHttpServer())
          .post('/products')
          .send({
            name: `Volume Product ${i}`,
            description: `Desc ${i}`,
            price: 10 + i,
            stock: i % 10,
            image: `/vol${i}.jpg`,
            long_description: `Long ${i}`,
            model: `VOL-${i}`,
          });
      }

      // Medir tiempo de listar todos
      const startTime = Date.now();

      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      const duration = Date.now() - startTime;

      console.log(`⏱️  Listar ${res.body.length} productos: ${duration}ms`);
      expect(duration).toBeLessThan(1000); // Debe mantener < 1 segundo
    });
  });

  describe('⚡ Performance de búsquedas', () => {
    it('debe encontrar producto por ID rápidamente', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Search Test',
          description: 'Test',
          price: 100,
          stock: 5,
          image: '/test.jpg',
          long_description: 'Test',
          model: 'SEARCH-1',
        });

      const productId = createRes.body.id;
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200);

      const duration = Date.now() - startTime;

      console.log(`⏱️  Búsqueda por ID: ${duration}ms`);
      expect(duration).toBeLessThan(50);
    });
  });

  describe('⚡ Throughput - Requests por segundo', () => {
    it('debe calcular throughput aproximado de GET /products', async () => {
      const iterations = 50;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await request(app.getHttpServer())
          .get('/products')
          .expect(200);
      }

      const duration = Date.now() - startTime;
      const requestsPerSecond = (iterations / duration) * 1000;

      console.log(`📊 Throughput GET /products: ${requestsPerSecond.toFixed(2)} req/s`);
      expect(requestsPerSecond).toBeGreaterThan(5); // Al menos 5 req/s
    });
  });

  describe('⚡ Performance de operaciones complejas', () => {
    it('debe medir tiempo de flujo completo: Registro → Login → Crear Producto', async () => {
      const startTime = Date.now();
      const email = `fullflow${Date.now()}@test.com`;

      // Registro
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Full Flow User',
          email: email,
          password: 'flowpass123',
        })
        .expect(201);

      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: email,
          password: 'flowpass123',
        })
        .expect(201);

      // Crear producto
      await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Flow Product',
          description: 'Created after login',
          price: 199.99,
          stock: 5,
          image: '/flow.jpg',
          long_description: 'Test',
          model: 'FLOW-1',
        })
        .expect(201);

      const duration = Date.now() - startTime;

      console.log(`⏱️  Flujo completo Registro→Login→Crear: ${duration}ms`);
      expect(duration).toBeLessThan(2000); // 2 segundos para flujo completo
    });
  });
});
