# SPEC (backend): Chat IA — envio + histórico por visitante (cookie + REST)

## Status

`APPROVED`

## 1. Context

A 022 implementou o chat via Socket.IO (código no working tree, ainda não commitado):
`chat:send` → valida → pendente em `chat_message` + job `chat-generation` → worker gera em
stream via `LlmProvider.chatStream` e empurra `chat:token` / `chat:done` / `chat:error`
na room `visitor:{visitorId}`. Cookie anônimo `chat_visitor` (uuid v4, `HttpOnly`, `Path=/`,
`SameSite=Lax`, `Secure` em prod) gerado no handshake do socket
(`visitor-cookie.middleware.ts`), reutilizado pelo gateway (`resolveVisitorId`).

Falta a segunda metade: **o visitante bater na API para enviar a mensagem e receber
as mensagens dele** — ou seja, envio REST + histórico da conversa. Hoje `ChatMessageRepository` só tem
`createPending`, `findById`, `markDone`, `markFailed`. Não existe nenhum controller REST
em `chat/` e o middleware só atua em `/socket.io/`: quem abre o chat pela primeira vez
via HTTP (para ler histórico) não recebe o cookie.

Esta SPEC fecha esse vão: cria a rota de envio (`POST /chat/messages`) e a de
leitura (`GET /chat/messages`), ambas no mesmo `visitorId` do socket.

## 2. Requested Feature

Escopo: backend. Na primeira abertura do chat, o backend garante um `visitorId`
(cookie `chat_visitor`) — via handshake do socket OU via REST. O visitante manda a
pergunta batendo em `POST /chat/messages { message }`: se válida, o backend cria na
hora o registro pendente e enfileira o job de geração (mesmo caminho da 022); se
inválida, devolve o texto de assunto inválido sem tocar fila nem modelo. A leitura é
`GET /chat/messages` paginado que devolve **somente** as mensagens do visitante dono
do cookie, em ordem de conversa. O socket vira push-only na mesma room
`visitor:{id}` (`chat:token`/`chat:done`/`chat:error`) — todo envio entra pelo `POST`,
sem `chat:send` (§6 FR-04).

## 3. Goal

Com o chat aberto pela primeira vez (sem cookie), a resposta (socket ou REST) fixa
`Set-Cookie: chat_visitor=<uuid>`; o visitante envia `POST /chat/messages
{ "message": "onde você trabalhou com NestJS?" }` e recebe `201` com o pendente
criado; tokens/conclusão chegam pelo socket na room dele; ao recarregar a página,
`GET /chat/messages` com o cookie devolve o histórico dele (pendentes, concluídas e
falhas) paginado; outro visitante com outro cookie nunca vê essas mensagens.

## 4. Current System

Somente componentes reais:

- 022 (working tree): `ChatService.ask(visitorId, message)` (valida string não vazia,
  máx 2000, inválida → `{kind:'invalid'}` sem Prisma/fila; válida → `createPending` +
  `queue.add('generate', {messageId})`; enqueue falhando → `markFailed` + throw
  `ChatQueueUnavailableError`); `buildContext()` só via services de domínio
  (`Users`, `Projects`, `Experiences`, `Technologies`, `Educations`); processor
  `@Processor('chat-generation')` com `for await chatStream` + `chat:token`/`chat:done`/`chat:error`;
  gateway com rooms `visitor:{id}` + `emitToVisitor` (o handler `chat:send` existe no
  working tree e é removido na implementação — §6 FR-04).
- `visitorCookieMiddleware` registrado globalmente em `backend/src/main.ts`, mas com
  early-return para tudo que não começa com `/socket.io/`.
- Prisma: `model ChatMessage { id, visitorId, question, answer?, status pending|done|failed, createdAt, updatedAt }`
  + migration `20261007171357_add_chat_message` aplicada. Sem índice além da PK (decisão da 021, volume não justifica).
- Padrão REST do projeto: controller fino → service → repository → `PrismaService`;
  paginação via `PaginationQueryDto` (`page` default 1, `size` default 4, max 20) +
  `PaginatedResponseDto<T>`; `ValidationPipe` global; Scalar em `/docs`.
- Sem controller/dto em `chat/` hoje.
- IA hoje só Ollama (`020`/`022`); outro provedor: spec própria (`024`).

## 5. Existing Behavior

