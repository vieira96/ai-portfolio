# TASKS: Fundação de IA (Ollama + Qwen no Docker)

## Status

`READY_FOR_IMPLEMENTATION`

## Sources

SPEC:
`specs/020-ai-foundation/spec.md`

PLAN:
`specs/020-ai-foundation/plan.md`

---

## Tasks

### [x] TASK-01 — Ollama no compose com modelo Qwen funcional

#### Objective

`docker compose up` sobe o Ollama com `qwen2.5:7b` gerando texto de verdade, persistido em volume.

#### Requirements

- FR-01
- FR-02

#### Acceptance Criteria

- AC-01
- AC-02

#### Depends On

`Nenhuma`

#### Implementation Notes

Compose em `backend/docker/docker-compose.yml`: serviço `ollama` (`image: ollama/ollama`, `OLLAMA_HOST=0.0.0.0`, volume `ollama-data:/root/.ollama`, porta `11434`, `restart: unless-stopped`); `backend` ganha `depends_on` (`service_started`) + `environment` (`OLLAMA_URL=http://ollama:11434`, `OLLAMA_CHAT_MODEL=qwen2.5:7b`, `OLLAMA_TIMEOUT_MS=60000`). Pull via `docker exec <container> ollama pull qwen2.5:7b`; prova com `curl http://localhost:11434/api/generate -d '{"model":"qwen2.5:7b","prompt":"ping","stream":false}'`; prova de persistência com `down`/`up` sem `-v` + `ollama list`.

#### Definition of Done

- `curl /api/generate` retorna texto gerado pelo Qwen.
- Após `down`/`up`, nenhum download novo e geração segue OK.
- Nenhum outro serviço do compose afetado (`backend`, `postgres`, `redis` sobem como antes).

---

### [x] TASK-02 — Variáveis do provider validadas por Zod

#### Objective

Sem `OLLAMA_URL`/`OLLAMA_CHAT_MODEL` válidas o backend nem sobe; com elas, sobe normal.

#### Requirements

- FR-03

#### Acceptance Criteria

- AC-05

#### Depends On

- TASK-01

#### Implementation Notes

`backend/.env.example` ganha as 3 vars (URL `http://localhost:11434`, model `qwen2.5:7b`, timeout `60000`); `backend/src/config/env.validation.ts`: URL e model obrigatórios (`min(1)`; URL em formato de URL), timeout `coerce.number().int().positive().default(60000)`; sem defaults para URL/model (é o que faz AC-05 valer). Atualizar `.env` local a partir do example. Casos novos em `src/config/env.validation.spec.ts`.

#### Definition of Done

- Backend aborta na subida com mensagem Zod clara sem as vars; sobe com elas.
- `env.validation.spec.ts` verde com os casos novos.
- `npm run lint` + `npx tsc --noEmit` verdes.

---

### [x] TASK-03 — `LlmProvider` + implementação Ollama com timeout

#### Objective

Ponto único de acesso ao LLM via HTTP direto, com timeout configurável e erros mapeados (nunca exceção crua).

#### Requirements

- FR-04
- FR-06

#### Acceptance Criteria

- AC-06

#### Depends On

- TASK-02

#### Implementation Notes

`backend/src/modules/ai/providers/llm.provider.ts` (classe abstrata como token DI + tipos) e `ollama.provider.ts` (`@Injectable`, `ConfigService.getOrThrow` no construtor, `fetch` POST `/api/generate` com `{ model, prompt, stream: false }` + `AbortSignal.timeout`). Mapear: conexão recusada, `model not found`, timeout/`AbortError`, JSON malformado → erro tratado tipado. Unit `ollama.provider.spec.ts` com `fetch` global stubado cobrindo os 5 cenários + montagem correta da chamada.

#### Definition of Done

- Unit verde nos 5 cenários; nenhuma exceção de `fetch` escapa do provider.
- `npm run lint` + `npx tsc --noEmit` verdes; nenhuma dependência npm nova.

---

### [x] TASK-04 — `AiModule` com `GET /ai/health`

#### Objective

`GET /ai/health` público retorna disponibilidade real do modelo (geração de verdade, não porta aberta).

#### Requirements

- FR-05
- FR-08
- BR-01
- BR-02

#### Acceptance Criteria

- AC-03
- AC-07

#### Depends On

- TASK-03

#### Implementation Notes

