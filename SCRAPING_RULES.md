# Regras de coleta

1. Descubra vagas na página de listagem; nunca enumere URLs ou IDs.
2. Faça HTTP com timeout, User-Agent identificável, retries limitados e baixa concorrência. Headless é futuro fallback, não padrão.
3. Extraia primeiro JSON-LD/Schema.org e metatags; depois DOM semântico, headings, listas e pares label/valor.
4. Normalize seções (`requirements`, `benefits`, `responsibilities`) e aplique regras determinísticas independentes. Cada campo informa valor, confiança e evidência.
5. Calcule SHA-256 de conteúdo normalizado. Sem mudança: só atualize `last_seen_at`; com mudança: crie snapshot e reextraia.
6. O crawler nunca escreve no banco: ele chama `ImportJobUseCase`. Falhas por vaga são registradas e não interrompem a execução.

Fixtures locais são obrigatórias para testes do parser. Respeite as políticas e limitações técnicas da origem.
