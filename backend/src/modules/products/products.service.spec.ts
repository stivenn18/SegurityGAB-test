import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './products_entity/product_entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let repo: jest.Mocked<Partial<Repository<Product>>>;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: repo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('findAll: retorna lo que devuelve el repositorio', async () => {
    (repo.find as jest.Mock).mockResolvedValue([{ id: 1 } as any]);

    await expect(service.findAll()).resolves.toEqual([{ id: 1 }]);
    expect(repo.find).toHaveBeenCalledTimes(1);
  });

  it('findOne: retorna el producto si existe', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ id: 10 } as any);

    await expect(service.findOne(10)).resolves.toEqual({ id: 10 });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 10 } });
  });

  it('findOne: lanza NotFoundException si no existe', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create: guarda el producto', async () => {
    const input = { name: 'A' } as any;
    (repo.save as jest.Mock).mockResolvedValue({ id: 1, ...input } as any);

    await expect(service.create(input)).resolves.toEqual({ id: 1, ...input });
    expect(repo.save).toHaveBeenCalledWith(input);
  });

  it('update: actualiza y retorna el producto actualizado (via findOne)', async () => {
    (repo.update as jest.Mock).mockResolvedValue({} as any);
    (repo.findOne as jest.Mock).mockResolvedValue({ id: 5, name: 'updated' } as any);

    await expect(service.update(5, { name: 'updated' })).resolves.toEqual({
      id: 5,
      name: 'updated',
    });

    expect(repo.update).toHaveBeenCalledWith(5, { name: 'updated' });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it('remove: elimina el producto', async () => {
    (repo.delete as jest.Mock).mockResolvedValue({} as any);

    await expect(service.remove(7)).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledWith(7);
  });
});
