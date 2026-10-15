# TASKS: Chat widget — histórico real + cookie na carga (fase 2a)

## Status

`READY_FOR_IMPLEMENTATION`

## Sources

SPEC:
`specs/027-chat-integration/spec.md`

PLAN:
`specs/027-chat-integration/plan.md`

Premissa: widget visual pronto; backend no ar com CORS resolvido (dependência
prévia — sem ela, nada funciona no browser).

---

## Tasks

### [x] TASK-01 — Fetch do histórico + env

#### Objective

Camada de `GET` isolada e testável, com base URL pública.

#### Requirements

- FR-01

#### Acceptance Criteria

- AC-01

#### Depends On

`Nenhuma`

#### Implementation Notes

Função (`GET /chat/messages?page&size`, `credentials: include`, base de
`NEXT_PUBLIC_API_URL`) + var no `.env.example`. Unit: URL/parâmetros/credentials,
1 chamada, parse do paginado.

#### Definition of Done

- Unit verde; `lint` verde; sem segredo.

---

### [x] TASK-02 — Prefetch + histórico real + erro

#### Objective

Abrir com conversa real, scroll-up nas antigas, erro com retry do `GET`.

#### Requirements

- FR-01
- FR-02
- FR-03

#### Acceptance Criteria

- AC-02
- AC-03
- AC-04
- AC-05
- AC-06

#### Depends On

- TASK-01

#### Implementation Notes

Widget: 1 `GET` no mount (falha silenciosa) + última página primeiro + scroll-up
anterior + erro com retry que refaz. Deleta `getLatest/getOlder` do mock (fica
`streamMockReply`); retry de envio oculto. Unit com fetch stubado (ordem, páginas,
erro/retry, vazio).

#### Definition of Done

- Comportamentos demonstráveis; `lint` verde; mock de histórico fora; zero request
  além do `GET`.

---

### [x] TASK-03 — Validação final

#### Objective

Fechar com todas as provas + cadeia verde.

#### Requirements

- FR-01
- FR-02
- FR-03

#### Acceptance Criteria

- AC-01
- AC-02
- AC-03
- AC-04
- AC-05
- AC-06
- AC-07

#### Depends On

- TASK-02

#### Implementation Notes

Demo com backend real + CORS resolvido. Cadeia: `npm run lint` + `npm run build` +
`npm test`.

#### Definition of Done

- Todas as AC-01..AC-07 verificadas; cadeia verde.
