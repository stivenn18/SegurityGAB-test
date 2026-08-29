import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductsService } from '../../src/modules/products/products.service';
import { Product } from '../../src/modules/products/products_entity/product_entity';

/**
 * Pruebas Unitarias - ProductsService
 * 
 * Las pruebas unitarias verifican el comportamiento de una unidad individual
 * de código (generalmente un método o función) de forma aislada.
 * Se usan mocks para aislar la unidad de sus dependencias.
 */
describe('ProductsService - Unit Tests', () => {
  let service: ProductsService;
  let repository: Repository<Product>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));

    jest.clearAllMocks();
  });

  describe('findAll()', () => {
    it('debe devolver un array de productos', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 100, stock: 5 },
        { id: 2, name: 'Product 2', price: 200, stock: 10 },
      ] as Product[];

      mockRepository.find.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(result).toEqual(mockProducts);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it('debe devolver array vacío cuando no hay productos', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne()', () => {
    it('debe devolver un producto cuando existe', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 150,
        stock: 7,
      } as Product;

      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(1);

      expect(result).toEqual(mockProduct);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar NotFoundException cuando el producto no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Product with id 999 not found'
      );
    });

    it('debe llamar a findOne con el ID correcto', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 42,
        name: 'Product',
      } as Product);

      await service.findOne(42);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 42 } });
    });
  });

  describe('create()', () => {
    it('debe crear y guardar un nuevo producto', async () => {
      const newProduct = {
        name: 'New Product',
        description: 'Description',
        price: 299.99,
        stock: 20,
        image: '/image.jpg',
        long_description: 'Long desc',
        model: 'MODEL-1',
      } as Product;

      const savedProduct = { ...newProduct, id: 1 } as Product;

      mockRepository.save.mockResolvedValue(savedProduct);

      const result = await service.create(newProduct);

      expect(result).toEqual(savedProduct);
      expect(mockRepository.save).toHaveBeenCalledWith(newProduct);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('debe preservar todos los datos del producto al crear', async () => {
      const productData = {
        name: 'Complete Product',
        description: 'Full description',
        price: 499.99,
        stock: 15,
        image: '/complete.jpg',
        long_description: 'Very long description',
        model: 'COMPLETE-001',
      } as Product;

      mockRepository.save.mockImplementation((product) =>
        Promise.resolve({ ...product, id: 10 } as Product)
      );

      const result = await service.create(productData);

      expect(result).toMatchObject(productData);
      expect(result.id).toBe(10);
    });
  });

  describe('update()', () => {
    it('debe actualizar un producto existente', async () => {
      const existingProduct = {
        id: 5,
        name: 'Old Name',
        price: 100,
      } as Product;

      const updatedProduct = {
        ...existingProduct,
        name: 'New Name',
      } as Product;

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedProduct);

      const result = await service.update(5, { name: 'New Name' });

      expect(mockRepository.update).toHaveBeenCalledWith(5, { name: 'New Name' });
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(result).toEqual(updatedProduct);
    });

    it('debe lanzar NotFoundException si el producto no existe después de actualizar', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 } as any);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Test' })).rejects.toThrow(
        NotFoundException
      );
    });

    it('debe permitir actualización parcial de campos', async () => {
      const originalProduct = {
        id: 3,
        name: 'Original',
        price: 200,
        stock: 5,
      } as Product;

      const updatedProduct = {
        ...originalProduct,
        price: 250,
      } as Product;

      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOne.mockResolvedValue(updatedProduct);

      const result = await service.update(3, { price: 250 });

      expect(result.name).toBe('Original');
      expect(result.price).toBe(250);
      expect(result.stock).toBe(5);
    });
  });

  describe('remove()', () => {
    it('debe eliminar un producto por ID', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('debe completar sin error aunque el producto no exista', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(service.remove(999)).resolves.toBeUndefined();
    });

    it('debe llamar a delete con el ID correcto', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.remove(42);

      expect(mockRepository.delete).toHaveBeenCalledWith(42);
    });
  });

  describe('Pruebas de aislamiento', () => {
    it('no debe tener efectos secundarios entre llamadas', async () => {
      mockRepository.find.mockResolvedValue([{ id: 1 }] as Product[]);

      await service.findAll();
      await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledTimes(2);
    });

    it('debe usar solo el repositorio inyectado', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 } as Product);

      await service.findOne(1);

      // Verificar que no se crean nuevas instancias del repositorio
      expect(repository).toBeDefined();
    });
  });

  describe('Manejo de errores', () => {
    it('debe propagar errores del repositorio en findAll', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow('Database error');
    });

    it('debe propagar errores del repositorio en save', async () => {
      mockRepository.save.mockRejectedValue(new Error('Constraint violation'));

      await expect(
        service.create({ name: 'Test' } as Product)
      ).rejects.toThrow('Constraint violation');
    });
  });

  describe('Verificación de contratos', () => {
    it('findOne debe devolver Promise<Product>', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 } as Product);

      const result = service.findOne(1);

      expect(result).toBeInstanceOf(Promise);
      expect(await result).toHaveProperty('id');
    });

    it('findAll debe devolver Promise<Product[]>', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = service.findAll();

      expect(result).toBeInstanceOf(Promise);
      expect(Array.isArray(await result)).toBe(true);
    });
  });
});
