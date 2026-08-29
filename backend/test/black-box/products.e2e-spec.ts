import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../../src/modules/products/products.module';


import { Product } from '../../src/modules/products/products_entity/product_entity';

/**
 * Pruebas de Caja Negra - Módulo de Productos
 * 
 * Pruebas que validan el comportamiento del CRUD de productos
 * sin conocer su implementación interna.
 */
describe('Products Module - Black Box Tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqljs',
          autoSave: false,
          synchronize: true,
          dropSchema: true,
          entities: [Product],
          logging: false,
        }),
        ProductsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /products - Listar productos', () => {
    it('debería devolver un array vacío cuando no hay productos', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('debería devolver todos los productos existentes', async () => {
      // Crear productos de prueba
      await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Cámara Alpha',
          description: 'Cámara profesional',
          price: 599.99,
          stock: 10,
          image: '/uploads/camera1.jpg',
          long_description: 'Descripción detallada de la cámara',
          model: 'ALPHA-2024',
        });

      await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Cámara Beta',
          description: 'Cámara compacta',
          price: 299.99,
          stock: 15,
          image: '/uploads/camera2.jpg',
          long_description: 'Descripción detallada',
          model: 'BETA-2024',
        });

      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /products - Crear producto', () => {
    it('debería crear un producto con todos los campos válidos', async () => {
      const productData = {
        name: 'Cámara Gamma',
        description: 'Alta resolución',
        price: 799.99,
        stock: 5,
        image: '/uploads/gamma.jpg',
        long_description: 'Cámara de alta gama con 50MP',
        model: 'GAMMA-2024',
      };

      const res = await request(app.getHttpServer())
        .post('/products')
        .send(productData)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(productData.name);
      expect(res.body.description).toBe(productData.description);
      expect(res.body.price).toBe(productData.price);
      expect(res.body.stock).toBe(productData.stock);
      expect(res.body.image).toBe(productData.image);
      expect(res.body.model).toBe(productData.model);
    });

    it('debería crear producto con precio decimal', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Producto Decimal',
          description: 'Test precio',
          price: 99.99,
          stock: 1,
          image: '/img.jpg',
          long_description: 'Test',
          model: 'DEC-001',
        })
        .expect(201);

      expect(res.body.price).toBe(99.99);
    });

    it('debería crear producto con stock cero', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Sin Stock',
          description: 'Producto agotado',
          price: 100,
          stock: 0,
          image: '/img.jpg',
          long_description: 'Test',
          model: 'ZERO-001',
        })
        .expect(201);

      expect(res.body.stock).toBe(0);
    });
  });

  describe('GET /products/:id - Obtener producto por ID', () => {
    let productId: number;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Producto Para Buscar',
          description: 'Test búsqueda',
          price: 150,
          stock: 20,
          image: '/test.jpg',
          long_description: 'Descripción test',
          model: 'SEARCH-001',
        });
      productId = res.body.id;
    });

    it('debería obtener un producto existente por ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200);

      expect(res.body).toHaveProperty('id', productId);
      expect(res.body).toHaveProperty('name', 'Producto Para Buscar');
      expect(res.body).toHaveProperty('price', 150);
    });

    it('debería devolver 404 para producto inexistente', async () => {
      await request(app.getHttpServer())
        .get('/products/999999')
        .expect(404);
    });

    it('debería devolver error para ID inválido (no numérico)', async () => {
      await request(app.getHttpServer())
        .get('/products/abc')
        .expect(404);
    });
  });

  describe('PUT /products/:id - Actualizar producto', () => {
    let productId: number;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Producto Original',
          description: 'Descripción original',
          price: 200,
          stock: 10,
          image: '/original.jpg',
          long_description: 'Long desc',
          model: 'ORIG-001',
        });
      productId = res.body.id;
    });

    it('debería actualizar el nombre del producto', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .send({ name: 'Nombre Actualizado' })
        .expect(200);

      expect(res.body.name).toBe('Nombre Actualizado');
      expect(res.body.id).toBe(productId);
    });

    it('debería actualizar el precio del producto', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .send({ price: 299.99 })
        .expect(200);

      expect(res.body.price).toBe(299.99);
    });

    it('debería actualizar el stock del producto', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .send({ stock: 50 })
        .expect(200);

      expect(res.body.stock).toBe(50);
    });

    it('debería actualizar múltiples campos simultáneamente', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .send({
          name: 'Nuevo Nombre',
          price: 350.00,
          stock: 25,
        })
        .expect(200);

      expect(res.body.name).toBe('Nuevo Nombre');
      expect(res.body.price).toBe(350);
      expect(res.body.stock).toBe(25);
    });

    it('debería mantener campos no actualizados', async () => {
      const res = await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .send({ name: 'Solo Cambio Nombre' })
        .expect(200);

      expect(res.body.name).toBe('Solo Cambio Nombre');
      expect(res.body.price).toBe(200); // Precio original
      expect(res.body.stock).toBe(10); // Stock original
    });

    it('debería devolver 404 al actualizar producto inexistente', async () => {
      await request(app.getHttpServer())
        .put('/products/999999')
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /products/:id - Eliminar producto', () => {
    it('debería eliminar un producto existente', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Producto A Eliminar',
          description: 'Test delete',
          price: 100,
          stock: 5,
          image: '/delete.jpg',
          long_description: 'Test',
          model: 'DEL-001',
        });

      const productId = res.body.id;

      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .expect(200);

      // Verificar que el producto ya no existe
      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(404);
    });

    it('debería devolver 200 aunque el producto no exista', async () => {
      // Por diseño de TypeORM, delete no falla si el ID no existe
      await request(app.getHttpServer())
        .delete('/products/999999')
        .expect(200);
    });
  });

  describe('Casos límite y validación', () => {
    it('debería manejar producto con precio muy alto', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Producto Caro',
          description: 'Precio alto',
          price: 999999.99,
          stock: 1,
          image: '/expensive.jpg',
          long_description: 'Test',
          model: 'EXP-001',
        })
        .expect(201);

      expect(res.body.price).toBe(999999.99);
    });

    it('debería manejar producto con stock alto', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Mucho Stock',
          description: 'Stock alto',
          price: 10,
          stock: 10000,
          image: '/stock.jpg',
          long_description: 'Test',
          model: 'STOCK-001',
        })
        .expect(201);

      expect(res.body.stock).toBe(10000);
    });

    it('debería manejar nombres con caracteres especiales', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Cámara™ Ñandú & López',
          description: 'Test chars',
          price: 100,
          stock: 5,
          image: '/special.jpg',
          long_description: 'Test',
          model: 'SPEC-001',
        })
        .expect(201);

      expect(res.body.name).toBe('Cámara™ Ñandú & López');
    });
  });

  describe('Flujo completo CRUD', () => {
    it('debería completar un ciclo completo de CRUD', async () => {
      // 1. Crear
      const createRes = await request(app.getHttpServer())
        .post('/products')
        .send({
          name: 'Producto Ciclo Completo',
          description: 'Test CRUD',
          price: 250,
          stock: 8,
          image: '/cycle.jpg',
          long_description: 'Descripción completa',
          model: 'CYCLE-001',
        })
        .expect(201);

      const productId = createRes.body.id;
      expect(productId).toBeDefined();

      // 2. Leer
      const readRes = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200);

      expect(readRes.body.name).toBe('Producto Ciclo Completo');

      // 3. Actualizar
      const updateRes = await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .send({ name: 'Producto Actualizado', price: 300 })
        .expect(200);

      expect(updateRes.body.name).toBe('Producto Actualizado');
      expect(updateRes.body.price).toBe(300);

      // 4. Eliminar
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .expect(200);

      // 5. Verificar eliminación
      await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(404);
    });
  });
});