Reutilizado sem mudança: validação de 2000 chars, texto de assunto
inválido, fila `chat-generation` com job `{messageId}`, contexto remontado no worker,
timeout `OLLAMA_TIMEOUT_MS`, rooms por visitante. **Mudança deliberada desta SPEC
(supersede da 022): o envio via socket `chat:send` é REMOVIDO — não existe legado.
Socket vira push-only (servidor → visitante: `chat:token`/`chat:done`/`chat:error`);
todo envio entra por `POST /chat/messages` (§6 FR-04). Na implementação, o handler
`chat:send` do gateway é removido junto com seus testes de envio. A
inconsistência conhecida da 022 (`QUEUE_UNAVAILABLE` prometido no §9 mas nunca emitido
pelo gateway) morre junto com o `chat:send` — o `POST` desta SPEC já nasce com o `503`
correto.

## 6. Functional Requirements

### FR-01 — Cookie gerado na primeira abertura, via socket OU REST

O `visitorId` é o cookie `chat_visitor` (uuid v4, opaco, sem dado pessoal). Quando o
visitante chega sem cookie ou com valor malformado, o backend gera um novo e o fixa
via `Set-Cookie` com as mesmas flags atuais (`Path=/; HttpOnly; SameSite=Lax; Secure`
só em prod) — tanto no handshake do socket (comportamento atual, mantido) quanto na
resposta do `GET /chat/messages` (novo). Cookie válido existente nunca é sobrescrito.

**Por que precisa:** hoje só o socket fixa o cookie; o primeiro contato via REST
(histórico ao abrir o chat) passaria sem identidade e o frontend teria duas
identidades diferentes para a mesma pessoa. Gerar nos dois pontos garante um único
`visitorId` desde a primeira abertura, independente do caminho.

### FR-02 — Histórico REST paginado, só do dono do cookie

`GET /chat/messages` devolve as mensagens do visitante dono do cookie, ordenadas por
`createdAt` ascendente (ordem de conversa), paginadas no padrão do projeto
(`PaginationQueryDto` + `PaginatedResponseDto`). Cada item: `id`, `question`,
`answer` (nulável — `null` enquanto `pending` ou quando `failed` sem resposta),
`status` (`pending`|`done`|`failed`), `createdAt`, `updatedAt`.

**Por que precisa:** ao recarregar, o frontend precisa remontar a conversa sem
regerar nada; paginação contém o payload (conversa longa) e segue o contrato que o
frontend já consome nos CRUDs.

### FR-03 — Isolamento total por visitante

A query filtra SEMPRE por `visitorId` lido do cookie pelo servidor. O cliente nunca
envia `visitorId` por query/body/header. Sem cookie válido (após FR-01 gerar um novo),
o resultado é lista vazia — nunca mensagens de outro visitante. Registro de outro
`visitorId` pedido por id direto (se existir endpoint futuro) seria 404, não 403 com
vazamento de existência — nesta SPEC só existe listagem, então a regra se resume a:
sem filtro de dono, sem resposta.

**Por que precisa:** `visitorId` é o único ownership do chat anônimo; sem filtro
forçado no servidor, um visitante leria a conversa alheia.

### FR-04 — Envio SÓ via `POST`; socket é push-only (sem `chat:send`)

`POST /chat/messages` com body `{ message }` é o ÚNICO caminho de envio: valida
(mesma regra da 022 — string obrigatória, não vazia, máx 2000 via `ChatService.ask`);
se válida, cria o pendente com o `visitorId` do cookie e enfileira
(`chat-generation`, job `{messageId}`), respondendo `201` com o registro; se inválida,
responde `200` com o texto de assunto inválido, sem criar registro, sem fila e sem
provider. O socket NÃO recebe pergunta — ele só empurra (servidor → visitante):
`chat:token` / `chat:done` / `chat:error` na room `visitor:{id}`. O handler `chat:send`
da 022 é removido na implementação desta SPEC, sem modo legado: frontend que ainda
emite `chat:send` precisa migrar para o `POST`.

**Por que precisa:** sem `POST`, o frontend web seria obrigado a emitir socket só
para enviar; com o `POST`, o envio vira `fetch` simples e o socket fica só como push
(tokens/conclusão).

### FR-05 — Mesmo `visitorId` no socket e no REST