`ai.module.ts` (`controllers: [AiController]`, `providers: [{ provide: LlmProvider, useClass: OllamaLlmProvider }, AiService]`, `exports: [LlmProvider]`); `controllers/ai.controller.ts` (`@Controller('ai')`, `@Get('health')`, sem guard, com `@ApiTags/@ApiOperation/@ApiResponse`); `services/ai.service.ts` (`checkHealth()` com probe mínimo, nunca lança — indisponibilidade vira `{ status: 'unavailable', model }`); `dto/ai-health-response.dto.ts` (`@ApiProperty`); registrar `AiModule` em `app.module.ts`; log de motivo categórico via `PinoLogger` (sem URL/prompt/corpo). Resposta default 200 + campo `status` (ASSUMPTION-03). Unit `ai.service.spec.ts` (provider OK → `ok`; provider falhando → `unavailable`, sem lançar).

#### Definition of Done

- Com compose no ar: `GET /ai/health` → `{ status: 'ok', model: 'qwen2.5:7b' }`.
- `GET /openapi.json` contém `/ai/health`; visível no `/docs`.
- `npm run lint` + `npx tsc --noEmit` verdes.

---

### [x] TASK-05 — E2E do health (ok + unavailable) sem Ollama real

#### Objective

Suíte prova o wiring real do módulo nos dois cenários sem precisar de modelo no CI.

#### Requirements

- FR-07

#### Acceptance Criteria

- AC-06

#### Depends On

- TASK-04

#### Implementation Notes

`backend/src/modules/ai/ai.e2e-spec.ts` no padrão `setupTestApp`/`teardownTestApp`; `fetch` global stubado (`vi.stubGlobal` + `vi.unstubAllGlobals`), provider REAL injetado (TD-04); cenários `ok` e `unavailable`. O helper já injeta `OLLAMA_URL`/`OLLAMA_CHAT_MODEL` dummy para o boot passar (TD-D1 no PLAN); sobrescrever via `process.env` no spec somente se o cenário exigir.

#### Definition of Done

- `npm test` (unit + integração + e2e) verde sem Ollama rodando e sem download de modelo.

---

### [x] TASK-06 — Validação final e provas manuais

#### Objective

Fechar a fundação com todas as provas manuais da SPEC + suíte completa verde + docs de setup.

#### Requirements

- FR-02
- FR-08
- BR-01
- BR-02

#### Acceptance Criteria

- AC-02
- AC-04
- AC-07

#### Depends On

- TASK-05

#### Implementation Notes

Provas manuais: restart sem re-download (AC-02, se já provado na TASK-01 apenas referenciar); `docker compose stop ollama` → health `unavailable` sem segredo/stack + CRUDs OK → `start` volta a `ok` (AC-04); `/openapi.json` + `/docs` (AC-07). Documentar pull + smoke `curl` no README do backend (onde já há setup). Rodar cadeia final: `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build`.

#### Definition of Done

- Todas as AC-01..AC-07 verificadas (automatizadas ou manuais referenciadas).
- `lint` + `tsc` + `npm test` + `build` verdes; docs de setup atualizadas.
- Nenhum segredo em response/log; nenhuma tabela nova; nenhuma rota além do health.

---

## Final Review

### Consistency

`PASSED`

### Checked

- [x] cobertura da SPEC revisada
- [x] cobertura do PLAN revisada
- [x] dependências entre TASKS revisadas
- [x] responsáveis revisados
- [x] referências FR/BR/AC revisadas
- [x] Definition of Done revisadas
- [x] escopo revisado
- [x] nenhuma TASK nasceu concluída
- [x] ordem de execução revisada

### Uncovered Requirements

`Nenhum.`

### Orphan Tasks

`Nenhuma.`

### Review Result

`TASKS consistentes com SPEC + PLAN e prontas para execução.`

## Implementation Handoff

Fontes:

SPEC:
`specs/020-ai-foundation/spec.md`

PLAN:
`specs/020-ai-foundation/plan.md`

TASKS:
`specs/020-ai-foundation/tasks.md`

Todos os documentos passaram por revisão documental.

Na implementação:

1. reler SPEC;
2. reler PLAN;
3. reler TASKS;
4. confirmar que o projeto não mudou de forma incompatível;
5. executar as TASKS;
6. marcar tasks concluídas somente após validar sua Definition of Done.

Se existir conflito entre documentação e projeto real:

PARE e informe.
