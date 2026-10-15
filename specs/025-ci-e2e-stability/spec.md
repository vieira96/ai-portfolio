# SPEC (infra): CI — e2e sem estouro de hook em runner frio

## Status

`APPROVED`

## 1. Context

O job `backend` do Actions (`ubuntu-latest`, sem cache de imagem Docker) relata:
unit 117/117 e integração 18/18 verdes; no e2e, 43/43 testes verdes e 8 arquivos
mortos no `beforeAll` (180s do `hookTimeout`), nenhum em asserção. O 9º arquivo,
`chat.e2e` — mesmo helper e com um container a MAIS (Redis efêmero) — passou no
mesmo run. Localmente a suíte inteira passa (`npm test` verde, exit 0). Nada no
código de produção mudou o caminho do hook: o `beforeAll` faz container Postgres
(testcontainers) + `migrate deploy` + `db seed` + boot do app em cada arquivo.
Desenho adotado: jobs separados por camada com o e2e em sharding (3 runners).

## 2. Requested Feature

Escopo: CI/workflow e flags de execução dos testes. Tornar o e2e verde em runner
frio, sem tocar em `src/`, sem mascarar com timeout maior como primeira medida.

## 3. Goal

Push para `dev` com cache Docker frio passa o backend de primeira: quality/unit
rápidos, integração isolada e e2e em 3 runners sem `Hook timed out`.

## 4. Current System

Somente componentes reais:

- `.github/workflows/ci.yml`: jobs `backend-quality` (lint/build), `backend-unit`,
  `backend-integration`, `backend-e2e` (matrix 3x), `backend` (agregador) e `frontend`.
- `vitest.config.e2e.ts`: `include **/*.e2e-spec.ts`, `hookTimeout 180000`.
- `test/helpers/e2e-setup.helper.ts`: cada arquivo sobe seu próprio Postgres
  (`postgres:16`, pull de centenas de MB se frio) + migrate + seed + boot.
- 9 arquivos e2e que disputavam um runner só (2 vCPU) em paralelo total.

## 5. Existing Behavior

Suíte correta e verde local; frágil no CI por motivo ambiental (pull frio +
paralelismo total em runner pequeno), não por bug.

## 6. Functional Requirements

### FR-01 — Imagens pré-baixadas antes dos testes

Step no workflow fazendo `docker pull` de `postgres:16` e
`redis:7-alpine` antes do `npm test`. Elimina a variância do pull frio dentro do
`beforeAll` (a causa dominante do estouro).

**Por que precisa:** o pull acontece hoje dentro do hook, competindo com outros
8 pulls simultâneos; fora do hook ele é sequencial, cacheável e visível no log.

### FR-02 — E2E em sharding, serial por runner

Job `backend-e2e` em matrix 3x (`--shard=N/3`) com `--no-file-parallelism` em cada
runner — cada um roda ~3 arquivos em sequência, sem disputar container com outro
job. Flag só no workflow; default local intacto.

**Por que precisa:** 9 suítes com container próprio cabem folgadas em 3 runners e
continuam isoladas; serializar tudo num runner só trocaria o estouro por 15min de
espera em todo push.

### FR-03 — Camadas separadas, rodada única, agregador

Jobs `backend-quality`, `backend-unit`, `backend-integration` e `backend-e2e`
(no lugar do `npm test` único + repetições); cada suíte roda uma vez. Job `backend`
agregador (`always()` + `needs`, mesmo nome do check antigo) falha se qualquer
camada falhar. Timeouts por job, `fail-fast: false` no matrix, `concurrency`
cancelando run atropelado.

**Por que precisa:** feedback em camadas (rápido segura o merge, pesado roda
isolado); o agregador preserva o nome do check exigido; sem rodada duplicada.

## 7. Business Rules

### BR-01 — Nenhuma mudança em `src/` ou em teste

Só workflow e flags de execução. Se precisar mexer em teste ou código para o CI
passar, a SPEC está errada — parar e revisar.

