# TASKS: Chat IA — envio + histórico REST

## Status

`READY_FOR_IMPLEMENTATION`

> Todas nasceram `[ ]` e foram executadas com DoD validada (TASK-01..TASK-05 `[x]`).

## Sources

SPEC:
`specs/023-chat-history-backend/spec.md`

PLAN:
`specs/023-chat-history-backend/plan.md`

Premissa: a 022 está implementada no working tree (ask, fila, worker, tabela,
gateway, middleware). Se faltar, parar antes de codar.

---

## Tasks

### [x] TASK-01 — `POST /chat/messages` (envio) + cookie em `/chat/*`

#### Objective

A rota de envio no ar primeiro: visitante cria a mensagem e ela entra na fila.

#### Requirements

- FR-01
- FR-04
- BR-02
- BR-03

#### Acceptance Criteria

- AC-01
- AC-04
- AC-08
- AC-09
- AC-10

#### Depends On

`Nenhuma` (além da premissa da 022)

#### Implementation Notes

`middlewares/visitor-cookie.middleware.ts`: atuar quando a URL começa com
`/socket.io/` OU `/chat`; resto idêntico (geração, flags, nunca sobrescrever válido).
`dto/send-chat-message.dto.ts` (`message`: string, não vazia após `trim`, máx 2000 —
`class-validator`, erro de forma → `400` do `ValidationPipe`).
`controllers/chat.controller.ts` (`@Controller('chat')`, `@ApiTags('chat')`):
`POST /chat/messages` → `visitorId` via `@VisitorId()` (lê `req.visitorId` do middleware) →
`chatService.ask` → inválida `200 {answer}` / válida `201 {id, status, createdAt}`
(via `findById`) / `ChatQueueUnavailableError` → `503 {code:'QUEUE_UNAVAILABLE'}`.
Registrar controller em `chat.module.ts`. Unit: middleware (fixa em `/chat/messages`
sem cookie, mantém válido, ignora rota fora) + controller com service mockado (os três
ramos do `ask` + `503` sem órfão + `400` DTO).

#### Definition of Done

- Unit verde (middleware + controller); `lint` + `tsc` verdes; Scalar lista o `POST`;
  sem `visitorId` vindo do cliente como dado; sem migration.

---

### [x] TASK-02 — `GET /chat/messages` (histórico)

#### Objective

A rota de leitura no ar: visitante recebe só as mensagens dele, em ordem.

#### Requirements

- FR-02
- FR-03
- BR-01
- BR-02

#### Acceptance Criteria

- AC-02
- AC-05

#### Depends On

- TASK-01

#### Implementation Notes

`repositories/chat-message.repository.ts`: `listByVisitor(visitorId, {page, size})`
(`where: {visitorId}`, `orderBy: {createdAt: 'asc'}`, `skip/take` + `count`, padrão
dos demais repositories). `services/chat.service.ts`: `listMessages(visitorId,
pagination)` → `PaginatedResponseDto<ChatMessage>` (`totalPages = ceil(total/size)`).
`dto/chat-message-response.dto.ts` (`id`, `question`, `answer: string | null`,
`status`, `createdAt`, `updatedAt` + `@ApiProperty`). Estender `ChatController` com
`GET /chat/messages` (`PaginationQueryDto`). Sem query nova fora do filtro de dono;
sem índice novo. Unit: isolamento (2 visitantes), ordem asc, `total`/`totalPages`,
`pending` com `answer: null`; controller `GET` (sem cookie → vazio, `size=999` → `400`).

#### Definition of Done

- Unit verde; `lint` + `tsc` verdes; Scalar lista o `GET`; sem migration.

---

### [x] TASK-03 — Gateway push-only (remoção do `chat:send`)

#### Objective

Socket sem envio: só push na room do visitante.

#### Requirements

- FR-05

#### Acceptance Criteria

- AC-06

#### Depends On

- TASK-02

#### Implementation Notes

