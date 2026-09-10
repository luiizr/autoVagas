import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import type { UserRepository } from '../../domain/repositories/user-repository.js';
import type { User } from '../../domain/entities/user.js';
const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 24) throw new Error('JWT_SECRET deve possuir ao menos 24 caracteres.');
  return value;
};
export class AuthenticateUserUseCase {
  constructor(private readonly users: UserRepository) {}
  async register(input: { name: string; email: string; password: string }) {
    if (await this.users.findByEmail(input.email)) throw new Error('Este e-mail já está cadastrado.');
    const user: User = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      createdAt: new Date(),
    };
    return this.issue(await this.users.create(user));
  }
  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      throw new Error('E-mail ou senha inválidos.');
    return this.issue(user);
  }
  private issue(user: User) {
    return {
      token: jwt.sign({ sub: user.id, email: user.email }, secret(), { expiresIn: '7d' }),
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
