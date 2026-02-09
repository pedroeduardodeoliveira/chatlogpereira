# WhatsApp Bot com Google Sheets 🤖

Bot de WhatsApp integrado com Google Sheets que responde automaticamente mensagens baseado em dados de uma planilha.

## 📋 Funcionalidades

- ✅ Conexão via QR Code no terminal
- ✅ Status de conexão em tempo real
- ✅ Log detalhado de todas as mensagens recebidas
- ✅ Indicação se cada mensagem foi respondida
- ✅ Busca automática de respostas na planilha Google Sheets
- ✅ Mensagem padrão quando não encontra resposta
- ✅ Deploy pronto para Dokploy

## 🚀 Deploy no Dokploy

### 1. Configurar Variáveis de Ambiente

No Dokploy, configure as seguintes variáveis de ambiente:

```
GOOGLE_SHEET_ID=sua_planilha_id_aqui
GOOGLE_SHEET_TAB=Sheet1
GOOGLE_CLIENT_EMAIL=seu_email_service_account@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSua chave privada aqui\n-----END PRIVATE KEY-----\n"
PORT=5002
```

### 2. Estrutura da Planilha

Sua planilha deve ter 2 colunas:

- **Coluna A**: Mensagem que o usuário vai enviar
- **Coluna B**: Resposta que o bot vai enviar

Exemplo:

| Coluna A | Coluna B |
|----------|----------|
| Olá | Olá! Como posso ajudar? |
| Preço | Nossos preços começam em R$ 100 |
| Horário | Atendemos de segunda a sexta, 9h às 18h |

### 3. Obter Credenciais do Google Sheets

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API do Google Sheets
4. Crie uma Service Account
5. Baixe o arquivo JSON com as credenciais
6. Compartilhe sua planilha com o email da Service Account

### 4. Deploy

1. Faça push do código para seu repositório Git
2. No Dokploy, crie um novo serviço
3. Conecte ao seu repositório
4. Configure as variáveis de ambiente
5. Deploy!

### 5. Conectar WhatsApp

Após o deploy, acesse os logs do Dokploy. Você verá um QR Code no terminal. Escaneie com seu WhatsApp para conectar o bot.

## 📊 Logs

O bot exibe logs detalhados:

```
📨 MENSAGEM RECEBIDA
⏰ Horário: 09/02/2026 16:30:45
👤 De: 5511999999999@c.us
💬 Mensagem: Olá
✅ Resposta encontrada: Olá! Como posso ajudar?
📤 Resposta enviada com sucesso
📊 Total de mensagens processadas: 1
```

## 🛠️ Desenvolvimento Local

### Instalação

```bash
npm install
```

### Configurar .env

Copie `.env.example` para `.env` e preencha as variáveis:

```bash
cp .env.example .env
```

### Executar em Desenvolvimento

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
whatsapp-bot-sheets/
├── src/
│   ├── services/
│   │   └── googleSheets.ts    # Serviço de integração com Google Sheets
│   ├── bot.ts                 # Lógica principal do bot
│   └── index.ts               # Ponto de entrada
├── Dockerfile                 # Configuração Docker para Dokploy
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔧 Tecnologias

- TypeScript
- whatsapp-web.js
- Google Sheets API
- Express (health check)
- Docker

## ⚠️ Observações

- O bot responde apenas mensagens privadas (não grupos)
- A busca é case-insensitive (não diferencia maiúsculas/minúsculas)
- A primeira linha da planilha é ignorada (header)
- Apenas linhas com ambas colunas preenchidas são consideradas

## 📝 Licença

ISC
