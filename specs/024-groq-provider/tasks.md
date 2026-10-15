# TASKS: Chat IA — provedor Groq

## Status

`DRAFT`

> SPEC + PLAN em `DRAFT`. Nenhuma TASK pode ser executada até aprovação
> (SPEC `APPROVED`, PLAN `READY`, TASKS `READY_FOR_IMPLEMENTATION`).
> Todas nascem `[ ]`.

## Sources

SPEC:
`specs/024-groq-provider/spec.md`

PLAN:
`specs/024-groq-provider/plan.md`

Premissa: 022 implementada e 023 com o `POST` no ar. Se faltar provider Ollama,
fila ou `POST`, parar antes de codar.

---

## Tasks

### [x] TASK-01 — `GroqLlmProvider` + unit

#### Objective

O provider Groq falando com a API, com o mapeamento de erro correto.

#### Requirements

- FR-01

#### Acceptance Criteria

- AC-01

#### Depends On

`Nenhuma` (além da premissa)

#### Implementation Notes

`providers/groq/groq.provider.ts` (`GroqLlmProvider`, HTTP direto sem SDK):
`chat()` + `chatStream()` SSE + `isAvailable()`; 401/403 → `unreachable`, 429 →
`rate_limited`, 404 → `model_not_found`, abort → `timeout`; key só no
`Authorization`. Unit com HTTP stubado (ok, 401, 429, timeout, chunks, `[DONE]`,
chunk só de `role`, JSON inválido).

#### Definition of Done

- Unit verde; `lint` + `tsc` verdes; sem SDK novo; sem segredo em log.

---

### [x] TASK-02 — Seleção + pastas + health

#### Objective

Groq principal com key, Ollama sem ela; estrutura em pastas; health honesto.

#### Requirements

- FR-02

#### Acceptance Criteria

- AC-01
- AC-02

#### Depends On

- TASK-01

#### Implementation Notes

Mover `ollama.provider.ts` + spec para `providers/ollama/`.
`llm.provider.ts`: `modelName` + seleção (key → Groq). `ai.module.ts`: `useClass` da
cadeia (sem fábrica). `ai.service.ts`: `model` do provedor. `env.validation.ts`:
`GROQ_API_KEY` opcional, `GROQ_MODEL` + `GROQ_TIMEOUT_MS` com defaults (+ unit da
validação). Unit: seleção com/sem key, health com `modelName` mockado.

#### Definition of Done

- Unit verde; `lint` + `tsc` verdes; sem migration.

---

### [x] TASK-03 — Fallback + logging

#### Objective

Limite cai para o Ollama com log; todo erro logado sem segredo.

#### Requirements

- FR-03

#### Acceptance Criteria

- AC-03
- AC-04

#### Depends On

- TASK-02

#### Implementation Notes

Cadeia num provider só (`ChainedLlmProvider`, Ollama sempre por último): 429 anda
para o próximo (uma vez por nível, com log da troca); demais erros sem troca.
Transparente ao processor. Logs com `reason` + `model` (+ `messageId`); nunca chave,
cookie, pergunta, resposta ou prompt. Unit: 429→ok, 429→falha, 401 sem troca, sem key
só Ollama, logger sem segredo.

#### Definition of Done

- Unit verde; `lint` + `tsc` verdes; sem cascata; sem segredo em log.

---

### [x] TASK-04 — Validação final

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

- TASK-03

#### Implementation Notes

Revisitar cada AC. Cadeia: `npm run lint` + `npx tsc --noEmit` + `npm test` +
`npm run build`. Conferir `.env.example` + README da 023.

#### Definition of Done

- Todas as AC-01..AC-04 verificadas; cadeia verde; sem segredo em log/response.

---

## Final Review

### Consistency

`PASSED` (todas executadas com DoD validada: TASK-01..TASK-04 `[x]`)

### Checked

- [x] cobertura da SPEC revisada (FR-01..FR-03 em ≥1 task)
- [x] cobertura do PLAN revisada (ordem e TDs executados)
- [x] dependências entre TASKS revisadas (cadeia 01→02→03→04 íntegra)
- [x] referências FR/BR/AC revisadas (AC-01..AC-04 em ≥1 task)
- [x] Definition of Done revisadas
- [x] escopo revisado (uma coisa por task; refino fábrica→cadeia incorporado)
- [x] nenhuma TASK nasceu concluída (marcadas durante a execução, com evidência)
- [x] ordem de execução revisada

### Uncovered Requirements

`Nenhum.`

### Orphan Tasks

`Nenhuma.`

### Review Result

`TASKS validadas na execução. Promoção a READY_FOR_IMPLEMENTATION pendente de aprovação formal.`

## Implementation Handoff

Fontes:

SPEC:
`specs/024-groq-provider/spec.md`

PLAN:
`specs/024-groq-provider/plan.md`

TASKS:
`specs/024-groq-provider/tasks.md`

Todos os documentos validados na execução; a promoção dos status
(`APPROVED`/`READY`/`READY_FOR_IMPLEMENTATION`) aguarda aprovação formal.

Na implementação (só após aprovação):

1. reler SPEC;
2. reler PLAN;
3. reler TASKS;
4. confirmar a premissa e que o projeto não mudou de forma incompatível;
5. executar as TASKS em ordem;
6. marcar tasks concluídas somente após validar sua Definition of Done.

Se existir conflito entre documentação e projeto real:

PARE e informe.
