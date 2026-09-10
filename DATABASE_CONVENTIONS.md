# Convenções PostgreSQL

PostgreSQL usa `snake_case`, UUIDs e timestamps em UTC (`timestamptz`). Chaves estrangeiras são nomeadas `<entidade>_id`; unicidades e índices acompanham a entidade que precisam otimizar.

Cada entidade tem uma migration isolada em `api/src/infrastructure/database/migrations/<timestamp>_<entidade>EntidadePG/{up,down}.sql`. Migrations nunca são editadas depois de aplicadas: crie uma nova pasta para mudanças.

As tabelas iniciais são `users`, `job_sources`, `companies`, `jobs`, `job_snapshots`, `crawl_runs` e `crawler_errors`. WhatsApp, habilidades, benefícios e categorias serão modelados apenas após a definição de seus fluxos e consultas.
