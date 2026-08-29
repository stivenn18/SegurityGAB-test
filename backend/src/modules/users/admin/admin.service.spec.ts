import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { User } from './../user_entity/user.entity';

describe('AdminService', () => {
  let service: AdminService;
  let repo: jest.Mocked<Partial<Repository<User>>>;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    // Important: bcrypt is module-mocked, so we clear call history between tests.
    jest.clearAllMocks();
  });

  it('findAll: retorna lo que devuelve el repositorio', async () => {
    (repo.find as jest.Mock).mockResolvedValue([{ id: 1 } as any]);

    await expect(service.findAll()).resolves.toEqual([{ id: 1 }]);
    expect(repo.find).toHaveBeenCalledTimes(1);
  });

  it('create: hashea password y guarda', async () => {
    (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hashed');
    (repo.create as jest.Mock).mockReturnValue({ id: 1 } as any);
    (repo.save as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'a@a.com',
      password: 'hashed',
    } as any);

    const result = await service.create({
      email: 'a@a.com',
      password: 'plain',
      name: 'A',
      role: 'user',
    } as any);

    expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
    expect(repo.create).toHaveBeenCalledWith({
      email: 'a@a.com',
      password: 'hashed',
      name: 'A',
      role: 'user',
    });
    expect(result).toEqual({ id: 1, email: 'a@a.com', password: 'hashed' });
  });

  it('update: lanza NotFoundException si el usuario no existe', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.update(999, { name: 'X' } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update: si viene password, la hashea y guarda', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'a@a.com',
      password: 'old',
    } as any);

    (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('new-hashed');
    (repo.save as jest.Mock).mockImplementation(async (u: any) => u);

    await expect(
      service.update(1, { password: 'plain', name: 'B' } as any),
    ).resolves.toEqual({
      id: 1,
      email: 'a@a.com',
      password: 'new-hashed',
      name: 'B',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('update: si NO viene password, no hashea y guarda', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'a@a.com',
      password: 'old',
    } as any);

    (repo.save as jest.Mock).mockImplementation(async (u: any) => u);

    await expect(service.update(1, { name: 'C' } as any)).resolves.toEqual({
      id: 1,
      email: 'a@a.com',
      password: 'old',
      name: 'C',
    });

    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('remove: lanza NotFoundException si el usuario no existe', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.remove(123)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove: elimina y retorna mensaje', async () => {
    const user = { id: 5 } as any;
    (repo.findOne as jest.Mock).mockResolvedValue(user);
    (repo.remove as jest.Mock).mockResolvedValue(user);

    await expect(service.remove(5)).resolves.toEqual({
      message: 'Usuario con id 5 eliminado correctamente',
    });

    expect(repo.remove).toHaveBeenCalledWith(user);
  });
});
