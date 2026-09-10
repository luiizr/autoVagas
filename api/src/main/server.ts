import 'dotenv/config';
import { createRequire } from 'node:module';
import cors from 'cors';
import express from 'express';
import { routes } from './routes.js';

const legacyRequire = createRequire(__filename);
const legacyImdRouter = legacyRequire('../../routes/api.js') as express.Router;
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
app.use(express.json({ limit: '200kb' }));
app.use('/api', routes);
app.use('/api', legacyImdRouter);
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Erro interno.';
  const databaseUnavailable = message.includes('password authentication failed');
  res
    .status(databaseUnavailable ? 503 : message.includes('inválid') || message.includes('mínimo') ? 400 : 500)
    .json({
      error: databaseUnavailable
        ? 'Banco de dados indisponível. Verifique a DATABASE_URL configurada no arquivo api/.env.'
        : message,
    });
});
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`API em http://localhost:${port}`));
