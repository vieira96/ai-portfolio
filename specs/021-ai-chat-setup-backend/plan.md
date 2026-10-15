# PLAN: Chat IA — instalar as necessidades

## Status

`READY`

## Source Spec

`specs/021-ai-chat-setup-backend/spec.md` (APPROVED)

## 1. Implementation Strategy

Instalar as 6 dependências, tornar `REDIS_URL` lida e obrigatória, criar model + migration `chat_message`, e registrar um módulo `chat` mínimo (gateway base sem handlers + fila configurada contra o Redis). Prova: boot conecta no Redis, `socket.io-client` conecta no gateway, tabela existe, suíte verde com Redis efêmero. Nenhum comportamento de negócio, nenhum frontend, nenhuma porta nova.

## 2. Existing Components to Reuse

Somente reais:

- Serviço `redis` do compose (rodando, ocioso) + valor `redis://localhost:6379` já no `.env.example`.
- `backend/src/config/env.validation.ts` (padrão Zod + falha na subida, mesmo regime das `OLLAMA_*`).
- Prisma fragmentado (`backend/prisma/schema/<dominio>/*.prisma`) + `migrate deploy` no helper e2e (a nova migration entra de graça).
- `GenericContainer` do testcontainers (padrão do Postgres efêmero) para Redis efêmero.
- `AppModule` (registro), `main.ts`/`Scalar` (intocados), `PinoLogger` se log for necessário (sem segredo).

## 3. Components Affected

- `backend/package.json` + lockfile (6 deps).
- `backend/.env.example` (+ `.env` local): `REDIS_URL` marcada como lida/obrigatória.
- `backend/src/config/env.validation.ts` + `env.validation.spec.ts`.
- Novo `backend/prisma/schema/chat/chat.prisma` + migration nova.
- Novo `backend/src/modules/chat/` (module, gateway base, wiring da fila).
- `backend/src/app.module.ts` (registrar módulo) + `backend/src/main.ts` (só o `IoAdapter`).
- `backend/docker/docker-compose.yml`: `REDIS_URL: redis://redis:6379` no `environment` do backend (espelhando o padrão do `DATABASE_URL`; `.env` segue com localhost para host).
- Novo e2e do setup (boot + conexão socket + tabela).

## 4. Backend Changes

```text
backend/src/modules/chat/
├── chat.module.ts
├── chat.e2e-spec.ts
└── gateways/
    └── chat.gateway.ts       (@WebSocketGateway base, sem handlers)
```

- Deps: `socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `bullmq`, `@nestjs/bullmq`, `ioredis` (+ `socket.io-client` como devDependency, só para o e2e conectar de verdade).
- `ChatModule`: `BullModule.forRootAsync` (conexão via `ConfigService.getOrThrow('REDIS_URL')`) + `registerQueue({ name: 'chat-generation' })`; `providers: [ChatGateway]`; sem controllers, sem services de negócio, sem exports além do necessário.
- `ChatGateway`: `@WebSocketGateway()` vazio (aceita conexão, nada mais — BR-01).
- `main.ts`: `app.useWebSocketAdapter(new IoAdapter(app))` (2 linhas, import + registro).
- Prisma (`backend/prisma/schema/chat/chat.prisma`, espelhando os arquivos por domínio):
```prisma
model ChatMessage {
  id        String            @id @default(uuid())
  visitorId String
  question  String
  answer    String?
  status    ChatMessageStatus @default(pending)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
}
enum ChatMessageStatus {
  pending
  done
  failed
}
```
- `REDIS_URL`: `z.url(...)` obrigatória, sem default (TD-04).

## 5. Frontend Changes

Nenhuma.

## 6. Database Changes

Só a tabela `chat_message` via migration versionada. Sem índices além da PK (SPEC). E2E a recebe via `migrate deploy` automático do helper.

## 7. API Changes

Nenhuma rota ou evento novo.

## 8. Authorization / Security Implementation

Nada novo (sem canal de negócio). Deps oficiais; socket na mesma porta do HTTP (padrão), sem porta publicada; sem segredo em log.

## 9. Performance / Concurrency Requirements

Sem exigência (setup sem tráfego).

## 10. Error Handling

Padrão existente: Zod aborta boot sem `REDIS_URL`; falha de conexão com Redis no boot é erro explícito (não silencioso); resto cai no `GlobalExceptionFilter`.

## 11. Tests Strategy

Testes escritos junto à implementação, colocados como o restante do repo:

- Unit em `env.validation.spec.ts`: `REDIS_URL` ausente/inválida rejeitada (AC-06).
- E2E `chat.e2e-spec.ts` (padrão `setupTestApp`/`teardownTestApp`): Redis efêmero via `GenericContainer('redis:7-alpine')` com URL definida **antes** do `setupTestApp` (a validação roda no import do `AppModule`); o helper preserva valor pré-definido e o restaura depois, e o spec limpa a própria var no `afterAll`. Cenários: boot sem erro com Redis conectado (AC-02), `socket.io-client` conecta no gateway (AC-03, subindo o `httpServer` em porta efêmera no próprio spec, pois o helper não dá `listen`), escrita+leitura+limpeza de uma linha `chat_message` (AC-04), tudo sem Ollama, sem Redis com dados e sem rede externa.
- Validação: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`, `npm ci` limpo (AC-01), `prisma migrate status` limpo, prova de abort sem `REDIS_URL` via container one-off (mesmo método da 020).

