# TASKS: CI — e2e sem estouro de hook em runner frio

## Status

`READY_FOR_IMPLEMENTATION`

## Sources

SPEC:
`specs/025-ci-e2e-stability/spec.md`

PLAN:
`specs/025-ci-e2e-stability/plan.md`

Premissa: diagnóstico fechado (ver SPEC §1). Se surgir evidência nova contra a
causa ambiental, parar antes de mexer.

---

## Tasks

### [x] TASK-01 — Pre-pull das imagens nos jobs com container

#### Objective

Tirar o pull frio de dentro do `beforeAll`.

#### Requirements

- FR-01

#### Acceptance Criteria

- AC-01

#### Depends On

`Nenhuma`

#### Implementation Notes

Steps de `docker pull` em `.github/workflows/ci.yml`: só `postgres:16` na integração;
`postgres:16` + `redis:7-alpine` no e2e. Sem login, sem cache configurado, sem tocar
em mais nada.

#### Definition of Done

- `git diff` mostra só os steps novos; `ci.yml` continua válido (YAML íntegro).

---

### [x] TASK-02 — E2E em sharding serial por runner

#### Objective

E2E do CI rápido e determinístico sem mudar o default local.

#### Requirements

- FR-02

#### Acceptance Criteria

- AC-01

#### Depends On

- TASK-01

#### Implementation Notes

Job `backend-e2e` em matrix 3x com `npm run test:e2e -- --no-file-parallelism
--shard=N/3` (flag confirmada no help do Vitest pinado). `vitest.config.e2e.ts`,
`package.json` e demais arquivos intactos; local roda como antes.

#### Definition of Done

- CI chama com flag + shard; diff só no workflow.

---

### [x] TASK-03 — Camadas separadas + agregador

#### Objective

Feedback em camadas com um check único consolidado.

#### Requirements

- FR-03

#### Acceptance Criteria

- AC-02

#### Depends On

- TASK-02

#### Implementation Notes

Jobs `backend-quality`, `backend-unit`, `backend-integration`, `backend-e2e` (no
lugar do `npm test` único); job `backend` agregador (`always()` + `needs`, mesmo
nome do check antigo — preserva required-checks); timeouts por job;
`fail-fast: false` no matrix; `concurrency` cancelando run atropelado. Verificar
indentação/blocos do YAML.

#### Definition of Done

- `ci.yml` com uma execução por suíte + agregador; diff só no workflow.

---

### [x] TASK-04 — Validação com push real

#### Objective

Provar AC-01 em cache frio de verdade.

#### Requirements

- FR-01
- FR-02
- FR-03

#### Acceptance Criteria

- AC-01
- AC-02

#### Depends On

- TASK-03

#### Implementation Notes

Push em `dev` e acompanhar os jobs (quality/unit/integration/e2e×3 + agregador):
todos verdes sem `Hook timed out` = AC-01. Se algum shard estourar, coletar tempos
por etapa e voltar ao diagnóstico (BR-02 da SPEC) em vez de mexer em `src/` ou
aumentar timeout no escuro.

#### Definition of Done

- Camadas + agregador verdes com cache frio; `git diff` total da 025 só em workflow.

---

## Final Review

### Consistency

`PASSED`

### Checked

- [x] cobertura da SPEC revisada (FR-01..FR-03 em ≥1 task)
- [x] cobertura do PLAN revisada
- [x] dependências entre TASKS revisadas (cadeia 01→02→03→04 íntegra)
- [x] referências FR/BR/AC revisadas (AC-01, AC-02)
- [x] Definition of Done revisadas
- [x] escopo revisado (só workflow)
- [x] nenhuma TASK nasceu concluída
- [x] ordem de execução revisada

### Uncovered Requirements

`Nenhum.`

### Orphan Tasks

`Nenhuma.`

### Review Result

`TASKS revisadas e PRONTAS (READY_FOR_IMPLEMENTATION).`

## Implementation Handoff

Fontes:

SPEC:
`specs/025-ci-e2e-stability/spec.md`

PLAN:
`specs/025-ci-e2e-stability/plan.md`

TASKS:
`specs/025-ci-e2e-stability/tasks.md`

Todos os documentos revisados e aprovados.

Na implementação (só após aprovação):

1. reler SPEC;
2. reler PLAN;
3. reler TASKS;
4. confirmar que nenhuma evidência nova mudou o diagnóstico;
5. executar as TASKS em ordem;
6. marcar tasks concluídas somente após validar sua Definition of Done.

Se existir conflito entre documentação e projeto real:

PARE e informe.
