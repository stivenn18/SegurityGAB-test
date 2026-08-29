import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { ProductsModule } from '../src/modules/products/products.module';

import { User } from '../src/modules/users/user_entity/user.entity';
import { Product } from '../src/modules/products/products_entity/product_entity';

describe('Auth + Products (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqljs',
          autoSave: false,
          // Using an in-memory DB; TypeORM will create schema on init.
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

  it('POST /auth/register -> crea usuario sin devolver password', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret',
      })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: 'Alice',
        email: 'alice@example.com',
        role: 'user',
      }),
    );
    expect(res.body.password).toBeUndefined();
  });

  it('POST /auth/login -> rechaza credenciales inválidas', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'wrong' })
      .expect(401);
  });

  it('POST /auth/login -> entrega token con credenciales válidas', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice@example.com', password: 'secret' })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        access_token: expect.any(String),
        user: expect.objectContaining({
          id: expect.any(Number),
          email: 'alice@example.com',
          role: 'user',
        }),
      }),
    );
  });

  it('Products CRUD básico (sin auth)', async () => {
    const empty = await request(app.getHttpServer()).get('/products').expect(200);
    expect(Array.isArray(empty.body)).toBe(true);

    const created = await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Camara 1',
        description: 'Desc',
        price: 10.5,
        stock: 5,
        image: '/uploads/x.png',
        long_description: 'Long',
        model: 'M1',
      })
      .expect(201);

    expect(created.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: 'Camara 1',
        description: 'Desc',
        stock: 5,
        image: '/uploads/x.png',
        long_description: 'Long',
        model: 'M1',
      }),
    );

    const id = created.body.id;

    const fetched = await request(app.getHttpServer())
      .get(`/products/${id}`)
      .expect(200);

    expect(fetched.body).toEqual(expect.objectContaining({ id, name: 'Camara 1' }));

    const updated = await request(app.getHttpServer())
      .put(`/products/${id}`)
      .send({ name: 'Camara 1b' })
      .expect(200);

    expect(updated.body).toEqual(expect.objectContaining({ id, name: 'Camara 1b' }));

    await request(app.getHttpServer()).delete(`/products/${id}`).expect(200);
  });
});
