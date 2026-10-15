# SPEC (backend): Chat IA — instalar as necessidades (dependências, fila, banco, socket base)

## Status

`APPROVED`

## 1. Context

A fundação de IA está pronta (spec 020): Ollama + Qwen no compose, `LlmProvider`, `GET /ai/health`, suíte verde sem modelo no CI. O chat (spec 022) precisa de três coisas que não existem: dependências de socket e fila, leitura do Redis pelo backend e a tabela de mensagens. Esta SPEC instala e prova exatamente isso — sem nenhum comportamento de conversa.

## 2. Requested Feature

Escopo: backend. Instalar o necessário ao chat e provar que funciona: deps de socket e fila, `REDIS_URL` validada, tabela `chat_message` migrada, módulos registrados, boot com Redis conectado e socket aceitando conexão.

## 3. Goal

Com `npm ci` + migrate + boot: a aplicação sobe, o BullMQ conecta no Redis do compose, um cliente `socket.io-client` conecta no gateway base, a tabela `chat_message` existe, e a suíte segue verde.

## 4. Current System

Somente componentes reais:

- Fundação 020: `OLLAMA_*` validadas, `backend/src/modules/ai/` com provider + health, compose com `ollama`, `postgres`, `redis` (ocioso).
- `backend/src/config/env.validation.ts` (Zod, falha na subida); `REDIS_URL` existe só no `.env.example`, não é lida.
- `backend/package.json` sem `socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `bullmq`, `@nestjs/bullmq`, `ioredis`; sem código de socket, fila ou gateway em `src/`.
- Prisma com schema fragmentado (`backend/prisma/schema/*`) e migrations versionadas; e2e sobe Postgres efêmero via testcontainers em `backend/test/helpers/e2e-setup.helper.ts`.
- `GET /ai/health` e CRUDs funcionando; Scalar em `/docs`.

## 5. Existing Behavior

Nada muda no comportamento existente: mesmas rotas, mesmos formatos, mesmos testes passando. Esta SPEC só adiciona capacidade instalada.

## 6. Functional Requirements

### FR-01 — Dependências de socket instaladas

Instalar `socket.io`, `@nestjs/websockets` e `@nestjs/platform-socket.io` (versões resolvidas no install, travadas no lockfile).

**Por que precisa:** Socket.IO por reconexão + rooms para filtrar o canal por visitante; adaptador oficial do Nest, sem ele não há gateway.

### FR-02 — Dependências de fila instaladas

Instalar `bullmq`, `@nestjs/bullmq` e `ioredis` (versões resolvidas no install, travadas no lockfile).

**Por que precisa:** BullMQ por ser nativo do Nest; `ioredis` como driver. Validado que nada disso existe — é a primeira peça async do backend.

### FR-03 — `REDIS_URL` lida e validada

`REDIS_URL` entra no schema Zod (`backend/src/config/env.validation.ts`) como obrigatória e segue documentada no `.env.example` (valor `redis://localhost:6379` no example; compose já resolve o host real como faz com o banco). Sem ela válida, o backend aborta na subida como as demais obrigatórias.

**Por que precisa:** primeira vez que o backend LÊ o Redis (hoje a var é enfeite no example). Sem validação, Redis parado vira falha misteriosa no primeiro job em vez de erro claro no boot.

### FR-04 — Tabela `chat_message` criada via migration

Model Prisma + migration aplicada: mensagem com identificador anônimo do visitante (texto opaco, para filtrar o canal), pergunta, resposta (nulável), status (`pending` → `done` | `failed`) e timestamps. Sem threads, sem conversas: uma linha por pergunta.

**Por que precisa:** a spec 022 persiste pendente por pergunta; sem tabela e migration versionada, a implementação não tem onde escrever. Schema primeiro, comportamento depois.

### FR-05 — Módulos registrados e boot prova a instalação

Registrar o módulo de chat (gateway base sem handlers de negócio + fila configurada contra o Redis) no `AppModule`. Prova: a aplicação sobe sem erro, o BullMQ conecta no Redis, e um cliente `socket.io-client` conecta no gateway base com sucesso.

**Por que precisa:** "instalado" sem prova é suposição. Boot + conexão provam wiring real (deps, config, Redis, socket) antes de qualquer comportamento existir — quando a 022 chegar, ela sobe em terreno provado.

### FR-06 — Suíte verde com Redis efêmero no e2e

E2E do setup (boot + conexão socket) usa Redis efêmero via testcontainers, no mesmo padrão do Postgres efêmero já usado; nada depende de Redis com dados, Ollama real ou timing real.

**Por que precisa:** teste que depende de serviço local com estado é teste quebrado no CI. Redis efêmero prova a conexão de verdade sem sujeira entre execuções.

## 7. Business Rules

### BR-01 — Nenhum comportamento novo exposto

O gateway base não responde nenhum evento de negócio; nenhuma rota nova; health e CRUDs intactos.

**Por que:** setup instala capacidade, não produto. Qualquer evento de negócio aqui seria implementação contrabandeada para dentro da instalação.

## 8. User Flow

1. Dev executa `npm install` (ou `npm ci`), `prisma migrate` e sobe o compose.
2. Backend sobe sem erro com Redis conectado.
3. Cliente `socket.io-client` conecta no gateway base.
4. `chat_message` existe no banco (`prisma migrate status` limpo).

## 9. API Contract

Nenhuma rota ou evento novo. O gateway base aceita conexão sem handlers de negócio (o contrato de eventos é todo da spec 022).

## 10. Data Requirements

Model `chat_message`: `id` (uuid), `visitorId` (texto opaco do cookie anônimo), `question` (texto), `answer` (texto, nulável até concluir), `status` (enum `pending` | `done` | `failed`), `createdAt`, `updatedAt`. Migration gerada e aplicada, versionada como as demais. Sem índices além da chave primária (volume não justifica; sem overengineering de índice).

## 11. Validation

`REDIS_URL` obrigatória e em formato de URL no schema Zod (FR-03); falha na subida sem ela. Demais validações existentes intactas.

## 12. Authorization

Nada novo: nenhum canal de negócio existe ainda (autorização do chat é toda da spec 022).

## 13. Error Scenarios

- Sem `REDIS_URL` válida → boot aborta com mensagem Zod clara, antes de qualquer request.
- Redis parado no boot → erro explícito de conexão (não silencioso, não retry infinito travando a subida sem log).
- Migration pendente → `prisma migrate` acusa; app não sobe em schema divergente (comportamento padrão do fluxo existente).

## 14. Security Requirements

- Dependências oficiais (`socket.io`, `@nestjs/*`, `bullmq`, `ioredis`); sem fork, sem pacote desconhecido.
- Socket compartilha a porta do HTTP (padrão Socket.IO/Nest) — nenhuma porta nova publicada no compose.
- Sem segredo em log de boot/conexão.

## 15. Performance / Concurrency Requirements

Sem exigência: setup não tem tráfego. (Concorrência da fila é assunto da 022.)

## 16. Tests / Expected Behaviors

- E2E do setup: boot com Redis efêmero + conexão `socket.io-client` aceita; sem `REDIS_URL` o boot aborta (via spec de `env.validation`, padrão existente).
- Ambiente de teste: o helper injeta `REDIS_URL` dummy (save/restore) só para o Zod passar no boot, como já faz com `OLLAMA_*`; o e2e do chat sobrescreve com o Redis efêmero antes do setup.
- Migration aplicada no fluxo e2e existente (o helper já roda `migrate deploy` — a nova migration entra de graça).
- `npm test` verde sem Ollama, sem Redis com dados, sem rede externa.

## 17. Documentation Impact

- `backend/.env.example`: `REDIS_URL` documentada como lida/obrigatória (FR-03).
- `backend/package.json` + lockfile com as 6 deps (FR-01/FR-02).

## 18. Acceptance Criteria

### AC-01 — Dependências instaladas e consistentes

Given: repo limpo.
When: `npm ci` no backend.
Then: instala sem erro, com `socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `bullmq`, `@nestjs/bullmq`, `ioredis` no lockfile.

### AC-02 — Boot conecta no Redis

Given: compose com Redis no ar e `REDIS_URL` válida.
When: subir o backend.
Then: sobe sem erro, BullMQ conectado (sem erro de conexão no log).

### AC-03 — Socket aceita conexão

Given: backend do AC-02 no ar.
When: cliente `socket.io-client` conecta.
Then: conexão aceita com sucesso.

### AC-04 — Tabela existe via migration

Given: banco limpo.
When: `prisma migrate deploy` (ou `dev`).
Then: `chat_message` existe com as colunas da §10; `migrate status` limpo.

### AC-05 — Suíte verde

Given: CI sem Ollama, sem Redis com dados, sem rede externa.
When: `npm test` no backend.
Then: tudo verde (unit + integração + e2e, incluindo o e2e do setup com Redis efêmero).

### AC-06 — Sem `REDIS_URL` o boot aborta

Given: `REDIS_URL` ausente/inválida.
When: subir o backend.
Then: aborta com mensagem Zod clara antes de aceitar request.

## 19. Assumptions

### ASSUMPTION-01 — Versões resolvidas no install

Descrição: majors/minors exatos saem do `npm install` e travam no lockfile; a SPEC não pinna números.
Justificativa: pinnar versão na SPEC envelhece no primeiro `npm update`; o que importa é o conjunto (socket.io + adapter + bullmq + ioredis) e o lock versionado.
Impacto caso esteja errada: ajuste de versão sem mudar SPEC.

### ASSUMPTION-02 — Gateway base sem handlers

Descrição: o gateway registrado nesta SPEC aceita conexão e nada mais.
Justificativa: qualquer handler aqui seria comportamento da 022 contrabandeado; a prova é conexão, não conversa.
Impacto caso esteja errada: nenhum — handlers chegam na 022 de qualquer forma.

## 20. Definition of Done

- Deps instaladas e lockfile consistente (AC-01).
- Boot com Redis conectado e socket aceitando conexão (AC-02, AC-03).
- `chat_message` migrada (AC-04); suite verde sem serviços com dados (AC-05); boot aborta sem `REDIS_URL` (AC-06).
- `lint` + `tsc --noEmit` + `npm test` + `build` verdes.
- Nenhuma rota/evento de negócio novo; nenhum segredo em log.

## Final Review

### Consistency

`PASSED`

### Checked

- [x] requisitos revisados
- [x] regras de negócio revisadas
- [x] fluxos revisados
- [x] critérios de aceite revisados
- [x] conflitos com sistema atual revisados

### Remaining Issues

`Nenhuma inconsistência conhecida.`

### Review Result

`SPEC internamente consistente e pronta para aprovação.`