Gateway (`resolveVisitorId` + `roomForVisitor`) e controller do histórico usam a mesma
leitura de cookie (`readVisitorCookie`/`isVisitorId`) e o mesmo formato de room
(`visitor:{id}`). Nenhum formato novo de identidade.

**Por que precisa:** dois formatos de id = dois canais que nunca se encontram; o push
tempo real (`server.to(room).emit`) e o histórico precisam concordar sobre quem é quem.

> Provedor Groq (seleção, fallback, logs): spec própria em `specs/024-groq-provider/`.

## 7. Business Rules

### BR-01 — Regras da 022 continuam valendo

pt-BR, LLM sem SQL, contexto como dado (não instrução), sem segredo em evento/log/
payload/job. O histórico devolve `question`/`answer` como dados — nunca como instrução.

### BR-02 — `visitorId` nunca vem do cliente como dado

Só do header `Cookie` (`chat_visitor`) lido pelo servidor (handshake do socket ou
REST) e persistido em `visitorId`. Qualquer
`visitorId` em query/body é ignorado (não erro — ignorado, para nunca virar vetor de
spoofing).

### BR-03 — Cookie novo não herda histórico

Visitantes sem cookie ou com cookie malformado ganham id novo e veem lista vazia.
Não existe migração/merge de conversa entre ids.

## 8. User Flow

1. Visitante abre o chat pela primeira vez (sem `chat_visitor`): `GET /chat/messages`
   responde `200` com lista vazia + `Set-Cookie: chat_visitor=<uuid>` (ou o handshake
   do socket fixa, o que chegar primeiro).
2. Visitante envia pergunta via `POST /chat/messages { "message": "..." }` — único
   caminho de envio, caindo em `ChatService.ask` + fila + worker.
3. Tokens chegam em `chat:token`, conclusão em `chat:done` na room dele.
4. Visitante recarrega: `GET /chat/messages?page=1` com o cookie devolve o histórico
   em ordem (incluindo o par pergunta/resposta recém-concluído).
5. Outro navegador (outro cookie) vê lista vazia própria.

## 9. API Contract

- `GET /chat/messages?page=1&size=20` (query segue `PaginationQueryDto`; `size` max 20).
  - Auth: nenhuma (anônimo por cookie, como o socket).
  - Header `Cookie` enviado pelo front (`chat_visitor=<uuid-v4>`): o backend lê
    desse header e grava em `visitorId`. Ausente/malformado → servidor gera novo,
    fixa `Set-Cookie` e responde lista vazia paginada.
  - Response `200` (`PaginatedResponseDto<ChatMessageResponseDto>`):
    ```json
    {
      "data": [
        {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "question": "onde você trabalhou com NestJS?",
          "answer": "Trabalhei com NestJS em...",
          "status": "done",
          "createdAt": "2026-10-07T12:00:00.000Z",
          "updatedAt": "2026-10-07T12:00:31.000Z"
        }
      ],
      "total": 1,
      "page": 1,
      "totalPages": 1
    }
    ```
  - `answer: null` quando `pending` (ainda gerando) ou `failed` sem texto.
  - Erros: paginação inválida → `400` no formato do `GlobalExceptionFilter`;
    resto segue o padrão do projeto. Sem `401/403` (canal anônimo).
- `POST /chat/messages` (envio — a rota que faltava).
  - Auth: nenhuma (anônimo por cookie, como o socket e o `GET`).
  - Header `Cookie` enviado pelo front (`chat_visitor=<uuid-v4>`): o backend lê
    desse header e grava em `visitorId`. Ausente/malformado → servidor gera novo,
    fixa `Set-Cookie` e processa o envio já nesse id novo.
  - Request body (`SendChatMessageDto`, `ValidationPipe` global):
    ```json
    { "message": "onde você trabalhou com NestJS?" }
    ```
    `message` obrigatória, string, `trim() !== ''`, máx 2000 chars (mesma regra da 022).
  - Response `201` (válida — via `ChatService.ask`, mesma validação/enqueue da 022):
    ```json
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "status": "pending",
      "createdAt": "2026-10-07T12:00:00.000Z"
    }
    ```
    O `201` confirma "pendente criado + job enfileirado", não a resposta pronta —
    a resposta chega pelo socket (`chat:token`/`chat:done`) e depois no `GET`.
  - Mensagem inválida (vazia/só espaços/acima de 2000/não-string) → `200` (não erro):
    ```json
    { "answer": "Desculpe, só respondo perguntas sobre experiência, projetos, habilidades e formação." }
    ```
    Sem criar registro, sem fila, sem provider.
  - Fila indisponível no enqueue → `503` `{ "code": "QUEUE_UNAVAILABLE", "message": "..." }`
    amigável, sem stack, sem segredo (o pendente é marcado `failed`, sem órfão).
  - Body fora do DTO (ex: sem `message`) → `400` padrão do `ValidationPipe`.
