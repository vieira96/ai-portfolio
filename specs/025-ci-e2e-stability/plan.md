# PLAN: CI — e2e sem estouro de hook em runner frio

## Status

`READY`

## Source Spec

`specs/025-ci-e2e-stability/spec.md` (APPROVED)

## 1. Implementation Strategy

Premissa: diagnóstico fechado (8 hooks estourados, 0 asserção falha, chat passou,
verde local). Desenho: jobs por camada (quality/unit/integration/e2e-matrix-3x +
agregador), pre-pull por job que usa container, sharding serial por runner.
Prova final é um push real com cache frio. Nada em `src/`, nada em teste.

## 2. Existing Components to Reuse

Somente reais:

- `.github/workflows/ci.yml` (jobs `backend-quality`, `backend-unit`,
  `backend-integration`, `backend-e2e` matrix 3x, `backend` agregador, `frontend`).
- `vitest.config.e2e.ts` (`include **/*.e2e-spec.ts`, `hookTimeout 180000`).
- `backend/package.json` (`test` = unit + integração + e2e; `test:e2e` = vitest e2e).

## 3. Components Affected

- `.github/workflows/ci.yml` (único arquivo tocado).

## 4. Backend Changes

Nenhuma (código da aplicação intacto — BR-01).

## 5. Frontend Changes

Nenhuma.

## 6. Database Changes

Nenhuma.

## 7. CI Changes

- Pre-pull por job que usa container (`postgres:16` na integração; `postgres:16` +
  `redis:7-alpine` no e2e).
- `backend-e2e` em matrix 3x (`--shard=N/3`) com `--no-file-parallelism` por runner
  (~3 arquivos em sequência); `fail-fast: false`.
- Camadas separadas (`test:unit`, `test:integration`, `test:e2e` em jobs próprios,
  sem `npm test` agregador); job `backend` agregador (`always()` + `needs`, mesmo
  nome do check antigo); timeouts por job; `concurrency` cancelando run atropelado.

## 8. Authorization / Security Implementation

Nada novo: sem credencial, sem login em registry (imagens públicas).

## 9. Performance / Concurrency Requirements

E2E em 3 runners com ~3 arquivos seriais cada; local inalterado. Custo aceito:
runners em paralelo por determinismo + velocidade.

## 10. Error Handling

Pull falhou → step próprio vermelho com log claro, antes dos testes. Shard estourar
mesmo assim → evidência para `hookTimeout`/mais shards/service container (BR-02 da
SPEC), nunca `src/`.

## 11. Tests Strategy

A prova é o próprio CI em cache frio (AC-01). Local: `npm test` segue verde sem
mudança. Sem teste novo.

## 12. Documentation Updates

Nenhuma (workflow autoexplicativo).

## 13. Implementation Order

1. Jobs por camada + pre-pull por job.
2. E2E em matrix 3x serial por runner + agregador.
3. Push em `dev` com cache frio e acompanhar os jobs (validação).

## 14. Technical Decisions

### TD-01 — Pre-pull em step próprio, não em cache de registry

Problema: onde tirar o pull do caminho crítico. Decisão: `docker pull` explícito
antes dos testes. Motivo: sequencial, visível no log, sem config de cache; o
testcontainers reaproveita a imagem já presente. Trade-off: ~1min fixo por run
mesmo com cache quente parcial.

### TD-02 — Sharding por job, serial por runner

Problema: onde limitar a contenção. Decisão: matrix 3x no e2e com
`--no-file-parallelism` + `--shard` por runner, sem mudar `vitest.config.e2e.ts`
nem scripts do `package.json`. Motivo: cada runner pega ~3 arquivos isolados
(rápido E determinístico); local intacto. Trade-off: 3 runners em vez de 1.

## 15. Things We Will NOT Do

- Mexer em `src/`, teste, seed, migration ou config de teste.
- Aumentar `hookTimeout` antes de provar FR-01+FR-02 insuficientes.
- Cache de registry/buildx (complexidade sem necessidade ainda).

---

## Final Review

### Consistency

`PASSED`

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

`Nenhuma (PLAN acompanha SPEC APPROVED).`

### Known Risks

- Se a causa real for outra (ex: instabilidade do runner), o push de validação
  mostra — e a SPEC manda voltar ao diagnóstico, não mexer em `src/`.

### Review Result

`PLAN revisado e PRONTO (READY).`
