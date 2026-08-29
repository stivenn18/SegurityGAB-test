import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './user_entity/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Partial<Repository<User>>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('createUser: hashea password y asigna role por defecto (user)', async () => {
    (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hashed-pass');

    (repo.create as jest.Mock).mockReturnValue({ id: 1 } as any);
    (repo.save as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-pass',
      role: 'user',
    });

    const result = await service.createUser({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'plain',
    } as any);

    expect(bcrypt.hash).toHaveBeenCalledWith('plain', 10);

    expect(repo.create).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-pass',
      role: 'user',
    });

    expect(result).toEqual({
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-pass',
      role: 'user',
    });
  });

  it('findAll: retorna lo que devuelve el repositorio', async () => {
    (repo.find as jest.Mock).mockResolvedValue([{ id: 1 } as any]);
    await expect(service.findAll()).resolves.toEqual([{ id: 1 }]);
  });

  it('updateRole: lanza error si el usuario no existe', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.updateRole(123, 'admin')).rejects.toThrow('User not found');
  });

  it('updateRole: actualiza role y guarda', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({ id: 123, role: 'user' } as any);
    (repo.save as jest.Mock).mockResolvedValue({ id: 123, role: 'admin' } as any);

    await expect(service.updateRole(123, 'admin')).resolves.toEqual({
      id: 123,
      role: 'admin',
    });

    expect(repo.save).toHaveBeenCalledWith({ id: 123, role: 'admin' });
  });
});
