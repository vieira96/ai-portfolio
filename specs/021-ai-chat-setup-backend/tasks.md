# TASKS: Chat IA — instalar as necessidades

## Status

`READY_FOR_IMPLEMENTATION`

## Sources

SPEC:
`specs/021-ai-chat-setup-backend/spec.md`

PLAN:
`specs/021-ai-chat-setup-backend/plan.md`

---

## Tasks

### [x] TASK-01 — Instalar dependências de socket e fila

#### Objective

As 7 dependências instaladas com lockfile consistente.

#### Requirements

- FR-01
- FR-02

#### Acceptance Criteria

- AC-01

#### Depends On

`Nenhuma`

#### Implementation Notes

`npm install` (runtime): `socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `bullmq`, `@nestjs/bullmq`, `ioredis`; (dev) `socket.io-client` só para o e2e. Revisar o diff do lockfile antes de commitar (risco registrado no PLAN).

#### Definition of Done

- `npm ci` limpo com as 7 no lockfile.
- `npm run lint` + `npx tsc --noEmit` verdes (só adição de deps, sem código ainda).

---

### [x] TASK-02 — `REDIS_URL` lida e validada

#### Objective

Sem `REDIS_URL` válida o backend nem sobe.

#### Requirements

- FR-03

#### Acceptance Criteria

- AC-06

#### Depends On

- TASK-01

#### Implementation Notes

Schema Zod: `REDIS_URL` obrigatória em formato de URL, sem default (TD-04). `.env.example` marca como lida/obrigatória; `.env` local atualizado. Casos em `env.validation.spec.ts` (ausente/inválida rejeitadas). Prova de abort via container one-off (método da 020).

#### Definition of Done

- Boot aborta com mensagem Zod clara sem a var; sobe com ela.
- `env.validation.spec.ts` verde; `lint` + `tsc` verdes.

---

### [x] TASK-03 — Tabela `chat_message` via migration

#### Objective

`chat_message` existe com as colunas da SPEC §10.

#### Requirements

- FR-04

#### Acceptance Criteria

- AC-04

#### Depends On

- TASK-02

#### Implementation Notes

Novo `backend/prisma/schema/chat/chat.prisma` (model + enum, espelhando os arquivos por domínio); `prisma migrate dev` + `prisma validate` + `prisma generate`. Sem índices além da PK.

#### Definition of Done

- `migrate status` limpo; tabela com as colunas da SPEC.
- `lint` + `tsc` verdes.

---

### [x] TASK-04 — Módulo `chat` com gateway base e fila

#### Objective

Boot conecta no Redis e socket aceita conexão, sem nenhum comportamento de negócio.

#### Requirements

- FR-05
- BR-01

#### Acceptance Criteria

- AC-02
- AC-03

#### Depends On

- TASK-03

#### Implementation Notes

`src/modules/chat/`: `chat.module.ts` (`BullModule.forRootAsync` via `REDIS_URL` + `registerQueue({ name: 'chat-generation' })`, `ChatGateway` como provider), `gateways/chat.gateway.ts` (`@WebSocketGateway()` sem handlers — BR-01), registro no `AppModule`. Prova manual: boot sem erro de Redis + `socket.io-client` conectando (vira e2e na TASK-05).

#### Definition of Done

- Backend sobe sem erro com Redis conectado; cliente conecta no gateway.
- `lint` + `tsc` verdes; nenhuma rota/evento de negócio novo.

---

### [x] TASK-05 — E2E do setup com Redis efêmero

#### Objective

Suíte prova boot, conexão socket e tabela sem serviços com dados.

#### Requirements

- FR-06

#### Acceptance Criteria

- AC-05

#### Depends On

- TASK-04

#### Implementation Notes

`src/modules/chat/chat.e2e-spec.ts`: `GenericContainer('redis:7-alpine')` com URL definida antes do `setupTestApp` (o helper preserva valor pré-definido e o restaura; o spec limpa a própria var no `afterAll` — TD-05); `httpServer` em porta efêmera para o `socket.io-client`; cenários AC-02/AC-03/AC-04 (boot, conexão, escrita+limpeza de uma linha). Sem Ollama, sem Redis com dados, sem rede externa, sem timing real.

#### Definition of Done

- `npm test` (unit + integração + e2e) verde.

---

### [x] TASK-06 — Validação final

#### Objective

Fechar o setup com todas as provas + cadeia verde.

#### Requirements

- FR-01
- FR-02
- FR-03
- FR-04
- FR-05
- FR-06
- BR-01

#### Acceptance Criteria

- AC-01
- AC-02
- AC-03
- AC-04
- AC-05
- AC-06

#### Depends On

- TASK-05

#### Implementation Notes

Revisitar cada AC (provas automatizadas ou manuais referenciadas). Cadeia: `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` + `npm ci` + `prisma migrate status`.

#### Definition of Done

- Todas as AC-01..AC-06 verificadas.
- Cadeia completa verde; docs (`.env.example`) atualizadas.
- Nenhuma rota/evento de negócio; nenhum segredo em log.

---

## Final Review

### Consistency

`PASSED`

### Checked

- [x] cobertura da SPEC revisada
- [x] cobertura do PLAN revisada
- [x] dependências entre TASKS revisadas
- [x] referências FR/BR/AC revisadas
- [x] Definition of Done revisadas
- [x] escopo revisado
- [x] nenhuma TASK nasceu concluída
- [x] ordem de execução revisada

### Uncovered Requirements

`Nenhum.`

### Orphan Tasks

`Nenhuma.`

### Review Result

`TASKS consistentes com SPEC + PLAN e prontas para execução.`

## Implementation Handoff

Fontes:

SPEC:
`specs/021-ai-chat-setup-backend/spec.md`

PLAN:
`specs/021-ai-chat-setup-backend/plan.md`

TASKS:
`specs/021-ai-chat-setup-backend/tasks.md`

Todos os documentos passaram por revisão documental.

Na implementação:

1. reler SPEC;
2. reler PLAN;
3. reler TASKS;
4. confirmar que o projeto não mudou de forma incompatível;
5. executar as TASKS em ordem;
6. marcar tasks concluídas somente após validar sua Definition of Done.

Se existir conflito entre documentação e projeto real:

PARE e informe.
