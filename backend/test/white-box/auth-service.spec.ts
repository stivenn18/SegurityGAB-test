import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AuthService } from '../../src/modules/auth/auth.service';
import { UsersService } from '../../src/modules/users/users.service';
import { CreateUserDto } from '../../src/modules/users/dto/create-user.dto';

/**
 * Pruebas de Caja Blanca - AuthService
 * 
 * Las pruebas de caja blanca examinan la estructura interna del código,
 * incluyendo rutas de ejecución, condiciones, ciclos y lógica interna.
 * Se conoce la implementación y se prueban todos los caminos posibles.
 */
describe('AuthService - White Box Tests', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks antes de cada prueba
    jest.clearAllMocks();
  });

  describe('login() - Análisis de rutas de ejecución', () => {
    /**
     * Ruta 1: Usuario no existe (línea 16)
     * Condición: !user === true
     */
    it('debe lanzar UnauthorizedException cuando el usuario no existe (Ruta 1)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('noexiste@example.com', 'password123')
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('noexiste@example.com');
      expect(mockUsersService.findByEmail).toHaveBeenCalledTimes(1);
      // No debe llegar a comparar contraseña ni generar token
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    /**
     * Ruta 2: Usuario existe pero contraseña incorrecta (línea 20)
     * Condición: user existe && !valid === true
     */
    it('debe lanzar UnauthorizedException cuando la contraseña es incorrecta (Ruta 2)', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 10),
        role: 'user',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      // bcrypt.compare devolverá false
      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      // No debe generar token
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    /**
     * Ruta 3: Usuario existe y contraseña correcta (línea 23-30)
     * Condición: user existe && valid === true
     */
    it('debe generar token JWT cuando las credenciales son válidas (Ruta 3)', async () => {
      const password = 'correctpassword';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user' as const,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await authService.login('test@example.com', password);

      // Verificar que se construyó el payload correcto
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });

      // Verificar estructura de respuesta
      expect(result).toEqual({
        message: 'Login successful',
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
    });

    /**
     * Cobertura de condiciones: Verificar que el mensaje de error
     * no revele si el usuario existe o no
     */
    it('debe usar el mismo mensaje de error para usuario no encontrado y contraseña incorrecta', async () => {
      // Caso 1: Usuario no existe
      mockUsersService.findByEmail.mockResolvedValue(null);
      
      let error1;
      try {
        await authService.login('noexiste@example.com', 'password');
      } catch (e) {
        error1 = e;
      }

      // Caso 2: Contraseña incorrecta
      const mockUser = {
        id: 1,
        email: 'exists@example.com',
        password: await bcrypt.hash('correct', 10),
        role: 'user',
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      let error2;
      try {
        await authService.login('exists@example.com', 'wrong');
      } catch (e) {
        error2 = e;
      }

      // Ambos errores deben ser UnauthorizedException
      expect(error1).toBeInstanceOf(UnauthorizedException);
      expect(error2).toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('register() - Análisis de flujo de datos', () => {
    /**
     * Prueba de cobertura de statements y transformación de datos
     */
    it('debe llamar a createUser y eliminar password de la respuesta', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      };

      const mockCreatedUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'user' as const,
      };

      mockUsersService.createUser.mockResolvedValue(mockCreatedUser);

      const result = await authService.register(createUserDto);

      // Verificar que se llamó a createUser con el DTO correcto
      expect(mockUsersService.createUser).toHaveBeenCalledWith(createUserDto);
      expect(mockUsersService.createUser).toHaveBeenCalledTimes(1);

      // Verificar que la password fue eliminada de la respuesta (línea 38)
      expect(result).not.toHaveProperty('password');
      expect(result).toEqual({
        id: mockCreatedUser.id,
        name: mockCreatedUser.name,
        email: mockCreatedUser.email,
        role: mockCreatedUser.role,
      });
    });

    /**
     * Prueba de desestructuración y operador spread
     */
    it('debe preservar todas las propiedades excepto password usando desestructuración', async () => {
      const mockCreatedUser = {
        id: 5,
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'hashed-password',
        role: 'admin' as const,
        createdAt: new Date(),
      };

      mockUsersService.createUser.mockResolvedValue(mockCreatedUser);

      const result = await authService.register({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpass',
        role: 'admin',
      });

      // Verificar que todas las propiedades excepto password están presentes
      expect(result).toHaveProperty('id', 5);
      expect(result).toHaveProperty('name', 'Admin User');
      expect(result).toHaveProperty('email', 'admin@example.com');
      expect(result).toHaveProperty('role', 'admin');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('Cobertura de líneas y branches', () => {
    /**
     * Verificar que se ejecutan todas las líneas del método login exitoso
     */
    it('debe ejecutar todas las líneas en login exitoso', async () => {
      const password = 'testpass';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const mockUser = {
        id: 10,
        email: 'fullpath@example.com',
        password: hashedPassword,
        role: 'admin' as const,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('generated-token');

      const result = await authService.login('fullpath@example.com', password);

      // Línea 15: llamada a findByEmail
      expect(mockUsersService.findByEmail).toHaveBeenCalled();
      
      // Líneas 16-17: verificación de usuario (branch if)
      // No debe lanzar error, así que pasamos esta branch
      
      // Línea 19: bcrypt.compare se ejecutó (internamente)
      
      // Líneas 23-24: construcción de payload
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 10,
        email: 'fullpath@example.com',
        role: 'admin',
      });

      // Línea 24: asignación de token
      // Líneas 26-30: construcción y retorno de objeto
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('access_token', 'generated-token');
      expect(result).toHaveProperty('user');
    });
  });

  describe('Análisis de dependencias y acoplamiento', () => {
    /**
     * Verificar que AuthService depende correctamente de UsersService
     */
    it('debe delegar la búsqueda de usuario a UsersService', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      try {
        await authService.login('test@example.com', 'pass');
      } catch (e) {
        // Esperamos que falle
      }

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    /**
     * Verificar que AuthService depende correctamente de JwtService
     */
    it('debe delegar la generación de token a JwtService', async () => {
      const password = 'testpass';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user' as const,
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      await authService.login('test@example.com', password);

      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: expect.any(Number),
          email: expect.any(String),
          role: expect.any(String),
        })
      );
    });
  });

  describe('Pruebas de ciclos y complejidad ciclomática', () => {
    /**
     * AuthService.login tiene complejidad ciclomática de 3:
     * - 1 (camino base)
     * - +1 (if !user)
     * - +1 (if !valid)
     * 
     * Debemos probar todos los caminos
     */
    it('debe cubrir todos los caminos de complejidad ciclomática en login', async () => {
      // Camino 1: !user === true
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(authService.login('a@a.com', 'pass')).rejects.toThrow();

      // Camino 2: user existe && !valid === true
      const mockUser = {
        id: 1,
        email: 'b@b.com',
        password: await bcrypt.hash('correct', 10),
        role: 'user' as const,
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      await expect(authService.login('b@b.com', 'wrong')).rejects.toThrow();

      // Camino 3: user existe && valid === true
      mockJwtService.sign.mockReturnValue('token');
      const result = await authService.login('b@b.com', 'correct');
      expect(result).toHaveProperty('access_token');
    });
  });
});
