# PLAN: Chat IA — envio + histórico REST (controller, push-only, cookie)

## Status

`READY`

## Source Spec

`specs/023-chat-history-backend/spec.md` (APPROVED)

## 1. Implementation Strategy

Premissa de entrada: a 022 está implementada no working tree (ainda não commitada):
`ChatService.ask` (validação, pendente, enqueue, compensação de fila),
`ChatMessageRepository` (CRUD do `chat_message`), fila `chat-generation`, processor com
`chatStream` + push (`chat:token`/`chat:done`/`chat:error`), gateway com `chat:send` +
rooms, middleware de cookie só em `/socket.io/`, tabela migrada. Verificar isso antes
de começar; se faltar, PARAR.

Sobre essa base, em ordem: envio primeiro (`POST` + DTO + middleware estendido para
`/chat/*`), depois leitura (repository `listByVisitor` + service `listMessages` +
`GET`), gateway reduzido a push-only (remoção do `handleSend`), README do contrato e
e2e do ciclo REST. Testes junto ao código, no padrão do repo
(Vitest + Testcontainers + Redis efêmero).

## 2. Existing Components to Reuse

Somente reais:

- `ChatService.ask(visitorId, message)` (`backend/src/modules/chat/services/chat.service.ts:52-70`)
  + constantes `MAX_CHAT_MESSAGE_LENGTH`, `INVALID_SUBJECT_TEXT`, `CHAT_GENERATION_QUEUE`
  e `ChatQueueUnavailableError` — o `POST` delega a ele, sem duplicar validação/enqueue.
- `ChatMessageRepository` (`createPending`, `findById`, `markDone`, `markFailed`) +
  `PrismaService` — ganha um método de leitura, sem mudar os existentes.
- Helpers de cookie (`VISITOR_COOKIE_NAME`, `isVisitorId`, `readVisitorCookie` em
  `visitor-cookie.middleware.ts`) — mesma leitura no socket e no REST, mesmas flags.
- `PaginationQueryDto` (`page` default 1, `size` default 4, max 20) +
  `PaginatedResponseDto<T>` — mesmo contrato paginado dos CRUDs.
- `ValidationPipe` global + `GlobalExceptionFilter` (`{ statusCode, message, timestamp }`)
  + padrão Swagger (`@ApiTags`/`@ApiOperation`/`@ApiResponse`) do `ProjectsController`.
- Harness de teste (`setupTestApp`/`teardownTestApp`) + Redis efêmero + PG efêmero do
  `chat.e2e-spec.ts` da 022.

## 3. Components Affected

- `backend/src/modules/chat/controllers/chat.controller.ts` (novo: `POST` + `GET`).
- `backend/src/modules/chat/dto/send-chat-message.dto.ts` (novo) +
  `chat-message-response.dto.ts` (novo).
- `backend/src/modules/chat/services/chat.service.ts` (adiciona `listMessages`).
- `backend/src/modules/chat/repositories/chat-message.repository.ts` (adiciona `listByVisitor`).
- `backend/src/modules/chat/gateways/chat.gateway.ts` (remove `handleSend`/`chat:send`;
  mantém conexão/room/`emitToVisitor`).
- `backend/src/modules/chat/middlewares/visitor-cookie.middleware.ts` (atua também em `/chat/*`).
- `backend/src/modules/chat/chat.module.ts` (registra o controller).
- `backend/README.md` (contrato REST + verificação via `curl -c/-b`).
- `backend/src/modules/chat/chat.e2e-spec.ts` + specs unit existentes (atualização: sai
  envio por socket, entra ciclo REST).

## 4. Backend Changes

```text
backend/src/modules/chat/
├── chat.module.ts                    (registra ChatController)
├── controllers/
│   └── chat.controller.ts            (POST /chat/messages, GET /chat/messages)
├── dto/
│   ├── send-chat-message.dto.ts      (message: string, 1..2000 via class-validator)
│   └── chat-message-response.dto.ts  (id, question, answer|null, status, createdAt, updatedAt)
├── services/
│   └── chat.service.ts               (+ listMessages(visitorId, {page,size}))
├── repositories/
│   └── chat-message.repository.ts    (+ listByVisitor: where visitorId, orderBy createdAt asc, skip/take + count)
├── gateways/
│   └── chat.gateway.ts               (push-only: handleConnection + emitToVisitor; sem @SubscribeMessage)
└── middlewares/
    └── visitor-cookie.middleware.ts  (condição: /socket.io/* OU /chat/*)
```

