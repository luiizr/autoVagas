import { Router } from 'express';
import { z } from 'zod';
import { AuthenticateUserUseCase } from '../application/use-cases/authenticate-user.js';
import { PostgresJobRepository } from '../infrastructure/database/repositories/postgres-job-repository.js';
import { PostgresUserRepository } from '../infrastructure/database/repositories/postgres-user-repository.js';
import { requireAuth, type AuthRequest } from '../infrastructure/http/auth.js';
const auth = new AuthenticateUserUseCase(new PostgresUserRepository());
const jobs = new PostgresJobRepository();
const credentials = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});
export const routes = Router();
routes.get('/health', (_, res) => res.json({ status: 'ok' }));
routes.post('/auth/register', async (req, res, next) => {
  try {
    const input = credentials.extend({ name: z.string().trim().min(2).max(100) }).parse(req.body);
    res.status(201).json(await auth.register(input));
  } catch (error) {
    next(error);
  }
});
routes.post('/auth/login', async (req, res, next) => {
  try {
    const input = credentials.pick({ email: true, password: true }).parse(req.body);
    res.json(await auth.login(input.email, input.password));
  } catch (error) {
    next(error);
  }
});
routes.get('/auth/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await new PostgresUserRepository().findById(req.userId!);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    next(error);
  }
});
routes.get('/jobs', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    res.json({
      jobs: await jobs.list({
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        limit,
        offset,
      }),
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});
routes.get('/jobs/search', async (req, res, next) => {
  try {
    const search = typeof req.query.q === 'string' ? req.query.q : undefined;
    res.json({ jobs: await jobs.list({ search, limit: 20, offset: 0 }) });
  } catch (error) {
    next(error);
  }
});
routes.get('/jobs/:id', async (req, res, next) => {
  try {
    const job = await jobs.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Vaga não encontrada.' });
    res.json(job);
  } catch (error) {
    next(error);
  }
});
routes.get('/sources', (_, res) =>
  res.json({ sources: [{ id: 'jerimum-jobs', name: 'Jerimum Jobs', status: 'ready' }] }),
);
