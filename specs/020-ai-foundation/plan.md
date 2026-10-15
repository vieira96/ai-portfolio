# PLAN: Fundação de IA (Ollama + Qwen no Docker)

## Status

`READY`

## Source Spec

`specs/020-ai-foundation/spec.md` (APPROVED)

## 1. Implementation Strategy

Subir o Ollama como serviço do compose com o modelo Qwen persistido em volume, expor as três variáveis no schema Zod (falha cedo na subida), e criar o módulo `ai` mínimo: interface `LlmProvider` + implementação HTTP direta (sem SDK) + `GET /ai/health` que prova geração real. Testes com HTTP stubado (unit + e2e com wiring real); prova contra o modelo de verdade via smoke manual documentado. Nenhuma dependência npm nova, nenhuma migration, nenhum frontend.

## 2. Existing Components to Reuse

Somente componentes reais (confirmados em 06/10/2026):

- `backend/docker/docker-compose.yml` — padrão de serviço com `restart: unless-stopped`, volumes nomeados (`postgres-data`), `depends_on` com condição e override de env via `environment` (ex: `DATABASE_URL` com host `postgres`).
- `backend/src/config/env.validation.ts` — schema Zod + `validateEnv` ligado em `ConfigModule.forRoot({ isGlobal: true, validate })`; falha na subida com mensagem agregada.
- `backend/src/app.module.ts` — registra módulos de domínio; `ConfigModule` já é global (módulo novo não precisa importá-lo).
- `backend/src/modules/auth/auth.module.ts` — formato de módulo (controllers/providers/exports); `ConfigService.getOrThrow` como fonte de config (usado no `JwtModule.registerAsync`).
- `nestjs-pino` (`PinoLogger`, já injetado em `ProjectsService`) para o log de motivo sem segredos.
- `backend/src/main.ts` — `ValidationPipe`, `GlobalExceptionFilter`, Scalar em `/docs`, `openapi.json`; nada a mudar aqui.
- `backend/test/helpers/e2e-setup.helper.ts` — `setupTestApp`/`teardownTestApp` (postgres efêmero); override de `ConfigService` lê `process.env`, então vars de teste vão por `process.env` no próprio spec.
- `fetch` global + `AbortSignal.timeout` (Node 22, sem dependência).

## 3. Components Affected

- `backend/docker/docker-compose.yml` (novo serviço + `depends_on` + env).
- `backend/.env.example` (+ 3 vars) e `.env` local do dev (copiar do example).
- `backend/src/config/env.validation.ts` (+ 3 entradas; teste em `src/config/env.validation.spec.ts` já existe e ganha casos).
- Novo `backend/src/modules/ai/` (module, controller, service, providers, dto, specs).
- `backend/src/app.module.ts` (registrar `AiModule`).
- `backend/README.md` (ou seção de setup existente): comandos de pull + smoke `curl` (onde o projeto já documenta setup).

## 4. Backend Changes

Estrutura nova (espelha `auth/`/`projects/` por responsabilidade):

```text
backend/src/modules/ai/
├── ai.module.ts
├── ai.e2e-spec.ts
├── controllers/
│   └── ai.controller.ts        (@Controller('ai'), @Get('health'), sem guard)
├── services/
│   └── ai.service.ts           (checkHealth(): monta probe, mapeia p/ ok/unavailable, nunca lança)
├── dto/
│   └── ai-health-response.dto.ts (@ApiProperty status/model)
└── providers/
    ├── llm.provider.ts         (token DI como classe abstrata + tipos LlmProbeResult)
    └── ollama.provider.ts      (@Injectable, fetch POST /api/generate stream:false, AbortSignal.timeout)
```

- `AiModule`: `controllers: [AiController]`, `providers: [{ provide: LlmProvider, useClass: OllamaLlmProvider }, AiService]`, `exports: [LlmProvider]` (consumidores futuros — chat — injetam o token, nunca o Ollama direto).
- `OllamaLlmProvider` lê `OLLAMA_URL`/`OLLAMA_CHAT_MODEL`/`OLLAMA_TIMEOUT_MS` via `ConfigService.getOrThrow` no construtor (falha cedo se inválido, coerente com FR-03/AC-05).
- Mapeamento de erro (todos → indisponível, nunca exceção para fora do health): conexão recusada, `404 model not found`, timeout (`AbortError`), resposta malformada. Motivo categórico logado via `PinoLogger` (ex: `ollama_unreachable`, `model_not_found`, `timeout`) + nome do modelo — nunca URL, prompt ou corpo (BR-01).
- `AiService.checkHealth()`: chama `chat()` com prompt mínimo de probe; sucesso com texto não-vazio → `{ status: 'ok', model }`; qualquer erro do provider → `{ status: 'unavailable', model }`.
- Sem `@UseGuards` no health (público por ASSUMPTION-04); sem `ValidationPipe` relevante (GET sem body); erros inesperados caem no `GlobalExceptionFilter` padrão.