`gateways/chat.gateway.ts`: remover `handleSend`, `@SubscribeMessage` e
imports mortos; manter `handleConnection` (join `visitor:{id}`), `resolveVisitorId`,
`roomForVisitor`, `emitToVisitor` (usado pelo processor). Atualizar
`chat.gateway.spec.ts` (remover casos de envio; manter room/cookie/emit).

#### Definition of Done

- Unit verde do gateway; `lint` + `tsc` verdes; nenhum handler de envio
  restante; push do worker intacto.

---

### [x] TASK-04 — Contrato no README + e2e do ciclo REST

#### Objective

Contrato verificável por humano e suíte provando o ciclo sem serviços reais.

#### Requirements

- FR-01
- FR-02
- FR-03
- FR-04
- FR-05
- BR-01

#### Acceptance Criteria

- AC-02
- AC-03
- AC-07
- AC-08
- AC-09

#### Depends On

- TASK-03

#### Implementation Notes

README do backend: `POST` + `GET` (requests, responses, cookie) + socket push-only
(remover `chat:send` da doc) + verificação `curl -c/-b`. E2E (PG + Redis efêmeros,
sem LLM real): `POST` sem cookie → `201` + `Set-Cookie`; `GET` com cookie devolve em
ordem (semeando concluídas via repository + gerando uma via `POST` com Ollama stubado
para cobrir `pending` → `done`); outro cookie vê vazio; `POST` inválida → `200` sem
job; `size=999` → `400`. Atualizar `chat.e2e-spec.ts` da 022 (remover casos de
`chat:send`).

#### Definition of Done

- `npm test` (unit + integração + e2e) verde.
- README com o contrato; reprodução manual confere com o §9 da SPEC.

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
- BR-01
- BR-02
- BR-03

#### Acceptance Criteria

- AC-01
- AC-02
- AC-03
- AC-04
- AC-05
- AC-06
- AC-07
- AC-08
- AC-09
- AC-10

#### Depends On

- TASK-04

#### Implementation Notes

Revisitar cada AC (provas automatizadas ou manuais referenciadas). Timeout efetivo
300s no compose (ASSUMPTION-06); a suíte simula timeout sem depender do valor real.
Cadeia: `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build`.

#### Definition of Done

- Todas as AC-01..AC-10 verificadas.
- Cadeia completa verde; sem segredo em log/response; sem SQL ao alcance do LLM; sem
  migration nova; supersede da 022 aplicado (`chat:send` removido).

---

## Final Review

### Consistency

`PASSED` (todas executadas com DoD validada: TASK-01..TASK-05 `[x]`)

### Checked

- [x] cobertura da SPEC revisada (FR-01..FR-05, BR-01..BR-03 em ≥1 task)
- [x] cobertura do PLAN revisada (ordem e TDs executados)
- [x] dependências entre TASKS revisadas (cadeia 01→02→03→04→05 íntegra)
- [x] referências FR/BR/AC revisadas (AC-01..AC-10 em ≥1 task)
- [x] Definition of Done revisadas
- [x] escopo revisado (Groq movido para a 024, sem resíduo)
- [x] nenhuma TASK nasceu concluída (marcadas durante a execução, com evidência)
- [x] ordem de execução revisada (POST → GET → gateway → e2e → final)

### Uncovered Requirements

`Nenhum.`

### Orphan Tasks

`Nenhuma.`

### Review Result

`TASKS validadas e PRONTAS (READY_FOR_IMPLEMENTATION); execução concluída.`

## Implementation Handoff

Fontes:

SPEC:
`specs/023-chat-history-backend/spec.md`

PLAN:
`specs/023-chat-history-backend/plan.md`

TASKS:
`specs/023-chat-history-backend/tasks.md`

Todos os documentos validados e aprovados (`APPROVED`/`READY`/`READY_FOR_IMPLEMENTATION`).

Na implementação (só após aprovação):

1. reler SPEC;
2. reler PLAN;
3. reler TASKS;
4. confirmar a premissa da 022 e que o projeto não mudou de forma incompatível;
5. executar as TASKS em ordem;
6. marcar tasks concluídas somente após validar sua Definition of Done.

Se existir conflito entre documentação e projeto real:

PARE e informe.
