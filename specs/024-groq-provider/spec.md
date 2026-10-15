# SPEC (backend): Chat IA — provedor Groq

## Status

`DRAFT`

> Status `DRAFT` — NÃO implementar até revisão e aprovação (`APPROVED` com Final
> Review `PASSED`, PLAN `READY`, TASKS `READY_FOR_IMPLEMENTATION`).

## 1. Context

O chat roda hoje só no Ollama local (`AiModule` provê `OllamaLlmProvider` como
`LlmProvider`; `GET /ai/health` responde `{status, model}` com o modelo local).
Geração com contexto cheio em CPU estoura timeouts (023 ASSUMPTION-06: tentativas
reais morreram em ~60s e ~120s). O Groq (tier gratuito, OpenAI-compatible) responde
em segundos. Esta SPEC pluga o Groq como provedor principal, com o Ollama de
fallback só no limite — sem tocar em controller, service, gateway, fila ou contrato.

## 2. Requested Feature

Escopo: backend. Com `GROQ_API_KEY` configurada, o `LlmProvider` ativo passa a ser o
Groq; sem a key, segue o Ollama. Seleção determinística no boot, sem troca em
runtime — exceto rate limit do Groq (429), que repete uma vez no Ollama local.
Todo erro de LLM é registrado em log com `reason` + `model` (+ `messageId` quando
houver), sem segredo nem conteúdo.

## 3. Goal

Com a key configurada, `POST /chat/messages` responde em segundos via Groq e
`GET /ai/health` mostra o modelo Groq; no teto gratuito, a pergunta cai para o Ollama
com a troca registrada em log; sem a key, tudo funciona como antes.

## 4. Current System

Somente componentes reais:

- `LlmProvider` (`chat()` + `chatStream()` + `isAvailable()` + `LlmProviderError`
  com `reason`) e `OllamaLlmProvider` (HTTP direto, NDJSON) em
  `backend/src/modules/ai/providers/`.
- `AiModule` (`{ provide: LlmProvider, useClass: OllamaLlmProvider }`); `AiService`
  lê o model de `OLLAMA_CHAT_MODEL`.
- Env validada por Zod (`OLLAMA_*` obrigatórias, `REDIS_URL`, JWT, seed).
- `.env.example` e README já documentam o bloco Groq (adiantado).

## 5. Existing Behavior

Reutilizado sem mudança: validação, enqueue, worker, stream, eventos, rooms, contrato
HTTP. O Ollama continua funcionando igual quando o Groq está desligado.

## 6. Functional Requirements

### FR-01 — Provedor Groq OpenAI-compatible

`GroqLlmProvider` com HTTP direto em `https://api.groq.com/openai/v1/chat/completions`
(sem SDK): `chat()` + `chatStream()` SSE (`data:` + `[DONE]`, chunk inicial só com
`role` ignorado, não erro) + `isAvailable()`. Mapeamento: 401/403 → `unreachable`,
429 → `rate_limited` (novo, interno: só decide o fallback, nunca chega ao socket),
404 → `model_not_found`, abort → `timeout`, resto → `bad_response`. Key só no header
`Authorization`, nunca em log, response, payload ou erro.

**Por que precisa:** mesma regra do Ollama (HTTP direto, sem SDK); o 429 separado
permite o fallback sem confundir limite com queda.

### FR-02 — Seleção no boot, pastas por provedor, health honesto

Key presente e não vazia → Groq (principal); senão Ollama. Um diretório por provedor:
`providers/ollama/` (mover provider + spec) e `providers/groq/` (novos); contrato
(`llm.provider.ts` + `modelName` + regra de seleção) na raiz de `providers/`.
`AiService` lê o `model` do provedor injetado; log único do provedor ativo no boot.

**Por que precisa:** seleção visível (health + log) em vez de implícita; pastas
separam o que muda por provedor do contrato compartilhado.

### FR-03 — Fallback no limite + log de todo erro

429 do Groq → uma repetição no Ollama, dentro do mesmo job, com log da troca (status
recebido, sem key); demais erros sem troca. Se o Ollama também falhar, vale o erro
dele. Todo erro de LLM/fila/worker vai ao log com `reason` + `model` (+ `messageId`
quando houver); nunca chave, cookie, pergunta, resposta ou prompt.

**Por que precisa:** Ollama local não tem cota — fallback só no limite une velocidade
com disponibilidade sem mascarar erro de config (401 nunca troca); log completo
permite debugar sem expor segredo.

## 7. Business Rules

### BR-01 — Regras anteriores continuam valendo

pt-BR, LLM sem SQL, contexto como dado, sem segredo em evento/log/payload/job,
`visitorId` só do cookie, sem `GET :id` nem delete (022/023).

## 8. User Flow

1. Sem key: boot normal, Ollama ativo, tudo como antes.
2. Com key: boot loga provedor Groq; `POST` gera em segundos; health mostra o modelo Groq.
3. No teto: 429 → repete no Ollama com log; resposta chega (mais lenta).
4. Key inválida (401): falha honesta, sem troca silenciosa.

