# AutoVagas IMD

MVP para consultar os editais em andamento no portal público do IMD/UFRN, resumir página e anexos PDF e alertar pessoas cadastradas via WhatsApp.

## Rodar

```bash
cd api
npm install
npm start
```

Abra `http://localhost:3000`.

## Configuração do WhatsApp

1. Crie uma aplicação no WhatsApp Cloud API da Meta e um template de mensagem aprovado, com **uma variável no corpo** (`{{1}}`).
2. Copie `api/.env.example` para `api/.env` e preencha `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` e `WHATSAPP_TEMPLATE_NAME`.
3. Carregue as variáveis de ambiente antes de iniciar a API. Em produção, use o gerenciador de segredos da plataforma; não versione o `.env`.

Sem essas variáveis, o cadastro e a busca funcionam, mas o sistema não envia mensagem. Com `EDITAIS_POLL_MINUTES` definido (mínimo de 5), a API verifica periodicamente novos editais e só envia os que ainda não foram entregues à pessoa.

## Endpoints

- `GET /api/editais`: consulta os editais em andamento.
- `POST /api/inscricoes`: cria/atualiza um cadastro com consentimento.
- `DELETE /api/inscricoes/:id`: interrompe os alertas.
- `POST /api/admin/atualizar-notificacoes`: dispara a checagem manual (header `x-api-key`).

Os dados vêm de [Editais do IMD](https://www.imd.ufrn.br/portal/editais). A síntese é automática e não substitui a leitura do edital e de seus anexos oficiais.
