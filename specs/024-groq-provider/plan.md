# PLAN: Chat IA — provedor Groq

## Status

`DRAFT`

> SPEC em `DRAFT`. NÃO executar até aprovação da SPEC (`APPROVED` +
> Final Review `PASSED`) e promover este PLAN (`READY`) e as TASKS
> (`READY_FOR_IMPLEMENTATION`).

## Source Spec

`specs/024-groq-provider/spec.md` (DRAFT)

## 1. Implementation Strategy

Premissa: 022 implementada no working tree (provider Ollama, fila, worker) e 023 com
o `POST` no ar. Sobre essa base, em ordem: provider Groq + unit; seleção + pastas +
health + unit; fallback + logging + unit. Sem tocar em controller, service, gateway,
fila ou contrato. Testes com HTTP stubado, no padrão do `ollama.provider.spec.ts`.

## 2. Existing Components to Reuse

Somente reais:

- `LlmProvider` (`chat()` + `chatStream()` + `isAvailable()` + `LlmProviderError`)
  e `OllamaLlmProvider` como molde (HTTP direto, NDJSON, `toProviderError`).
- `AiModule` (`{ provide: LlmProvider, useClass }`) + `AiService.checkHealth`.
- `env.validation.ts` (Zod, falha na subida) + `env.validation.spec.ts`.
- `ollama.provider.spec.ts` (HTTP stubado) como molde dos testes.

## 3. Components Affected

- `backend/src/modules/ai/providers/ollama/` (mover provider + spec para cá).
- `backend/src/modules/ai/providers/groq/` (novo: `groq.provider.ts` + spec).
- `backend/src/modules/ai/providers/llm.provider.ts` (`modelName` + seleção + reason novo).
- `backend/src/modules/ai/providers/chained-llm.provider.ts` (novo: cadeia ordenada).
- `backend/src/modules/ai/ai.module.ts` (`useClass` da cadeia, sem fábrica).
- `backend/src/modules/ai/services/ai.service.ts` (model do provedor) + spec.
- `backend/src/config/env.validation.ts` + spec (vars Groq).
- `backend/.env.example` + `backend/README.md` (adiantados na 023).

## 4. Backend Changes

- `GroqLlmProvider` com HTTP direto em `https://api.groq.com/openai/v1/chat/completions`
  (sem SDK), `Authorization: Bearer`; `chat()` não-stream; `chatStream()` SSE (`data:` +
  `[DONE]`, chunk só com `role` ignorado); 401/403 → `unreachable`, 429 →
  `rate_limited` (novo, interno), 404 → `model_not_found`, abort → `timeout`.
- Cadeia num provider só (`ChainedLlmProvider`): com key → `[groq, ollama]`, sem key →
  `[ollama]`, Ollama sempre por último; log único da ordem no boot; 429 anda para o
  próximo (uma vez por nível, com log da troca), demais erros sem troca; transparente
  ao processor; adicionar provedor novo é entrar na cadeia.
- `AiService`: `model` do provedor injetado.
- Key nunca em log/response/payload/job/evento.

## 5. Frontend Changes

Nenhuma.

## 6. Database Changes

Nenhuma (sem migration, sem índice).

## 7. API Changes

Nenhuma rota nova; `GET /ai/health` mantém o formato com o `model` do ativo.

## 8. Authorization / Security Implementation

Sem auth nova. Key só no `Authorization`; 401/403 sem detalhar credencial; logs sem
segredo, cookie, pergunta, resposta ou prompt.

## 9. Performance / Concurrency Requirements

Sem fila nova, sem cache, sem cascata. `GROQ_TIMEOUT_MS` 60s.

## 10. Error Handling

| Caso | Resposta |
|---|---|
| Groq ok | resposta normal |
| Groq 429 | repete no Ollama (com log); vale o resultado dele |
| Groq 401/403/timeout/malformado | mapeamento normal, sem troca |
| Ollama falha no fallback | erro dele (`failed` + evento) |

## 11. Tests Strategy

Unit com HTTP stubado (ok, 401, 429→fallback→ok, 429→fallback→falha, timeout, stream);
seleção com/sem key; env; health; logger sem segredo. Sem Groq real, sem rede, sem
timing real. Cadeia: `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build`.

## 12. Documentation Updates

`.env.example` + README adiantados na 023; conferir na validação final.

## 13. Implementation Order

1. Provider Groq + unit.
2. Seleção + pastas + health + unit.
3. Fallback + logging + unit + cadeia final.

## 14. Technical Decisions

### TD-01 — Seleção determinística, fallback só no limite

Problema: qual provedor e quando trocar. Decisão: boot decide (key → Groq); só o 429
repete no Ollama, uma vez, com log. Motivo: observável, sem mascarar config quebrada.

### TD-02 — HTTP direto sem SDK, SSE tolerante

Problema: como falar com o Groq. Decisão: `fetch` direto; chunk sem `content` ignorado
(a API abre o stream assim); JSON inválido segue `bad_response`. Motivo: menor
dependência; parse fiel ao formato real.

## 15. Things We Will NOT Do

- Troca de provedor em runtime fora do 429; cascata de retries.
- SDK do Groq; fila nova; cache; rota nova; migration; frontend.
- Refactor do Ollama além de mover de pasta.

---

## Final Review

### Consistency

`PASSED` (validado na execução das TASKS 01–04)

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

`Um refino pós-escrita, dentro do escopo: fábrica + composição fundidas num provider
só em cadeia (ChainedLlmProvider, Ollama por último) — contrato e ACs intactos,
docs atualizados junto.`

### Known Risks

- Nomes de modelos do tier gratuito mudam; `GROQ_MODEL` por env absorve sem código.
- 022/023 vivem no working tree não commitado; drift se mudarem (não mudaram durante a 024).

### Review Result

`PLAN validado na implementação. Promoção a READY pendente de aprovação formal.`
