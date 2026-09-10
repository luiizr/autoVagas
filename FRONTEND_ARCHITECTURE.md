# Frontend architecture

`web/` é uma aplicação Angular standalone, organizada por feature. Páginas ficam em `features/*/pages`, blocos específicos em `components` da feature e componentes compartilhados estritamente reutilizáveis em `shared/ui`.

Todo componente possui `.ts`, `.html` e `.scss` próprios: sem templates ou estilos inline. `core` contém cliente HTTP, interceptors, guards, layout e sessão. Rotas são lazy-loaded. A API é acessada por `/api` em desenvolvimento via proxy.

Autenticação é voluntária para navegar pelas vagas e obrigatória somente para configurações e integrações. Isso preserva a página pública existente enquanto viabiliza WhatsApp por usuário.