- `POST`: controller fino lê `visitorId` via `@VisitorId()` (decorator sobre
  `req.visitorId` fixado pelo middleware) →
  `chatService.ask(visitorId, dto.message)` → `invalid` vira `200 {answer}`;
  `queued` vira `201 {id, status:'pending', createdAt}` (o `ask` já devolve `createdAt`); `ChatQueueUnavailableError` vira `503 {code:'QUEUE_UNAVAILABLE'}`
  (TD-04). Sem `Set-Cookie` manual no controller — o middleware já fixou.
- `GET`: controller → `chatService.listMessages(visitorId, pagination)` →
  `PaginatedResponseDto<ChatMessageResponseDto>` em ordem de conversa.
- `listByVisitor`: `prisma.chatMessage.findMany({ where:{visitorId}, orderBy:{createdAt:'asc'}, skip, take })`
  + `count({where:{visitorId}})`; `totalPages = ceil(total/size)` no padrão dos services.
- Middleware: trocar o early-return para atuar quando a URL começa com `/socket.io/`
  ou `/chat` (TD-03); resto idêntico (geração de uuid, flags, nunca sobrescrever válido).
- Gateway: remover `handleSend`, `@SubscribeMessage('chat:send')` e o import não usado;
  `resolveVisitorId`/`roomForVisitor`/`handleConnection`/`emitToVisitor` intactos
  (o processor empurra por eles). Specs unit do gateway: remover casos de envio,
  manter room/cookie/emit.
- Cookie: sem rota nova de cookie, sem flag nova, sem `visitorId` em query/body.

## 5. Frontend Changes

Nenhuma.

## 6. Database Changes

Nenhuma migration (tabela da 021/022; escrita reaproveita `createPending`). Sem índice
novo (TD-05).

## 7. API Changes

Novas: `POST /chat/messages`, `GET /chat/messages` (contrato §9 da SPEC).
Removida: `chat:send`/`chat:answer` do socket (push-only: `chat:token`/`chat:done`/`chat:error`).
Scalar/OpenAPI cobre o REST via anotações; socket segue documentado no README.

## 8. Authorization / Security Implementation

Anônimo por cookie, sem `JwtAuthGuard` (SPEC §12): dono = `req.visitorId` do middleware;
controller nunca lê `visitorId` de query/body (BR-02). Filtro `where:{visitorId}`
forçado em toda leitura (FR-03). Sem segredo em response/log; `Secure` só em prod.

## 9. Performance / Concurrency Requirements

Leitura paginada (`size` max 20) com `orderBy createdAt`; `findMany` + `count` (sem
N+1); sem cache. Geração segue na fila da 022 com timeout efetivo de 300s
(`OLLAMA_TIMEOUT_MS` no compose, ASSUMPTION-06); `GET` reflete o estado persistido.

## 10. Error Handling

| Caso | Resposta |
|---|---|
| `POST` válido | `201 {id, status, createdAt}` |
| `POST` inválido (vazia/longa) | `200 {answer}` sem registro/job/provider |
| `POST` sem `message`/tipo errado | `400` do `ValidationPipe` |
| `POST` com fila fora | `503 {code:'QUEUE_UNAVAILABLE'}` + pendente `failed` |
| `GET` sem cookie/malformado | novo id + `Set-Cookie`, `200` vazio (não erro) |
| `GET` paginação inválida | `400` padrão |

## 11. Tests Strategy

Junto à implementação, no padrão do repo:

- Unit repository/service: isolamento por dono, ordem asc, `total`/`totalPages`,
  `pending` com `answer: null`; `POST` mapeia os três ramos do `ask` + `503` sem órfão.
