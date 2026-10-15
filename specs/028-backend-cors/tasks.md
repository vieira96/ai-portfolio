# TASKS: CORS para o frontend (origens por env)

## Status

`READY_FOR_IMPLEMENTATION`

## Sources

SPEC:
`specs/028-backend-cors/spec.md`

PLAN:
`specs/028-backend-cors/plan.md`

Premissa: `main.ts` sem CORS (verificado). Sem tocar em rota, contrato ou cookie.

---

## Tasks

### [x] TASK-01 — Env + parse + unit

#### Objective

`CORS_ORIGINS` virando `string[]` válida ou boot abortando.

#### Requirements

- FR-02

#### Acceptance Criteria

- AC-04

#### Depends On

`Nenhuma`

#### Implementation Notes

Zod: split por vírgula + trim + ignora vazio + cada item URL (ver PLAN TD-01).
`.env.example` com exemplo de 2 origens. Unit: uma, várias, espaços, vazios
ignorados, inválida aborta nomeando a var.

#### Definition of Done

- Unit verde; `lint` + `tsc` verdes; sem segredo.

---

### [x] TASK-02 — `enableCors` + socket coberto

#### Objective

Browser liberado no REST e no polling, sem wildcard.

#### Requirements

- FR-01
- FR-03

#### Acceptance Criteria

- AC-01
- AC-02
- AC-03

#### Depends On

- TASK-01

#### Implementation Notes

`main.ts`: `enableCors({ origin: <lista>, credentials: true })`. Confere header no
polling `/socket.io/`; faltando, configura no adapter. Prova manual `curl` com
`Origin` nos dois caminhos + fluxo do chat no browser sem erro de CORS.

#### Definition of Done

- Prova `curl` + browser verdes; nunca echo de `Origin`; diff sem rota/contrato.

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

#### Depends On

- TASK-02

#### Implementation Notes

Revisita cada AC. Cadeia: `npm run lint` + `npx tsc --noEmit` + `npm test` +
`npm run build`.

#### Definition of Done

- Todas as AC-01..AC-04 verificadas; cadeia verde.