- Socket (push-only, servidor → visitante — NÃO aceita envio): o cliente conecta
  (cookie fixa a room `visitor:{visitorId}`) e só escuta `chat:token {delta}` /
  `chat:done {answer}` / `chat:error {code,message}`. Não existe mais `chat:send` nem
  `chat:answer` — pergunta inválida via `POST` volta no próprio `200`, sem evento.
- OpenAPI/Scalar: `GET` + `POST` aparecem em `/openapi.json` + `/docs` com `@ApiOperation`/
  `@ApiResponse`, como os demais controllers.

## 10. Data Requirements

Sem migration nova: tabela `chat_messages` da 021/022 já tem tudo (`visitorId`,
`question`, `answer?`, `status`, timestamps). Leitura via método novo no repository
existente (ex: `listByVisitor(visitorId, {page, size})` com `where: {visitorId}`,
`orderBy: {createdAt: 'asc'}`, `skip/take` + `count`), seguindo o padrão dos demais
repositories. A escrita reaproveita `createPending` + `queue.add` existentes via
`ChatService.ask` — sem método novo de persistência. Sem índice novo (mesma
justificativa da 021: volume de chat não justifica;
reavaliar só com gargalo real medido).

## 11. Validation

Query via `PaginationQueryDto` existente (global `ValidationPipe` já cobre). Body do
`POST` via DTO novo (`SendChatMessageDto`: `message` string, não vazia, máx 2000 —
espelhando `MAX_CHAT_MESSAGE_LENGTH`/`INVALID_SUBJECT_TEXT` da 022, sem duplicar a
regra: o controller delega ao `ChatService.ask`). Cookie validado por
`isVisitorId`/`readVisitorCookie` existentes (uuid v4 estrito); valor
malformado = ausente (gera novo, não 400 — cookie corrompido não é culpa acionável do
usuário).

## 12. Authorization

Canal anônimo, sem conta, sem `JwtAuthGuard`. Ownership = cookie `HttpOnly` lido no
servidor (FR-03). Sem vínculo com login do dono, sem dado pessoal, sem papel/admin.

## 13. Error Scenarios

- Sem cookie / cookie malformado → novo id + `Set-Cookie` (no `GET`: lista vazia; no
  `POST`: processa o envio já no id novo).
- `POST` sem `message` / tipos errados → `400` padrão; `message` vazia/longa →
  `200` com texto de assunto inválido (não erro).
- `POST` com fila fora do ar → `503 QUEUE_UNAVAILABLE`, pendente marcado `failed`.
- `GET` com `page/size` inválidos → `400` padrão.
- Banco indisponível → `500` padrão do filtro global (sem vazar detalhe).
- Fila/modelo falhando → visível no histórico como `status: failed` / `pending` sem
  `answer`; o erro tempo real é evento de socket (push), não erro HTTP aqui.

## 14. Security Requirements

- BR-01/BR-02/BR-03; sem segredo em response/log; `question`/`answer` são conteúdo do
  próprio visitante — devolvidos só ao dono.
- Cookie com as flags atuais; `Secure` só em prod (não quebrar dev em http local).
- Sem `visitorId` via query/body; sem listar sem filtro de dono; sem `GET :id` nem delete.

## 15. Performance / Concurrency Requirements

Leitura paginada (`size` max 20) com `orderBy createdAt`; sem N+1 (query única +
`count`); sem cache nesta SPEC (histórico muda a cada geração; cache sem invalidação
seria dívida). Concorrência de geração continua na fila da 022; o histórico apenas
reflete o estado persistido (leitura eventualmente consistente durante `pending`).

## 16. Tests / Expected Behaviors

Comportamentos a proteger (sem código de teste aqui):