- Unit controller (service mockado): `201` + `200` inválida + `400` DTO.
- Unit middleware: fixa em `/chat/messages` sem cookie, mantém válido, ignora rota fora.
- Unit gateway (atualizado): sem handler de envio; conexão entra na room; `emitToVisitor` emite.
- E2E (PG + Redis efêmeros, sem LLM real): `POST` sem cookie → `201` + cookie;
  `GET` com cookie devolve em ordem; outro cookie vê vazio; `POST` inválida → `200`
  sem job; `size=999` → `400`.
- Cadeia: `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build`.

## 12. Documentation Updates

- Scalar/OpenAPI automático via anotações.
- `backend/README.md`: seção REST (`POST` + `GET` + `curl -c/-b`) junto ao contrato
  socket push-only (remover `chat:send` da doc).

## 13. Implementation Order

0. Verificar saídas da 022 no working tree (ask, fila, tabela, gateway, middleware); se faltar, PARAR.
1. `POST /chat/messages` (DTO + controller + middleware `/chat/*`) + unit — envio primeiro.
2. `GET /chat/messages` (repository `listByVisitor` + service `listMessages` + handler) + unit.
3. Gateway push-only (remoção do `chat:send`) + unit.
4. README do contrato.
5. E2E do ciclo REST + cadeia final.

## 14. Technical Decisions

### TD-01 — Inválida retorna `200`, não `400`/`422`

Problema: onde encaixar mensagem fora do assunto. Decisão: `200 {answer}` (conteúdo de
resposta, não erro de protocolo). Motivo: o corpo está bem formado; o "rejeitado" é
regra de produto, e o frontend renderiza igual ao par pergunta/resposta. Trade-off:
monitoramento por status não distingue inválida (aceito: métrica futura, não contrato).

### TD-02 — Remoção em vez de depreciação do `chat:send`

Problema: manter compat ou remover. Decisão: remover (ASSUMPTION-05). Motivo: sem
consumidor em produção (página `/ai` inexistente; único cliente é a e2e da 022,
atualizada aqui). Trade-off: frontend antigo hipotético quebra — aceito, não existe.

### TD-03 — Middleware estendido, não novo

Problema: onde fixar cookie no REST. Decisão: mesma função, condição
`/socket.io/*` ou `/chat/*`. Motivo: identidade única, flags únicas. Trade-off: acoplamento
de prefixo de rota no middleware (reversível, sem contrato).

### TD-04 — `503` via catch no controller

Problema: como `ChatQueueUnavailableError` vira HTTP. Decisão: `try/catch` no handler
do `POST` mapeando para `503 {code, message}` (ou `ExceptionFilter` dedicado ao escopo
do controller — decisão do executor, sem filtro global novo). Motivo: erro de um
endpoint, não da aplicação. Trade-off: nenhum relevante.

### TD-05 — Sem índice em `visitorId`

Problema: índice novo. Decisão: não criar (ASSUMPTION-04). Motivo: volume não justifica;
leitura paginada por `createdAt`. Trade-off: full scan em volume futuro (migration
aditiva resolve, sem quebra).

## 15. Things We Will NOT Do

- Memória/threads, moderação, rate-limit.
- `GET :id`, delete de conversa, ordenação custom, `sort`/`order` na query.
- Cache do histórico, retry/backoff custom, segunda fila, Bull Board.
- Endpoint HTTP de stream/polling manual, fallback de envio por socket.
- Migration nova, índices novos, seed.
- Frontend (página `/ai` é spec futura, fora deste escopo).
- Refactor de módulos de domínio além de consumir.

---

## Final Review

### Consistency

`PASSED` (validado na execução das TASKS 01–05)

### Checked

- [x] compatibilidade com SPEC
- [x] compatibilidade com projeto real
- [x] arquitetura revisada
- [x] backend revisado
- [x] banco revisado
- [x] segurança revisada
- [x] estratégia de testes revisada
- [x] overengineering revisado

### Deviations from SPEC

`Nenhum desvio contratual. Refinos de implementação dentro do escopo: decorator
@VisitorId() no controller, createdAt via AskResult, registro do middleware no
harness de e2e (espelha o main.ts).`

### Known Risks

- 022 vive no working tree não commitado; drift se a 022 mudar (não mudou durante a 023).
- Flake de contenção no e2e full com 9 arquivos em paralelo (1 ocorrência, verde no rerun).

### Review Result

`PLAN validado na implementação e PRONTO (READY).`