## 5. Frontend Changes

Nenhuma. (Health é consumido por `curl`/docs/monitoramento nesta fundação.)

## 6. Database Changes

Nenhuma. Sem tabelas, migrations ou colunas. Persistência envolvida: volume Docker `ollama-data` (modelos), fora do banco.

## 7. API Changes

- Nova: `GET /ai/health` → `{ status: 'ok' | 'unavailable', model: string }` (SPEC §9; default 200 + status interno, `503` aceito sem quebrar campos).
- Nenhuma rota existente alterada.

## 8. Authorization / Security Implementation

- Health público por decisão (resposta sem segredos); demais padrões intactos (guard opt-in por rota, sem `APP_GUARD` global — nada a mexer).
- Compose: porta `11434` publicada no mesmo regime de `postgres`/`redis` (desenvolvimento local); nenhuma credencial em compose, example ou log.
- `.env` local continua fora do git (padrão); só o `.example` é versionado.

## 9. Performance / Concurrency Strategy

- `AbortSignal.timeout(OLLAMA_TIMEOUT_MS)` em toda chamada (FR-06); sem fila/pool/cache (health esporádico, sem tráfego real).
- Risco conhecido: primeira geração com modelo frio em CPU pode levar dezenas de segundos — mitigado pelo timeout de 60s e pelo prompt de probe mínimo (ex: `"ping"`).

## 10. Error Handling

Integração ao padrão atual: provider nunca deixa exceção de `fetch` escapar (mapeia para resultado tipado); service nunca lança no health; o inesperado cai no `GlobalExceptionFilter` (`{ statusCode, message, timestamp }`, sem stack). Mesmo formato dos demais módulos, sem filtro novo.

## 11. Tests Strategy

- Unit (`*.spec.ts` colocados): `ollama.provider.spec.ts` (montagem da chamada: URL/modelo/`stream:false`/timeout; cenários: ok, conexão recusada, 404 model, timeout, JSON malformado — `fetch` global stubado); `ai.service.spec.ts` (provider OK → `ok`; provider falhando → `unavailable`); casos novos em `env.validation.spec.ts` (vars ausentes/inválidas rejeitadas, timeout default aplicado).
- E2E (`ai.e2e-spec.ts`, padrão `setupTestApp`/`teardownTestApp`): `GET /ai/health` com `fetch` global stubado (`vi.stubGlobal` + `vi.unstubAllGlobals`), provider REAL injetado (prova o wiring do módulo); cenários ok + unavailable. O helper injeta `OLLAMA_URL`/`OLLAMA_CHAT_MODEL` com valores dummy só para o Zod passar no boot (ver Technical Drift TD-D1); o spec sobrescreve via `process.env` somente se o cenário exigir.
- Sem testcontainers para Ollama, sem modelo no CI (FR-07/AC-06).
- Validação: `npm run lint` (oxlint), `npx tsc --noEmit`, `npm test` (unit+integração+e2e), `npm run build`, `curl /openapi.json` contendo `/ai/health`.

## 12. Documentation Updates

- `backend/.env.example`: `OLLAMA_URL="http://localhost:11434"`, `OLLAMA_CHAT_MODEL="qwen2.5:7b"`, `OLLAMA_TIMEOUT_MS=60000` (localhost no example, espelhando `DATABASE_URL`; compose sobrescreve para `http://ollama:11434`, mesmo regime do banco).
- Comandos de setup do modelo + smoke `curl` onde o projeto já documenta setup (README do backend), sem sistema novo de docs.
- Scalar/OpenAPI: automático (FR-08).

## 13. Implementation Order

Ordem técnica recomendada:

1. Compose (`ollama: image ollama/ollama, environment OLLAMA_HOST=0.0.0.0, volume ollama-data:/root/.ollama, ports 11434, restart unless-stopped; backend depends_on ollama service_started + environment OLLAMA_URL=http://ollama:11434, OLLAMA_CHAT_MODEL=qwen2.5:7b, OLLAMA_TIMEOUT_MS=60000) + `.env.example` + schema Zod → `up`, `ollama pull qwen2.5:7b`, prova `curl /api/generate` gerando texto (FR-01/FR-02/FR-03, AC-01).
2. Interface + `OllamaLlmProvider` + unit (FR-04/FR-06).
3. `AiModule` + service + controller + DTO + registro no `AppModule` (FR-05/FR-08).
4. E2E ok/unavailable + `env.validation.spec.ts` (FR-07, AC-05/AC-06).
5. Provas manuais: restart sem re-download (AC-02), `stop ollama` → `unavailable` + CRUDs OK (AC-04), `/openapi.json` (AC-07), docs de setup.
6. Validação final: lint + tsc + `npm test` + build.

## 14. Technical Decisions

### TD-01 — HTTP via `fetch` global em vez de `@nestjs/axios`

Problema: como chamar a API do Ollama.
Opções: (a) `fetch` global + `AbortSignal.timeout`; (b) `HttpModule`/`axios` (nova dep).
Decisão: (a).
Motivo: stdlib do Node 22, zero dependência, suficiente para um POST JSON com timeout.
Trade-off: sem interceptors/retries prontos — irrelevante aqui (sem retry nesta fundação).

### TD-02 — Probe via `/api/generate` em vez de `/api/chat`

Problema: qual endpoint do Ollama prova geração.
Opções: (a) `/api/generate` (prompt string única); (b) `/api/chat` (messages[]).
Decisão: (a) com prompt mínimo e `stream: false`.
Motivo: ping mais simples e leve; `/api/chat` só faz sentido quando houver conversa real.
Trade-off: quando o chat chegar, a interface ganha a forma de mensagens por extensão — os chamadores seguem dependendo do token, não da classe concreta, então nada existente é reescrito.

### TD-03 — Health responde 200 + campo `status`

Problema: código HTTP quando o provider está indisponível.
Opções: (a) 200 + `{ status: 'unavailable' }`; (b) 503.
Decisão: (a) (default da ASSUMPTION-03).
Motivo: quem está doente é o provider, não o backend; consumidores leem o campo.
Trade-off: monitor que só olha código HTTP precisa ler o corpo — aceito e documentado.

### TD-04 — E2E com `fetch` stubado + provider real

Problema: como provar o wiring sem Ollama no CI.
Opções: (a) stubar `fetch` global e manter provider real; (b) provider fake via override.
Decisão: (a).
Motivo: testa DI, controller e mapeamento de verdade; unit cobre os edge cases do provider.
Trade-off: stub global exige `unstub` disciplinado no spec.

### TD-05 — Token DI como classe abstrata

Problema: como injetar a interface `LlmProvider` (interfaces somem em runtime).
Opções: (a) `abstract class LlmProvider` como token; (b) `Symbol`/string.
Decisão: (a).
Motivo: padrão Nest idiomático, tipado, sem dep extra.
Trade-off: nenhum relevante.

### TD-06 — Subpasta `providers/` no módulo `ai`

Problema: onde moram interface e implementação.
Opções: (a) `modules/ai/providers/`; (b) tudo em `services/`.
Decisão: (a) (`llm.provider.ts` tipos+token, `ollama.provider.ts` implementação).
Motivo: espelha a separação por responsabilidade do projeto (dto/controllers/services/repositories); provider não é service de domínio nem repository.
Trade-off: subpasta nova com 2 arquivos — mínimo necessário.

### TD-D1 — Extensão do helper e2e com defaults `OLLAMA_*` (Technical Drift)

O que mudou: o PLAN original previa não tocar `e2e-setup.helper.ts`, com cada spec provendo suas vars via `process.env`.
Evidência: todo e2e importa o `AppModule`, e o `ConfigModule` valida o Zod no import — com `OLLAMA_*` obrigatórias no schema, os 6 e2e antigos quebrariam no CI (que não tem `.env`), não só o novo do `ai`.
Adaptação: extensão aditiva no helper (`OLLAMA_URL`/`OLLAMA_CHAT_MODEL` com valores dummy + save/restore), sem mudar assinatura nem comportamento existente.
Impacto: nenhum na SPEC (em produção/dev as vars seguem obrigatórias e sem default; AC-05 intacto).

## 15. Things We Will NOT Do

- Instalar SDK (`ollama` npm, `axios`, `openai`, `langchain`) ou `HttpModule`.
- Testcontainers para Ollama; download de modelo em teste/CI.
- Healthcheck custom no compose além do padrão dos serviços; GPU/runtime flags.
- `POST /ai/chat`, streaming, persistência, fila, cache, segundo modelo, frontend.
- Refactor do `main.ts` ou de módulos existentes (fora do `ai`).
- Redesenho do helper e2e compartilhado (a extensão aditiva com defaults de teste foi feita na TASK-02, ver TD-D1).
- Retry/backoff na chamada (sem requisito; timeout basta).

---

## Final Review

### Consistency

`PASSED`

### Checked

- [x] compatibilidade com SPEC
- [x] compatibilidade com projeto real
- [x] arquitetura revisada
- [x] backend revisado quando aplicável
- [x] frontend revisado quando aplicável
- [x] banco revisado quando aplicável
- [x] segurança revisada
- [x] performance e concorrência revisadas
- [x] estratégia de testes revisada
- [x] overengineering revisado

### Deviations from SPEC

`Nenhuma.`

### Known Risks

- Download do modelo (~4.7GB) na primeira execução — tempo de setup, mitigado por volume persistente (AC-02).
- Primeira geração com modelo frio em CPU pode ser lenta — mitigada por prompt de probe mínimo + timeout de 60s.
- `AbortSignal.timeout` exige Node 22+ — garantido (`.nvmrc` + imagem `node:22-bookworm-slim`).

### Review Result

`PLAN consistente com a SPEC aprovada e com o estado atual conhecido do projeto.`