- Repository/service: lista só do dono (2 visitantes com mensagens → cada um vê só as
  suas); ordem `createdAt` asc; paginação (`total`/`totalPages` coerentes);
  `pending` com `answer: null`; cookie malformado tratado como novo visitante.
- Controller `GET`: sem cookie → `200` vazio + `Set-Cookie` com uuid válido; com cookie →
  histórico; `size=999` → `400`; outro visitante não vaza.
- Controller `POST`: sem cookie → `201` + `Set-Cookie`; válida → pendente + job com
  o `visitorId` do cookie; inválida → `200` com texto de assunto inválido, sem job e
  sem provider; fila fora → `503 QUEUE_UNAVAILABLE` sem pendente órfão; body sem
  `message` → `400`.
- E2E (PG efêmero, Redis efêmero p/ enqueue, sem LLM real p/ o POST): `POST` sem cookie →
  recebe cookie + `201`; `GET` com o cookie devolve; `GET` com cookie de outro
  visitante devolve vazio.
- Nada na suíte depende de LLM real, Redis com dados ou timing real.

## 17. Documentation Impact

- Scalar/OpenAPI automático via anotações no controller novo.
- `backend/README.md`: seção do contrato REST (`POST` + `GET`, verificação
  `curl -c/-b`) — sem inventar sistema novo de docs.
- `.env.example` intacto nesta SPEC (vars de provedor pertencem à 024).
- `.env` real nunca versionado; nenhuma credencial em doc, log ou exemplo.

## 18. Acceptance Criteria

### AC-01 — Primeira abertura ganha cookie e histórico vazio

Given: visitante sem `chat_visitor`.
When: `GET /chat/messages`.
Then: `200` com `data: []`, `total: 0` + `Set-Cookie: chat_visitor=<uuid-v4 válido>`.

### AC-02 — Histórico devolve só as mensagens do dono, em ordem

Given: visitante A com 2 pares concluídos + 1 pendente; visitante B com 1 par.
When: `GET /chat/messages?size=20` com cookie de A.
Then: 3 itens de A em `createdAt` asc, `answer: null` no pendente; nada de B.

### AC-03 — Recarregar após gerar mostra a conversa

Given: cookie fixado (AC-01), pergunta enviada via `POST /chat/messages` e concluída
(`done`).
When: `GET /chat/messages` com o mesmo cookie.
Then: o par pergunta/resposta aparece no histórico.

### AC-04 — Cookie malformado não vaza nem quebra

Given: `Cookie: chat_visitor=lixo`.
When: `GET /chat/messages`.
Then: novo uuid fixado via `Set-Cookie`, lista vazia, `200` (não `400`).

### AC-05 — Paginação no padrão do projeto

Given: 5 mensagens do visitante.
When: `GET /chat/messages?page=1&size=2` (depois `page=2`, `page=3`).
Then: `total: 5`, `totalPages: 3`, páginas com 2/2/1 itens em ordem; `size=999` → `400`.

### AC-06 — Socket e REST concordam no dono

Given: mesma sessão (cookie único).
When: envia `POST /chat/messages` com esse cookie e depois lê
`GET /chat/messages`.
Then: tokens/conclusão chegaram na room `visitor:{id}` do cookie E o histórico contém a
mensagem — nenhum outro cookie a enxerga.

### AC-07 — Contrato documentado e reproduzível

Given: backend no ar.
When: abrir `/docs` e repetir com `curl -c cookies.txt -b cookies.txt`.
Then: campos/paginação/cookie batem com o §9.

### AC-08 — `POST` válido cria pendente + enfileira

Given: cookie válido (ou nenhum — gera e fixa).
When: `POST /chat/messages { "message": "onde você trabalhou com NestJS?" }`.
Then: `201` com `{ id, status: "pending", createdAt }`; registro `pending` existe no
banco com o `visitorId` do cookie; job `generate {messageId}` na fila; resposta pronta
chega depois via socket/`GET` (o `201` não contém a resposta).

### AC-09 — `POST` inválido devolve texto de assunto inválido sem fila nem provider

Given: cookie válido.
When: `POST /chat/messages` com `{ "message": "" }` (ou só espaços, acima de 2000, ou
sem `message` → este último dá `400` do DTO).
Then (vazia/longa): `200` com `{ "answer": "<texto de assunto inválido>" }`; nenhum
registro criado; nenhum job; HTTP do Ollama nunca chamado.

### AC-10 — `POST` com fila fora não cria pendente órfão

