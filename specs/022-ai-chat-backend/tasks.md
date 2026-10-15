# TASKS: Chat IA — implementação

## Status

`READY_FOR_IMPLEMENTATION`

## Sources

SPEC:
`specs/022-ai-chat-backend/spec.md`

PLAN:
`specs/022-ai-chat-backend/plan.md`

Premissa: a 021 está executada (se faltar dep, tabela ou gateway base, parar antes de codar).

---

## Tasks

### [x] TASK-01 — Stream no provider

#### Objective

`LlmProvider` gera em stream sem quebrar o contrato existente.

#### Requirements

- FR-05

#### Acceptance Criteria

- AC-01
- AC-04

#### Depends On

`Nenhuma` (além da premissa da 021)

#### Implementation Notes

`chatStream(prompt): AsyncGenerator<string>` na abstração; `OllamaLlmProvider` com `stream: true` (NDJSON por linhas, mesmo timeout, mesmo mapeamento de erro). `chat()` intacto; testes da 020 seguem passando. Unit nova: chunks em ordem, `stream: true` enviado, corte no meio → erro tipado.

#### Definition of Done

- Unit verde (única + stream); `lint` + `tsc` verdes; nenhuma dep nova.

---

### [x] TASK-02 — Repository + service (validar, persistir, enfileirar, contexto)

#### Objective

Pergunta válida vira pendente + job; inválida vira resposta de assunto inválido; contexto vem dos services.

#### Requirements

- FR-02
- FR-03
- BR-05

#### Acceptance Criteria

- AC-02
- AC-06

#### Depends On

- TASK-01

#### Implementation Notes

`repositories/chat-message.repository.ts` (CRUD simples via `PrismaService`, padrão do repo); `services/chat.service.ts`: validar (limite 2000, vazia), inválida → texto de assunto inválido sem fila/provider; válida → cria pendente com `visitorId` e enfileira (`chat-generation`); enqueue falhando → marca falha + `QUEUE_UNAVAILABLE` (sem órfão); montagem de contexto só via services de domínio (nomes/métodos a confirmar no código). Unit cobrindo cada ramo.

#### Definition of Done

- Unit verde em todos os ramos; `lint` + `tsc` verdes; sem query nova fora dos services.

---

### [x] TASK-03 — Gateway (cookie, rooms, eventos) + processor (worker)

#### Objective

Canal funcional de ponta a ponta: pergunta entra, tokens e conclusão (ou erro) saem no visitante certo.

#### Requirements

- FR-01
- FR-04
- FR-06
- FR-07
- FR-08
- BR-01
- BR-02
- BR-03
- BR-04

#### Acceptance Criteria

- AC-01
- AC-03
- AC-04
- AC-05

#### Depends On

- TASK-02

#### Implementation Notes

`gateways/chat.gateway.ts`: middleware de handshake (cookie `uuid` quando ausente/malformado, polling habilitado), room `visitor:{id}`, handler `chat:send` → service; emissão via `server.to(room).emit` (`chat:answer`, `chat:token`, `chat:done`, `chat:error`). `processors/chat-generation.processor.ts` (`@Processor('chat-generation')`): job `{ messageId }` → contexto → `for await` tokens → `done` + concluída; falha → falha + erro, parcial descartado; chama o gateway diretamente. BullMQ nos defaults. Unit de gateway (cookie/room) e processor (ordem dos tokens, `done` completo, falha sem `done`).

#### Definition of Done

- Unit verde; `lint` + `tsc` verdes; conexão nunca cai por erro de atendimento.

---

### [x] TASK-04 — Contrato no README + e2e do ciclo

#### Objective

Contrato verificável por humano e suíte provando o ciclo sem serviços reais.

#### Requirements

- FR-09
- BR-01

#### Acceptance Criteria

- AC-07
- AC-08

#### Depends On

- TASK-03

#### Implementation Notes

README do backend: direções, eventos e payloads do §9 da SPEC + verificação com cliente qualquer. E2E (`socket.io-client` real, Redis/PG efêmeros, HTTP do Ollama stubado em chunks, `httpServer` em porta efêmera): válida → pendente + tokens + conclusão; corte → erro sem conclusão; inválida → assunto inválido sem HTTP; queda → `MODEL_UNAVAILABLE`; timeout simulado → `TIMEOUT`. Sem LLM real, sem rede, sem timing real.

#### Definition of Done

- `npm test` (unit + integração + e2e) verde.
- README com o contrato; reprodução manual confere com o §9.

---

### [x] TASK-05 — Validação final

#### Objective

Fechar a implementação com todas as provas + cadeia verde.

#### Requirements

- FR-01
- FR-02
- FR-03
- FR-04
- FR-05
- FR-06
- FR-07
- FR-08
- FR-09
- BR-01
- BR-02
- BR-03
- BR-04
- BR-05

#### Acceptance Criteria

- AC-01
- AC-02
- AC-03
- AC-04
- AC-05
- AC-06
- AC-07
- AC-08

#### Depends On

- TASK-04

#### Implementation Notes

Revisitar cada AC (provas automatizadas ou manuais referenciadas, incluindo AC-05 com dado novo de verdade e AC-06 com modelo ocupado/lento). Cadeia: `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build`.

#### Definition of Done

- Todas as AC-01..AC-08 verificadas.
- Cadeia completa verde; sem segredo em evento/log/payload/job; sem SQL ao LLM; sem migration nova.

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
`specs/022-ai-chat-backend/spec.md`

PLAN:
`specs/022-ai-chat-backend/plan.md`

TASKS:
`specs/022-ai-chat-backend/tasks.md`

Todos os documentos passaram por revisão documental.

Na implementação:

1. reler SPEC;
2. reler PLAN;
3. reler TASKS;
4. confirmar a premissa da 021 e que o projeto não mudou de forma incompatível;
5. executar as TASKS em ordem;
6. marcar tasks concluídas somente após validar sua Definition of Done.

Se existir conflito entre documentação e projeto real:

PARE e informe.
