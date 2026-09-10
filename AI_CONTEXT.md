# AutoVagas — contexto permanente

## Estado analisado em 2026-09-10

O projeto original é um MVP Express em `api/`, com uma página estática em `api/public`. Ele consulta editais do IMD/UFRN, lê anexos PDF e envia alertas via uma sessão Baileys do WhatsApp. Os cadastros são guardados em JSON local. Não há autenticação, banco de dados, TypeScript nem frontend Angular.

### Telas e padrões preservados

Há uma única tela: hero, seleção de fontes, formulário de alertas, explicação em três passos e lista filtrável de oportunidades. Esta estrutura editorial, sua linguagem e a identidade visual descrita em `DESIGN_SYSTEM.md` são a fonte de verdade da reconstrução.

### Limitações encontradas

- O scraper depende de regex e de classes/URLs específicas do portal de editais e mistura coleta, parsing de PDFs e regras de negócio.
- O armazenamento JSON não oferece concorrência, auditoria, relacionamento nem controle de acesso.
- As rotas misturam HTTP, notificações e regras de domínio.
- A sessão WhatsApp é global ao processo e não pertence a uma conta autenticada.

## Decisões atuais

- `api/` passa a conter Express + TypeScript + PostgreSQL. Até a migração determinística do IMD estar concluída, as rotas compatíveis de fontes, vagas e alertas continuam usando o coletor JavaScript original, que é a fonte principal do produto.
- `web/` contém Angular standalone e mantém a composição e o design da página antiga.
- Contas autenticadas usam JWT enviado como Bearer token. A integração WhatsApp será modelada em etapa futura, depois da definição de seus fluxos.
- A primeira fonte nova é Jerimum Jobs, descoberta pela página de listagem e processada deterministicamente. O IMD legado não é reaproveitado como parser.

Consulte este arquivo e os documentos especializados antes de mudar arquitetura ou UI.