## 9. API Contract

Nenhuma rota nova, nenhum campo novo. `GET /ai/health` mantém o formato; o campo
`model` reflete o provedor ativo.

## 10. Data Requirements

Nenhum dado novo: sem tabelas, sem migrations, sem colunas.

## 11. Validation

Env (`env.validation.ts`, falha na subida como as demais): `GROQ_API_KEY` opcional
(ausente/vazia = Groq desligado); `GROQ_MODEL` default `openai/gpt-oss-120b`;
`GROQ_TIMEOUT_MS` default 60s.

## 12. Authorization

Nada muda: canal anônimo por cookie; sem `JwtAuthGuard` novo.

## 13. Error Scenarios

- Sem key → Ollama, boot sem erro.
- 429 → fallback uma vez; Ollama ok → `done`; Ollama falha → erro dele.
- 401/403 → `MODEL_UNAVAILABLE` honesto, sem troca.
- Timeout/abort → `TIMEOUT`; stream malformado → `MODEL_UNAVAILABLE`.

## 14. Security Requirements

- BR-01.
- Key só no `Authorization` para o Groq; 401/403 sem detalhar credencial; nada de
  segredo em log, response, job ou evento.

## 15. Performance / Concurrency Requirements

Sem fila nova, sem cache, sem retry em cascata (uma repetição por pergunta, dentro do
mesmo job). `GROQ_TIMEOUT_MS` 60s (resposta em segundos, sem contexto pesado local).

## 16. Tests / Expected Behaviors

Comportamentos a proteger (sem código de teste aqui):

- Provider com HTTP stubado: ok, 401, 429, timeout, stream (chunks, `[DONE]`, chunk só
  de `role`, JSON inválido → `bad_response`).
- Seleção: com key → Groq; sem/vazia → Ollama; `modelName` correto em cada um.
- Fallback: 429 → Ollama ok (`done`); 429 → Ollama falha (erro dele); 401 sem troca.
- Env: defaults aplicados, key opcional, boot sem key.
- Health com `modelName` mockado; logger recebe `reason` + `model` sem segredo.
- Nada na suíte depende de Groq real, rede externa ou timing real.

## 17. Documentation Impact

- `.env.example` (bloco Groq) e README (seção Groq com link da key) — adiantados na 023.
- Scalar/OpenAPI: sem mudança (sem rota nova).

## 18. Acceptance Criteria

### AC-01 — Com key, o Groq responde e o health mostra o modelo dele

Given: `GROQ_API_KEY` configurada.
When: `POST /chat/messages` válida e depois `GET /ai/health`.
Then: resposta via Groq (rápida); health `{ status: "ok", model: "<modelo Groq>" }`.

### AC-02 — Sem key, segue Ollama sem mudar nada

Given: `GROQ_API_KEY` ausente ou vazia.
When: subir o backend e usar o chat.
Then: boot sem erro; Ollama ativo; contrato e fluxos idênticos.

### AC-03 — Limite cai para o Ollama, com log

Given: key configurada; Groq responde 429.
When: `POST` válida.
Then: `done` via Ollama; log com a troca (429 → ollama), sem key.

### AC-04 — Todo erro gera log sem segredo

Given: provedor ou fila falhando.
When: qualquer falha (401, timeout, fila fora, erro no stream).
Then: log com `reason` + `model` (+ `messageId`); sem chave, cookie, pergunta ou resposta.

## 19. Assumptions

### ASSUMPTION-01 — Modelo default do tier gratuito

Descrição: `openai/gpt-oss-120b`, via env.
Justificativa: ajustável sem código quando a lista gratuita mudar.
Impacto se errada: trocar a var, sem código.

### ASSUMPTION-02 — Sem fallback fora do 429, sem cascata

Descrição: uma repetição por pergunta, mesmo job; 401/403 nunca trocam.
Justificativa: contém custo e não mascara config quebrada.
Impacto se errada: ajuste de regra, sem migração.

## 20. Definition of Done

- Groq responde com key (AC-01); sem key tudo igual (AC-02).
- Fallback no limite com log (AC-03); todo erro logado sem segredo (AC-04).
- `lint` + `tsc --noEmit` + `npm test` verdes, sem Groq real nem rede na suíte.
- Sem SDK novo, sem migration nova, sem segredo em log/response/job/evento.
- Pastas por provedor aplicadas (`ollama/`, `groq/`).

## Final Review

### Consistency

`PASSED` (validado na execução das TASKS 01–04, incluindo refino fábrica→cadeia)

### Checked

- [x] requisitos revisados
- [x] regras de negócio revisadas
- [x] fluxos revisados
- [x] critérios de aceite revisados
- [x] conflitos com sistema atual revisados

### Remaining Issues

`Nenhuma inconsistência.`

### Review Result

`SPEC validada na implementação. Promoção a APPROVED pendente de aprovação formal.`
