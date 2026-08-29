import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    createUser: jest.Mock;
    findAll: jest.Mock;
    updateRole: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      createUser: jest.fn(),
      findAll: jest.fn(),
      updateRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('create: delega en UsersService.createUser', async () => {
    service.createUser.mockResolvedValue({ id: 1, email: 'a@a.com' });

    await expect(
      controller.create({ email: 'a@a.com', password: 'x' } as any),
    ).resolves.toEqual({ id: 1, email: 'a@a.com' });

    expect(service.createUser).toHaveBeenCalledWith({ email: 'a@a.com', password: 'x' });
  });

  it('findAll: delega en UsersService.findAll', async () => {
    service.findAll.mockResolvedValue([{ id: 1 }]);

    await expect(controller.findAll()).resolves.toEqual([{ id: 1 }]);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('updateRole: delega en UsersService.updateRole', async () => {
    service.updateRole.mockResolvedValue({ id: 2, role: 'admin' });

    await expect(controller.updateRole(2 as any, { role: 'admin' })).resolves.toEqual({
      id: 2,
      role: 'admin',
    });

    expect(service.updateRole).toHaveBeenCalledWith(2, 'admin');
  });
});
