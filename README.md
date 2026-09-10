# AutoVagas

Plataforma para descobrir vagas automaticamente, organizada em Angular (`web/`) e Express + TypeScript + PostgreSQL (`api/`). A identidade visual do MVP foi preservada, enquanto a base passou a incluir autenticação e integrações por conta.

## Primeira execução

1. Crie um banco PostgreSQL chamado `autovagas`.
2. Copie `api/.env.example` para `api/.env` e informe uma `DATABASE_URL` e um `JWT_SECRET` longo.
3. Em `api/`, execute `npm install`, `npm run migrate` e `npm run dev`. Em Node.js 22, os scripts — incluindo o bootstrap legado `node bin/www` — usam o repositório de certificados do sistema para acessar o portal do IMD com HTTPS validado.
4. Em outro terminal, em `web/`, execute `npm install` e `npm start`.

Abra `http://localhost:4200`. A API fica em `http://localhost:3000/api`.

## Arquitetura

- A lista de vagas é pública; login/cadastro usam senha hasheada e JWT.
- Configurações protegidas preparam a conexão WhatsApp vinculada à conta autenticada.
- O crawler Jerimum Jobs descobre URLs a partir da listagem, usa HTTP + Cheerio e regras determinísticas; snapshots SHA-256 impedem reprocessamento desnecessário.
- As migrations PostgreSQL ficam isoladas por entidade em `api/src/infrastructure/database/migrations`.

Os documentos de contexto na raiz explicam as convenções permanentes. Rode `npm run build` e `npm test` dentro de `api/`, e `npm run build` dentro de `web/` antes de publicar.
