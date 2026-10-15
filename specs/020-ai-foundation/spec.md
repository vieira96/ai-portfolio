# SPEC: Fundação de IA (Ollama + Qwen no Docker)

## Status

`APPROVED`

## 1. Context

O projeto não tem nenhuma integração com LLM: sem módulo `ai/`, sem provider, sem serviço `ollama` no compose, sem variáveis de ambiente, sem SDK. O README promete chat IA, mas nada existe em código. O ambiente precisa existir e estar provado: subir o `docker compose`, ter um modelo funcional respondendo, e um ponto único no backend que fala com ele. Esta SPEC cobre exatamente isso.

## 2. Requested Feature

Preparar o ambiente para IA — instalar no Docker e deixar pronto para funcionar.

## 3. Goal

Com `docker compose up`, o serviço Ollama sobe com o modelo Qwen funcional; o backend conversa com ele através de uma abstração própria; um endpoint de health prova de ponta a ponta que o modelo responde; a suíte de testes continua verde sem precisar de GPU nem de download pesado no CI.

## 4. Current System

Somente componentes reais:

- Backend NestJS 12 + Prisma 7 (`backend/src/infra/database/prisma.service.ts`); módulos `auth`, `users`, `technologies`, `projects`, `experiences`, `educations`, `uploads` registrados em `backend/src/app.module.ts`.
- Padrão controller/service/repository + DTOs com `class-validator`; `ValidationPipe` global e `GlobalExceptionFilter` (`{ statusCode, message, timestamp }`) em `backend/src/main.ts`.
- Env validado por Zod em `backend/src/config/env.validation.ts` (hoje: `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `SEED_*`).
- OpenAPI em `GET /openapi.json` + Scalar em `/docs` (montados em `backend/src/main.ts`).
- Testes em Vitest: unit (`*.spec.ts`), integração (`*.integration.spec.ts`, Testcontainers com `postgres:16`), e2e (`*.e2e-spec.ts` com `backend/test/helpers/e2e-setup.helper.ts`); `npm test` roda os três.
- `backend/docker/docker-compose.yml` com serviços `backend`, `postgres`, `redis` (container existe, zero uso em código). Sem serviço `ollama`.
- `backend/.env.example` sem nenhuma variável de IA; `REDIS_URL` existe no example mas não é lida pelo código.

## 5. Existing Behavior

Nenhum comportamento de IA existe hoje. O que existe e será reutilizado: validação de env por Zod na subida, filtro global de erros, documentação automática via Scalar, e o fluxo `docker compose up` como fonte única do ambiente.

## 6. Functional Requirements

### FR-01 — Serviço `ollama` no docker-compose

O `backend/docker/docker-compose.yml` ganha o serviço `ollama` (imagem oficial), com volume nomeado para persistir os modelos baixados e porta publicada para desenvolvimento local; o serviço `backend` passa a depender dele no mesmo regime dos demais serviços.

**Por que precisa:** sem isso, cada máquina repete setup manual (instalar Ollama, baixar modelo, adivinhar URL). O compose é a fonte única do ambiente neste projeto; IA fora dele vira "funciona na minha máquina".

### FR-02 — Modelo Qwen presente e funcional após o setup

Após o fluxo documentado de setup, o Ollama responde geração de texto com o modelo `qwen2.5:7b`. O modelo baixado sobrevive a `docker compose down/up` (volume do FR-01). A prova de "funcional" é gerar texto, não apenas processo rodando.

**Por que precisa:** container Ollama vazio não serve para nada e falha de forma confusa ("model not found" em runtime). Amarrar modelo + persistência + prova de geração elimina a classe inteira de "subiu mas não funciona".

### FR-03 — Variáveis do provider no `.env.example` e validadas por Zod

Novas variáveis (`OLLAMA_URL`, `OLLAMA_CHAT_MODEL`, `OLLAMA_TIMEOUT_MS`) entram no `backend/.env.example` e no schema de `backend/src/config/env.validation.ts`. Sem elas, o backend falha explícito na subida — nunca erro silencioso em runtime.

**Por que precisa:** é o padrão do projeto para config (falhar cedo, com mensagem clara). IA tem mais partes móveis que CRUD (URL, modelo, timeout); sem validação, cada erro de digitação vira debug longo em runtime.

### FR-04 — Abstração `LlmProvider` com implementação Ollama

O backend ganha uma interface própria (ex: `LlmProvider.chat()` + `isAvailable()`) e uma única implementação concreta via HTTP direto na API do Ollama, sem SDK externo. Nenhum outro código do backend importa HTTP do Ollama diretamente.

**Por que precisa:** um ponto único de acesso permite validar, limitar e testar tudo num só lugar; HTTP direto sem SDK é a menor dependência possível (a API do Ollama é um POST JSON estável, não justifica biblioteca); e a interface deixa o mock trivial nos testes (FR-07).

### FR-05 — Endpoint `GET /ai/health` provando o modelo de ponta a ponta

O backend expõe `GET /ai/health` (público, sem segredos na resposta) que retorna a disponibilidade real do provider (ex: `{ status: 'ok' | 'unavailable', model }`), onde `ok` significa que o modelo gerou resposta dentro do timeout — não apenas que a porta TCP aceita conexão.

**Por que precisa:** é a prova contratual de que a fundação funciona, consumível por humano (`curl`, `/docs`) e por monitoramento. Health que só checa porta mente: Ollama aceita conexão sem nenhum modelo baixado.

### FR-06 — Timeout explícito e configurável em toda chamada ao LLM

Toda chamada ao provider respeita `OLLAMA_TIMEOUT_MS` (valor inicial: 60s, ver ASSUMPTION-02). Estouro vira erro tratado, nunca request pendurada.

**Por que precisa:** LLM local em CPU pode levar dezenas de segundos; sem timeout, requests acumulam e prendem recurso do servidor. É a proteção mais barata contra o modo de falha mais comum.

### FR-07 — Testes sem depender de modelo real no CI

A suíte prova o comportamento sem baixar GBs nem exigir GPU: unit do provider e do health com a camada HTTP mockada; e2e do `GET /ai/health` com HTTP stubado nos dois cenários (`ok` e `unavailable`). A prova contra o modelo de verdade é o smoke manual via compose (comando `curl` documentado), executado por humano, não pela suíte.

**Por que precisa:** teste que baixa modelo de 4.7GB não roda no CI — ou é pulado (vira enfeite) ou quebra o pipeline. Mock no nível HTTP testa tudo que é nosso (montagem da chamada, timeout, parse, mapeamento de erro, formato de resposta); o que é do Ollama (gerar texto) se prova uma vez no smoke, não a cada `npm test`.

### FR-08 — Endpoint documentado no OpenAPI/Scalar

`GET /ai/health` aparece em `GET /openapi.json` e no `/docs` com anotações (`@ApiOperation`, `@ApiResponse`), como os demais controllers.

**Por que precisa:** padrão do projeto; contrato visível sem precisar ler código.

## 7. Business Rules

### BR-01 — Nenhum segredo vaza pelo health ou pelos logs

A resposta do `GET /ai/health` e qualquer log contêm apenas status e nome do modelo — nunca URL interna, chave, prompt ou conteúdo de resposta do modelo.

**Por que:** health é público e log é persistente; vazar detalhe interno aqui é o caminho mais bobo para expor infra.

### BR-02 — Falha de IA nunca derruba o backend

Ollama parado, modelo ausente ou timeout resultam em `unavailable` / erro tratado — o processo do backend segue no ar e as demais rotas respondem normalmente.

**Por que:** IA é o componente mais frágil do sistema (processo externo pesado); a fundação precisa provar isolamento desde o dia um.

## 8. User Flow

1. Dev executa `docker compose up` + fluxo documentado de setup do modelo.
2. Dev chama `GET /ai/health` (ou abre `/docs`).
3. Recebe `{ status: 'ok', model: 'qwen2.5:7b' }` — fundação pronta.
4. Se receber `unavailable`, a resposta/logs indicam o motivo (Ollama fora, modelo ausente, timeout) sem segredos.

## 9. API Contract

- Method: `GET`
- Path: `/ai/health`
- Authentication: nenhuma (resposta sem segredos, por BR-01).
- Response 200: `{ "status": "ok", "model": "qwen2.5:7b" }`
- Response 200 (degradado): `{ "status": "unavailable", "model": "qwen2.5:7b" }` — HTTP 200 com status interno, pois o backend está saudável; quem está indisponível é o provider (alternativa `503` aceita sem quebrar o contrato de campos).
- Statuses: erro inesperado segue o formato padrão do `GlobalExceptionFilter`.

## 10. Data Requirements

Nenhum dado novo: sem tabelas, sem migrations, sem colunas. A única persistência envolvida é o volume Docker dos modelos baixados (infra, não banco).

## 11. Validation

Sem input de usuário neste módulo (GET sem body). A validação existente é a das variáveis de ambiente via Zod na subida (FR-03).

## 12. Authorization

`GET /ai/health` público (sem segredos na resposta, por BR-01).

## 13. Error Scenarios

- Ollama fora do ar (conexão recusada) → `unavailable`, sem derrubar o backend (BR-02).
- Modelo ausente (`model not found`) → `unavailable` (motivo registrado em log, sem vazar no response além do status).
- Timeout (`OLLAMA_TIMEOUT_MS`) → `unavailable`.
- Env do provider ausente/inválida → falha explícita na subida do backend (Zod), antes de qualquer request.

## 14. Security Requirements

- BR-01 (sem segredo em response/log).
- HTTP direto com timeout, sem SDK de permissões amplas (FR-04 + FR-06).
- O serviço `ollama` publica porta para fora do compose somente o necessário ao desenvolvimento local.

## 15. Performance / Concurrency Requirements

Timeout configurável em toda chamada ao LLM (FR-06), para não acumular requests penduradas.

## 16. Tests / Expected Behaviors

Comportamentos a proteger (sem código de teste aqui):

- Provider: monta a chamada HTTP corretamente (URL, modelo, `stream: false`, timeout); resposta válida → texto; erro/timeout → erro tratado tipado (não exceção crua de `fetch`).
- Health: provider OK → `ok`; provider fora/modelo ausente/timeout → `unavailable`; backend segue saudável.
- E2e do `GET /ai/health` com HTTP stubado (cenários ok + unavailable), no padrão dos e2e existentes (sem Ollama real).
- Smoke manual documentado: comando `curl` contra o compose provando geração real com o Qwen (executado por humano, não pela suíte — ver FR-07 e seu porquê).

## 17. Documentation Impact

- `backend/.env.example`: `OLLAMA_URL`, `OLLAMA_CHAT_MODEL`, `OLLAMA_TIMEOUT_MS` (FR-03).
- Scalar/OpenAPI: automático via anotações (FR-08).
- Comandos de setup do modelo (pull) documentados onde o projeto já documenta setup (docker-compose/README do backend).

## 18. Acceptance Criteria

### AC-01 — Ambiente sobe com modelo funcional

Given: máquina limpa (sem volume anterior do ollama).
When: executado o fluxo de setup documentado (`compose up` + pull do modelo).
Then: o Ollama gera texto com `qwen2.5:7b` (prova via `curl` direto no Ollama ou via AC-03).

### AC-02 — Modelo sobrevive a restart

Given: modelo baixado e funcionando.
When: `docker compose down` seguido de `docker compose up` (sem `-v`).
Then: nenhum download novo é necessário e o health volta a `ok`.

### AC-03 — Health prova geração real

Given: ambiente do AC-01 no ar.
When: `GET /ai/health`.
Then: `{ status: 'ok', model: 'qwen2.5:7b' }`.

### AC-04 — Queda do Ollama não derruba nada

Given: backend no ar.
When: serviço `ollama` parado e `GET /ai/health` chamado (e demais rotas chamadas em seguida).
Then: health retorna `unavailable` (sem segredo, sem stack trace) e as rotas de CRUD seguem respondendo normalmente.

### AC-05 — Config ausente falha cedo e alto

Given: `OLLAMA_URL` (ou irmãs) ausente/inválida.
When: subir o backend.
Then: a subida aborta com mensagem clara de validação (Zod), antes de aceitar qualquer request.

### AC-06 — Suíte verde sem modelo no CI

Given: ambiente de CI sem Ollama, sem GPU, sem download de modelo.
When: `npm test` no backend.
Then: tudo verde (unit + integração + e2e), com o HTTP do Ollama stubado nos testes da fundação.

### AC-07 — Contrato documentado

Given: backend no ar.
When: abrir `GET /openapi.json` (ou `/docs`).
Then: `GET /ai/health` documentado com response e statuses.

## 19. Assumptions

### ASSUMPTION-01 — Modelo `qwen2.5:7b`

Descrição: o modelo da fundação é `qwen2.5:7b` (`OLLAMA_CHAT_MODEL` com esse default).
Justificativa: porte médio (~4.7GB), pt-BR bom nessa faixa, roda em CPU; sugestão já aceita na conversa.
Impacto caso esteja errada: trocar a tag exige novo download e re-smoke (AC-01/AC-03), sem mudar código.

### ASSUMPTION-02 — Timeout default de 60s

Descrição: `OLLAMA_TIMEOUT_MS` default `60000`.
Justificativa: CPU modesta pode levar dezenas de segundos na primeira geração (modelo frio); 60s evita falso-negativo no health.
Impacto caso esteja errada: ajuste de variável, sem código.

### ASSUMPTION-03 — `GET` com 200 + status interno no degradado

Descrição: provider indisponível retorna HTTP 200 com `{ status: 'unavailable' }` (alternativa `503` aceita sem quebrar o contrato de campos).
Justificativa: quem está doente é o provider, não o backend — 200 reflete "verificação executada com sucesso".
Impacto caso esteja errada: nenhum para os consumidores, que leem o campo `status`, não o código HTTP.

### ASSUMPTION-04 — Sem autenticação no health

Descrição: `GET /ai/health` público.
Justificativa: resposta sem segredos (BR-01); health autenticado complica smoke e diagnóstico.
Impacto caso esteja errada: adicionar `JwtAuthGuard` depois não quebra nada existente.

## 20. Questions for User

Nenhuma.

## 21. Requirement Traceability

| Requirement | Acceptance Criteria |
|---|---|
| FR-01 | AC-01, AC-02 |
| FR-02 | AC-01, AC-02, AC-03 |
| FR-03 | AC-05 |
| FR-04 | AC-03, AC-06 |
| FR-05 | AC-03, AC-04 |
| FR-06 | AC-04 |
| FR-07 | AC-06 |
| FR-08 | AC-07 |
| BR-01 | AC-04 |
| BR-02 | AC-04 |

## 22. Definition of Done

- `docker compose up` + setup documentado resultam em Qwen gerando texto (AC-01), persistente a restart (AC-02).
- `GET /ai/health` reflete geração real (AC-03) e degrada sem derrubar nada (AC-04).
- Env validada na subida (AC-05); contrato no `/docs` (AC-07).
- Backend `lint` + `tsc` + `npm test` (unit/integração/e2e) verdes sem Ollama no CI (AC-06).
- Nenhum segredo em response/log.

## Final Review

### Consistency

`PASSED`

### Checked

- [x] requisitos revisados
- [x] regras de negócio revisadas
- [x] fluxos revisados
- [x] critérios de aceite revisados
- [x] rastreabilidade revisada
- [x] conflitos com sistema atual revisados
- [x] perguntas pendentes revisadas

### Remaining Issues

`Nenhuma inconsistência conhecida.`

### Review Result

`SPEC internamente consistente e pronta para aprovação.`
