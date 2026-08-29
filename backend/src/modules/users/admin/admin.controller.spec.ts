import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: service }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('findAll: delega en AdminService.findAll', async () => {
    service.findAll.mockResolvedValue([{ id: 1 }]);
    await expect(controller.findAll()).resolves.toEqual([{ id: 1 }]);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('create: delega en AdminService.create', async () => {
    service.create.mockResolvedValue({ id: 1, email: 'a@a.com' });

    await expect(
      controller.create({ email: 'a@a.com', password: 'x' } as any),
    ).resolves.toEqual({ id: 1, email: 'a@a.com' });

    expect(service.create).toHaveBeenCalledWith({ email: 'a@a.com', password: 'x' });
  });

  it('update: delega en AdminService.update', async () => {
    service.update.mockResolvedValue({ id: 2, name: 'B' });

    await expect(controller.update('2', { name: 'B' } as any)).resolves.toEqual({
      id: 2,
      name: 'B',
    });

    expect(service.update).toHaveBeenCalledWith(2, { name: 'B' });
  });

  it('remove: delega en AdminService.remove', async () => {
    service.remove.mockResolvedValue({ message: 'ok' });

    await expect(controller.remove('9')).resolves.toEqual({ message: 'ok' });
    expect(service.remove).toHaveBeenCalledWith(9);
  });
});
