# Portfolio AI Agent

Portfólio profissional com área pública, dashboard administrativo e chat com
IA. O projeto é dividido em uma API NestJS e uma aplicação Next.js.

## Stack

- Backend: NestJS, TypeScript, Prisma, PostgreSQL, Redis, BullMQ e Vitest
- Frontend: Next.js, React, TypeScript, Tailwind CSS e Vitest
- IA: Ollama ou Groq, com fallback configurável
- Infraestrutura local: Docker Compose

## Arquitetura atual

```text
Browser
   │
   ├── Next.js /api/* ──────► NestJS API ──────► Prisma ──────► PostgreSQL
   │                              │
   │                              ├── Redis / BullMQ
   │                              ├── Ollama ou Groq
   │                              └── Socket.IO para o chat
   │
   └── Chat Socket.IO ──────► NestJS
```

O frontend funciona como BFF para autenticação e operações administrativas.
O widget de chat se conecta diretamente à API para receber eventos em tempo
real. A autenticação usa cookie `httpOnly`; o chat público usa o cookie
anônimo `chat_visitor`.

## Estrutura

```text
.
├── backend/    # API NestJS, Prisma, filas e integrações de IA
├── frontend/   # Aplicação Next.js e interface do portfólio
├── specs/      # SPECs, planos e tarefas das funcionalidades
├── ROADMAP.md  # Próximas etapas e evolução planejada
└── README.md
```

## Como executar

Consulte a documentação específica de cada aplicação:

- [Backend](backend/README.md)
- [Frontend](frontend/README.md)

Em um ambiente local, a API usa a porta `8000` e o frontend usa a porta
`3000`. O Docker Compose de cada aplicação está em sua respectiva pasta
`docker/`.

## Documentação da API

Com o backend em execução:

- Scalar: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

## Desenvolvimento

As mudanças maiores devem ser documentadas em `specs/`, separando requisito,
plano e tarefas. Consulte o [roadmap](ROADMAP.md) para a evolução planejada.

## Validação

Backend:

```bash
cd backend
npm run build
npm run lint
npm run test:unit
```

Integração e E2E usam Testcontainers e precisam de Docker:

```bash
cd backend
npm run test:integration
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
npm test
```
