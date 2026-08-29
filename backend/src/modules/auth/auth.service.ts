import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user)
      throw new UnauthorizedException('Usuario o contraseña inválidos');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      throw new UnauthorizedException('Usuario o contraseña inválidos|');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      access_token: token,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  async register(createUserDto: CreateUserDto) {
    // La contraseña ya se hashea en UsersService.createUser
    const newUser = await this.usersService.createUser(createUserDto);

    // No devolver la contraseña en la respuesta
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}
