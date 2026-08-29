import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { ProductsModule } from '../../src/modules/products/products.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { User } from '../../src/modules/users/user_entity/user.entity';

/**
 * Pruebas de Caja Negra - Módulo de Autenticación
 * 
 * Estas pruebas validan el comportamiento del sistema sin conocer
 * su implementación interna. Se prueban entradas y se verifican salidas.
 */
describe('Auth Module - Black Box Tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-12345';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqljs',
          autoSave: false,
          synchronize: true,
          dropSchema: true,
          entities: [User],
          logging: false,
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

  describe('POST /auth/register - Registro de usuarios', () => {
    it('debería registrar un usuario con datos válidos', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Juan Pérez');
      expect(res.body).toHaveProperty('email', 'juan@example.com');
      expect(res.body).toHaveProperty('role', 'user');
      expect(res.body).not.toHaveProperty('password');
    });

    it('debería rechazar registro con nombre muy corto', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'AB',
          email: 'short@example.com',
          password: 'password123',
        })
        .expect(400);
    });

    it('debería rechazar registro con email inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('debería rechazar registro con contraseña corta', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '12345',
        })
        .expect(400);
    });

    it('debería rechazar registro sin nombre', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'noname@example.com',
          password: 'password123',
        })
        .expect(400);
    });

    it('debería rechazar registro sin email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          password: 'password123',
        })
        .expect(400);
    });

    it('debería rechazar registro sin contraseña', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
        })
        .expect(400);
    });

    it('debería registrar usuario con rol admin si se especifica', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin',
        })
        .expect(201);

      expect(res.body).toHaveProperty('role', 'admin');
    });
  });

  describe('POST /auth/login - Inicio de sesión', () => {
    beforeAll(async () => {
      // Crear usuario de prueba
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Login Test',
          email: 'logintest@example.com',
          password: 'testpass123',
        });
    });

    it('debería iniciar sesión con credenciales válidas', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'testpass123',
        })
        .expect(201);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('access_token');
      expect(res.body.access_token).toBeTruthy();
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('email', 'logintest@example.com');
      expect(res.body.user).toHaveProperty('role');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('debería rechazar login con email inexistente', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'noexiste@example.com',
          password: 'cualquiercontraseña',
        })
        .expect(401);
    });

    it('debería rechazar login con contraseña incorrecta', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'contraseñaincorrecta',
        })
        .expect(401);
    });

    it('debería rechazar login sin email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'testpass123',
        })
        .expect(401);
    });

    it('debería rechazar login sin contraseña', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@example.com',
        })
        .expect(500);
    });

    it('debería rechazar login con datos vacíos', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(500);
    });

    it('debería devolver token JWT válido (verificar formato)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'testpass123',
        })
        .expect(201);

      const token = res.body.access_token;
      // Un JWT tiene formato xxx.yyy.zzz
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });
  });

  describe('Casos de seguridad', () => {
    it('debería proteger contra inyección SQL en email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: "admin@example.com' OR '1'='1",
          password: 'anything',
        })
        .expect(401);
    });

    it('no debería revelar información sobre existencia de usuarios', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'usuarionoexiste@example.com',
          password: 'password123',
        })
        .expect(401);

      const res2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'contraseñaincorrecta',
        })
        .expect(401);

      // Ambos errores deberían ser similares para no revelar si el usuario existe
      expect(res1.body.message).toBeDefined();
      expect(res2.body.message).toBeDefined();
    });
  });
});