## 12. Documentation Updates

- `backend/.env.example`: `REDIS_URL` como lida/obrigatória.

## 13. Implementation Order

1. `npm install` das 6 deps (FR-01/FR-02, AC-01).
2. `REDIS_URL` no schema + example + `.env` local + casos no `env.validation.spec.ts` (FR-03, AC-06).
3. Model + migration + `prisma validate/generate` (FR-04, AC-04).
4. Módulo `chat` (gateway base + fila) + registro no `AppModule` (FR-05, AC-02/AC-03).
5. E2E do setup + prova de abort sem `REDIS_URL` (FR-06, AC-05/AC-06).
6. Cadeia final: lint + tsc + `npm test` + build + `npm ci` + `migrate status`.

## 14. Technical Decisions

### TD-01 — Stack Socket.IO

Problema: qual socket. Decisão: `socket.io` + `@nestjs/websockets` + `@nestjs/platform-socket.io` (reconexão + rooms para filtrar por visitante). Motivo: rooms resolvem o filtro do canal sem código custom; reconexão cobre espera longa com queda de rede. Trade-off: protocolo próprio (cliente `socket.io-client` nos testes).

### TD-02 — BullMQ + ioredis

Problema: qual fila. Decisão: `bullmq`/`@nestjs/bullmq` + `ioredis`. Motivo: nativo do Nest; Redis já no compose ocioso; zero infra nova. Trade-off: driver e broker reais em vez de fila em Postgres (que misturaria transporte com dado de negócio).

### TD-03 — Redis efêmero no e2e

Problema: como provar conexão sem estado. Decisão: testcontainers (`redis:7-alpine`), padrão do Postgres efêmero. Motivo: CI-safe, sem sujeira entre execuções. Trade-off: container extra por execução do e2e (segundos, aceitável).

### TD-04 — `REDIS_URL` obrigatória sem default

Problema: falhar cedo ou assumir localhost. Decisão: obrigatória (`z.url`, sem default). Motivo: fail fast (AC-06), mesmo regime das `OLLAMA_*`. Trade-off: todo ambiente (dev/CI) precisa da var — o e2e a injeta, o compose/.env a fornecem.

### TD-05 — Redis de teste: default no helper, efêmero no spec do chat

Problema: todas as suítes precisam passar no Zod (CI sem `.env`), mas o e2e do chat precisa de Redis de verdade. Decisão: helper gerencia a chave com default dummy (save/restore, como `OLLAMA_*`); o `chat.e2e-spec.ts` define a URL efêmera antes do `setupTestApp` (o helper preserva valor pré-definido) e limpa a própria var no `afterAll`. Motivo: default cobre todas as suítes; efêmero serve só onde há conexão real. Trade-off: convenção "pré-definido vence" documentada no helper.

### TD-06 — Nome da fila `chat-generation`

Problema: identificar a fila. Decisão: constante `chat-generation` no módulo. Motivo: um job por pergunta válida, nome único e reversível. Trade-off: nenhum relevante.

### TD-07 — Módulo `chat` novo em vez de estender `ai`

Problema: onde mora gateway + fila. Decisão: `src/modules/chat/` novo; `ai` segue como fundação (provider/health). Motivo: motivos de mudança distintos (transporte/fila vs modelo/health). Trade-off: módulo a mais, cada um coeso.

## 15. Things We Will NOT Do

- Handlers, eventos, worker, validação de pergunta, persistência de pendente, stream, contrato (tudo da 022).
- Retry/backoff custom, Bull Board, prioridades, agendamento.
- Outras migrations, índices além da PK, seed.
- Frontend, novas portas, redesenho do helper e2e, README.
- `main.ts` além do registro do `IoAdapter` (gateway Socket.IO exige o adapter explícito; default do Nest é `ws`).

---

## Final Review

### Consistency

`PASSED`

### Checked

- [x] compatibilidade com SPEC
- [x] compatibilidade com projeto real
- [x] arquitetura revisada
- [x] banco revisado
- [x] segurança revisada
- [x] estratégia de testes revisada
- [x] overengineering revisado

### Deviations from SPEC

Adição estrita de detalhe, sem mudar comportamento: `socket.io-client` como devDependency (a SPEC lista as deps de runtime; o e2e exige um cliente real e o pacote do servidor não o inclui).

### Known Risks

- Resolução de versões no install (majors novos com breaking): mitigado por revisão do diff do lockfile antes de commitar.
- `registerQueue` sem worker nesta SPEC: fila criada, nenhum consumidor — esperado (consumidor é a 022); sem mensagem acumulada porque nada publica ainda.

### Review Result

`PLAN consistente com a SPEC aprovada e com o estado atual conhecido do projeto.`
