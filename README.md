# AutoVagas IMD

MVP para consultar os editais em andamento no portal público do IMD/UFRN, resumir página e anexos PDF e alertar pessoas cadastradas via WhatsApp.

## Rodar

```bash
cd api
npm install
$env:WHATSAPP_BOT_ENABLED = "true"
$env:EDITAIS_POLL_MINUTES = "60"
npm start
```

Abra `http://localhost:3000`. No primeiro uso, será exibido um QR Code no terminal. Escaneie-o com o número dedicado ao bot em **WhatsApp > Aparelhos conectados**. A sessão fica em `api/data/whatsapp-session`, que não deve ser versionada ou compartilhada.

## Como o bot envia

A conexão usa a biblioteca Baileys, que interage com o WhatsApp Web por QR Code. Assim que está conectado, o sistema envia uma mensagem de texto por edital ao número cadastrado. Não há token, template ou conta da WhatsApp Cloud API.

> Esta é uma integração não oficial. Use um número exclusivo para o bot, obtenha consentimento das pessoas cadastradas, evite disparos em massa e esteja ciente de que alterações no WhatsApp Web ou suas regras podem interromper a conexão ou restringir o número.

## Endpoints

- `GET /api/editais`: consulta os editais em andamento.
- `GET /api/status`: informa o estado do bot.
- `POST /api/inscricoes`: cria/atualiza um cadastro com consentimento.
- `DELETE /api/inscricoes/:id`: interrompe os alertas.
- `POST /api/admin/atualizar-notificacoes`: dispara a checagem manual (header `x-api-key`).

Os dados vêm de [Editais do IMD](https://www.imd.ufrn.br/portal/editais). A síntese é automática e não substitui a leitura do edital e de seus anexos oficiais.
