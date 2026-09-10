import type { User } from '../../../domain/entities/user.js';
import type { UserRepository } from '../../../domain/repositories/user-repository.js';
import { pool } from '../pool.js';
const map = (row: Record<string, unknown>): User => ({
  id: String(row.id),
  name: String(row.name),
  email: String(row.email),
  passwordHash: String(row.password_hash),
  createdAt: new Date(String(row.created_at)),
});
export class PostgresUserRepository implements UserRepository {
  async findByEmail(email: string) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ? map(result.rows[0]) : null;
  }
  async findById(id: string) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? map(result.rows[0]) : null;
  }
  async create(user: User) {
    const result = await pool.query(
      'INSERT INTO users (id, name, email, password_hash, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [user.id, user.name, user.email, user.passwordHash, user.createdAt],
    );
    return map(result.rows[0]);
  }
}