Given: Redis parado.
When: `POST /chat/messages` válida.
Then: `503` `{ "code": "QUEUE_UNAVAILABLE", "message": "..." }`; registro marcado
`failed`, sem pendente eterno sem job.

## 19. Assumptions

### ASSUMPTION-01 — Escopo: `POST` + listagem, sem `GET :id` nem delete

Descrição: envio é `POST /chat/messages` + leitura é `GET /chat/messages` paginado.
Justificativa: "mandando a mensagem e recebendo as mensagens dele" = criar + listar; detalhe por id e
apagar conversa são produto futuro e adicionariam ownership-check sem uso real hoje.
Impacto se errada: adicionar `GET :id` depois, com `where: {id, visitorId}` → 404 se não for do dono.

### ASSUMPTION-02 — Ordem `createdAt` asc, sem ordenação custom

Descrição: conversa sempre cronológica; sem `sort`/`order` na query.
Justificativa: chat é linha do tempo; parâmetro de ordenação seria complexidade sem caso de uso.
Impacto se errada: adicionar query depois, sem migração.

### ASSUMPTION-03 — Middleware estendido, não novo

Descrição: o `visitorCookieMiddleware` passa a atuar também em `/chat/*`, com as mesmas
flags e helpers (`isVisitorId`/`readVisitorCookie`).
Justificativa: uma identidade, um código; novo middleware duplicaria geração de uuid e flags.
Impacto se errada: nenhum contratual — só duplicação interna.

### ASSUMPTION-04 — Sem índice em `visitorId` por enquanto

Descrição: sem migration nova.
Justificativa: mesma decisão da 021; volume de mensagens por visitante é pequeno e a
leitura é paginada por `createdAt`.
Impacto se errada: migration aditiva de índice depois, sem quebra.

### ASSUMPTION-05 — Remoção sem período de depreciação

Descrição: o handler `chat:send` sai de uma vez, sem manter legado nem versionar eventos.
Justificativa: não existe consumidor em produção (página `/ai` ainda não existe; o único
cliente do socket é a suíte e2e da 022, atualizada nesta SPEC).
Impacto se errada: reintroduzir o handler como fallback — reversível sem migração.

### ASSUMPTION-06 — Timeout efetivo de 300s no compose

Descrição: `OLLAMA_TIMEOUT_MS=300000` no `docker-compose` do backend; o default do
código segue 60s.
Justificativa: provado ao vivo que 60s e 120s não cabem para geração com contexto
cheio em CPU (tentativas reais morreram cravadas em ~60s e ~120s; a geração observada
precisa de ~100-160s com variância). 300s dá margem sem mascarar travamento (se
estourar, continua virando `failed` + evento).
Impacto se errada: ajuste de variável, sem código.

## 20. Definition of Done

- Envio `POST` cria pendente + enfileira (AC-08); inválida sem fila/provider (AC-09);
  fila fora vira `503` sem órfão (AC-10).
- Primeira abertura fixa cookie via socket OU REST (AC-01, AC-04).
- Histórico paginado só do dono, em ordem, com `answer: null` enquanto pendente (AC-02, AC-03, AC-05).
- Socket e REST no mesmo `visitorId`/room (AC-06); contrato no Scalar + README com reprodução via `curl` (AC-07).
- `lint` + `tsc --noEmit` + `npm test` (unit/integração/e2e) + `build` verdes, sem LLM real nem Redis com dados na suíte.
- Sem migration nova, sem var nova, sem segredo em log/response; sem `visitorId` vindo do cliente como dado.
- Supersede da 022 registrado e aplicado: handler `chat:send` removido (sem legado);
  `QUEUE_UNAVAILABLE` da 022 morre junto — o `POST` já nasce com o `503` correto.

## Final Review

### Consistency

`PASSED` (validado na execução das TASKS 01–05)

### Checked

- [x] requisitos revisados
- [x] regras de negócio revisadas
- [x] fluxos revisados
- [x] critérios de aceite revisados
- [x] conflitos com 022 revisados

### Remaining Issues

`Nenhuma inconsistência. Follow-ups fora do escopo: (1) flake de contenção no e2e full observado 1x (verde no rerun isolado e no npm test seguinte); (2) provedor Groq vive na 024.`

### Review Result

`SPEC validada na implementação e APROVADA.`