### BR-02 — Timeout maior não é correção

`hookTimeout` só aumenta depois de FR-01+FR-02 provados insuficientes, com evidência
de log. Aumentar primeiro esconderia a causa.

## 8. User Flow

1. Push para `dev` (ou PR para `main`) dispara o CI.
2. Quality/unit rápidos; integração isolada; e2e em 3 runners com imagens
   pré-baixadas; agregador consolida.
3. Backend verde sem `Hook timed out`.

## 9. API Contract

Nenhuma mudança de API, contrato ou comportamento da aplicação.

## 10. Data Requirements

Nenhum dado novo.

## 11. Validation

Nenhum input novo. Validação = CI verde em cache frio.

## 12. Authorization

Nenhuma mudança (workflow já existente, sem segredo novo; sem `docker login`
necessário para imagens públicas).

## 13. Error Scenarios

- Pull falha (rede do runner) → step próprio falha com log claro, antes dos testes
  (melhor que 8 hooks estourando sem dizer porquê).
- Mesmo com FR-01+FR-02 algum shard estourar → evidência para discutir `hookTimeout`
  (BR-02), mais shards ou service container compartilhado — nunca mexer em `src/`.

## 14. Security Requirements

- BR-01.
- Sem credencial nova; sem `GROQ_API_KEY` ou segredo no workflow (testes seguem
  herméticos, Groq desligado na suíte).

## 15. Performance / Concurrency Requirements

E2E em 3 runners com ~3 arquivos seriais cada; local segue como está. Custo: runners
em paralelo por determinismo + velocidade (sem a espera do tudo-serializado).

## 16. Tests / Expected Behaviors

A prova é o próprio CI: push com cache frio → job `backend` verde, zero `Hook timed
out`. Local continua verde sem mudança.

## 17. Documentation Impact

Nenhuma (`.github/workflows/ci.yml` é autoexplicativo; sem README novo).

## 18. Acceptance Criteria

### AC-01 — CI verde em cache frio

Given: workflow com FR-01+FR-02+FR-03, cache Docker vazio.
When: push para `dev`.
Then: camadas verdes e agregador verde, nenhum `Hook timed out`, sem mudança em
`src/` ou testes.

### AC-02 — Uma execução por suíte, com agregador

Given: workflow atualizado.
When: ler o `ci.yml`.
Then: cada suíte roda uma vez (quality/unit/integration/e2e em jobs próprios) e o
job `backend` consolida o resultado.

## 19. Assumptions

### ASSUMPTION-01 — Runner com Docker funcional

Descrição: `ubuntu-latest` com daemon Docker (padrão do hospedado).
Justificativa: se o Docker estivesse ausente/quebrado, a falha seria em 100% das
execuções inclusive locais equivalentes — e local passa.
Impacto se errada: o problema é outro (infra do runner) e esta SPEC não se aplica.

### ASSUMPTION-02 — Causa é pull frio + paralelismo, não código

Descrição: nada no diff recente explica hooks de 180s (o que entrou no caminho do
hook é atribuição de env + registro de middleware síncrono — zero I/O novo).
Justificativa: todas as falhas são idênticas, todas no hook, nenhuma em asserção
(43/43 testes verdes); o `chat.e2e`, com o mesmo helper e um container a mais,
passou no mesmo run — o que enterra causa em código, inclusive no helper.
Impacto se errada: voltar ao diagnóstico com logs de tempo por etapa do `beforeAll`.

## 20. Definition of Done

- `ci.yml` com pre-pull por job, sharding 3x serial por runner e rodada única por
  suíte com agregador (AC-01, AC-02).
- Push com cache frio verde; zero `Hook timed out`.
- `git diff` da mudança contém só workflow — nenhum `src/`, nenhum teste.

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

`Nenhuma inconsistência.`

### Review Result

`SPEC revisada e APROVADA.`
