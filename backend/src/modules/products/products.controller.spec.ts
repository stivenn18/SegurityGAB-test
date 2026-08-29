import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('findAll: delega en ProductsService', async () => {
    service.findAll.mockResolvedValue([{ id: 1 }]);
    await expect(controller.findAll()).resolves.toEqual([{ id: 1 }]);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('findOne: delega en ProductsService', async () => {
    service.findOne.mockResolvedValue({ id: 3 });
    await expect(controller.findOne(3 as any)).resolves.toEqual({ id: 3 });
    expect(service.findOne).toHaveBeenCalledWith(3);
  });

  it('create: delega en ProductsService', async () => {
    service.create.mockResolvedValue({ id: 1, name: 'A' });
    await expect(controller.create({ name: 'A' } as any)).resolves.toEqual({
      id: 1,
      name: 'A',
    });
    expect(service.create).toHaveBeenCalledWith({ name: 'A' });
  });

  it('update: delega en ProductsService', async () => {
    service.update.mockResolvedValue({ id: 5, name: 'B' });
    await expect(controller.update(5 as any, { name: 'B' } as any)).resolves.toEqual({
      id: 5,
      name: 'B',
    });
    expect(service.update).toHaveBeenCalledWith(5, { name: 'B' });
  });

  it('remove: delega en ProductsService', async () => {
    service.remove.mockResolvedValue(undefined);
    await expect(controller.remove(9 as any)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(9);
  });

  it('uploadFile: retorna el path a partir del filename', () => {
    expect(controller.uploadFile({ filename: 'x.png' } as any)).toEqual({
      path: '/uploads/x.png',
    });
  });
});
