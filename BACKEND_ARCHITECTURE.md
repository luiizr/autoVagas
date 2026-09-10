# Backend architecture

`api/src` usa Clean Architecture pragmática:

`HTTP controller → use case → repository → PostgreSQL`.

Entidades e contratos moram em `domain`; decisões de negócio em `application`; Express, PostgreSQL, scraper e scheduler em `infrastructure`; composição em `main`. Controllers validam entrada e traduzem HTTP, sem regras de negócio.

Rotas públicas: `GET /api/jobs`, `GET /api/jobs/:id`, `GET /api/jobs/search`, `GET /api/sources`. Rotas de autenticação: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`. A futura integração WhatsApp será desenhada antes de receber entidades ou endpoints próprios.
