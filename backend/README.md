# Backend — Portfolio AI Agent

API em **NestJS + TypeScript** do projeto Portfolio AI Agent.
O planejamento de evolução está no [ROADMAP da raiz](../ROADMAP.md).

## Stack

- Node 22 (`backend/.nvmrc`)
- NestJS 12 + TypeScript
- Prisma 7 (`prisma/schema/` separado por módulo) + `pg` + `@prisma/adapter-pg`
- PostgreSQL 16 + Redis 7 (via Docker)
- Auth: `cookie-parser` + `@nestjs/jwt` (cookie httpOnly, 7 dias)
- Upload: `multer` + `@nestjs/serve-static` (`/uploads`)
- Docs: Swagger + Scalar em `/docs` (JSON cru em `/openapi.json`)
- Validação: `class-validator` (pipe global) + Zod (`.env` fail-fast)
- Logs em arquivo (`backend/logs/`, estilo `laravel.log`)
- Testes: Vitest + Testcontainers + supertest

## Arquitetura

```text
Controller (fino) → Service (regra + logs) → Repository (só Prisma) → Postgres
```

- Módulos em `src/modules/<dominio>/` (`controllers/`, `services/`, `repositories/`, `dto/`)
- Infra global em `src/infra/` (`database`, `storage`) — injeta em qualquer módulo
- Config global (`ConfigModule` + Zod, falha no boot sem as vars)
- Erros sempre no formato `{ statusCode, message, timestamp }`
- A IA (futuro) fala com Services via Tools, nunca direto no banco

## Estrutura

```text
backend/
├── src/
│   ├── common/filters/ (erros)
│   ├── config/ (env + logger)
│   ├── infra/database/ (Prisma)
│   ├── infra/storage/ (arquivos)
│   ├── modules/auth/ (login em cookie, guard, /me)
│   ├── modules/uploads/ (upload genérico)
│   ├── modules/users/ (perfil)
│   ├── modules/technologies/ (habilidades: CRUD gerenciado + GET público)
│   ├── modules/projects/ (projetos + skills por upsert, GET paginado público)
│   └── app.module.ts + main.ts
├── prisma/
│   ├── schema/<modulo>/ (1 pasta por domínio)
│   ├── migrations/
│   └── seeds/<modulo>/ (1 seeder por domínio)
├── docker/ (Dockerfile + compose dev)
├── .env(.example) + prisma7.config.ts
└── run-project.sh (setup completo)
```

## Endpoints

Referência viva no Scalar (`/docs`) — o README não lista endpoint (não escala).
Fluxo-chave (ensina o padrão):

```text
POST /auth/login → Set-Cookie httpOnly → GET /auth/me
POST /uploads (multipart file + folder) → { url } → PATCH /users/me { avatarUrl }
POST /projects { skills: [{ name, category }] } → vincula/cria skills → GET /projects?page&size
```

## Variáveis de ambiente

Ver `backend/.env.example`. Obrigatórias: `DATABASE_URL`, `JWT_SECRET` (32+),
`SEED_USER_NAME/EMAIL/PASSWORD`, `OLLAMA_URL`, `OLLAMA_CHAT_MODEL`,
`REDIS_URL`, `CORS_ORIGINS` (uma ou mais origens separadas por vírgula;
`OLLAMA_TIMEOUT_MS` tem default 60000). Opcionais: `GROQ_API_KEY`
(sem ela, segue só Ollama; `GROQ_MODEL` e `GROQ_TIMEOUT_MS` têm defaults),
perfil do seed, `APP_URL`, `NODE_ENV`.

## Como rodar

```bash
cd backend
./run-project.sh   # install, .env, Postgres, pgcrypto, migrate, seed, backend
```

Manual: `nvm use` → `cp .env.example .env` → `npm install` → `docker compose -f docker/docker-compose.yml up -d` → `npx prisma migrate dev`.

IA (Ollama + Qwen, modelo persiste no volume `ollama-data`):

```bash
docker compose -f docker/docker-compose.yml up -d ollama
docker exec docker-ollama-1 ollama pull qwen2.5:7b
curl http://localhost:11434/api/generate -d '{"model":"qwen2.5:7b","prompt":"ping","stream":false}'
curl http://localhost:8000/ai/health   # {"status":"ok","model":"qwen2.5:7b"}
```

IA (Groq, opcional — resposta em segundos em vez de CPU local):

1. crie a key em `https://console.groq.com/keys` (grátis, sem cartão);
2. configure no `.env`: `GROQ_API_KEY=<sua-key>` (`GROQ_MODEL` e `GROQ_TIMEOUT_MS`
   já têm defaults no `.env.example`);
3. suba/reinicie o backend; com a key presente a cadeia vira `[groq, ollama]`
   (Groq principal, Ollama como fallback só no rate limit); sem ela, só Ollama;
4. confira: `curl http://localhost:8000/ai/health` mostra o modelo ativo.

URLs: API `:8000`, docs `/docs`, Postgres `:5432`, Redis `:6379`, Ollama `:11434`.

Chat: envio por REST, tempo real por Socket.IO push-only, cookie anônimo
`chat_visitor` (fixado via `Set-Cookie` na primeira abertura) filtra por visitante:

```text
POST /chat/messages { message } → 201 { id, status: pending } (inválida: 200 { answer })
GET  /chat/messages?page&size   → histórico só do dono, em ordem
← chat:token    { delta }        (pedaço, só geração real)
← chat:done     { answer }       (texto completo; sem conclusão não há resposta)
← chat:error    { code, message } (MODEL_UNAVAILABLE | TIMEOUT; fila: 503 QUEUE_UNAVAILABLE no POST)
```

Verificação com cliente qualquer (REST + socket):

```bash
curl -c jar.txt -b jar.txt -X POST http://localhost:8000/chat/messages \
  -H 'Content-Type: application/json' -d '{"message":"onde você trabalhou com NestJS?"}'
```

```js
import { io } from 'socket.io-client';
// mesma sessão do curl: encaminhe o cookie chat_visitor (no browser vai sozinho)
const socket = io('http://localhost:8000', {
  extraHeaders: { Cookie: 'chat_visitor=<uuid-do-jar.txt>' },
});
socket.on('chat:token', ({ delta }) => process.stdout.write(delta));
socket.on('chat:done', () => console.log('\nPRONTO'));
socket.on('chat:error', (e) => console.error('ERRO:', e.code));
```

## Scripts

```bash
npm run build
npm run start:dev
npm run test:unit                 # unitários, sem Docker
npm run test:integration          # Testcontainers, precisa Docker
npm run test:e2e                  # Testcontainers, precisa Docker
npm run db:seed
npx prisma validate
npx prisma generate
tail -f logs/app-$(date +%F).log  # logs estilo laravel.log
```

## Testes

- Unit co-locado (`*.spec.ts`, mocks `vi.fn()` — o "Mockito" daqui)
- Integração co-locada (`*.integration.spec.ts`, Postgres efêmero)
- E2E co-locado (`*.e2e-spec.ts`, app real + supertest + cookie jar)
