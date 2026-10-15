# PLAN: CORS para o frontend (origens por env)

## Status

`READY`

## Source Spec

`specs/028-backend-cors/spec.md` (APPROVED)

## 1. Implementation Strategy

Premissa: `main.ts` sem CORS (verificado); env validada por Zod com falha na
subida. Ordem: parse + env com unit → `enableCors` + cobertura do socket → prova
`curl` nos dois caminhos + fluxo no browser.

## 2. Existing Components to Reuse

Somente reais: `main.ts` (bootstrap, `IoAdapter`, middlewares), `env.validation.ts`
(Zod + `env.validation.spec.ts`), `.env.example`.

## 3. Components Affected

- `backend/src/config/env.validation.ts` (`CORS_ORIGINS: string[]` via split +
  validação por item) + spec.
- `backend/src/main.ts` (`enableCors({ origin, credentials: true })` + cors no
  adapter do socket se o handshake não devolver os headers).
- `backend/.env.example` (exemplo com 2 origens).

## 4. Backend Changes

- Parse na validação (não no `main`): vírgula → apara → ignora vazio → cada item
  URL válida ou boot aborta nomeando a var.
- `origin` recebe a lista (nunca `*`, nunca echo do request); `credentials: true`.
- Socket: confere header no polling; faltando, configura no adapter.

## 5. Frontend Changes

Nenhuma (front já manda `credentials`).

## 6. Database Changes

Nenhuma.

## 7. API Changes

Nenhuma (só headers).

## 8. Authorization

Nada muda; CORS não é auth.

## 9. Performance Requirements

Sem impacto (headers estáticos; preflight cacheado).

## 10. Error Handling

Env inválida → boot aborta (Zod). Origem fora da lista → browser bloqueia (correto).

## 11. Tests Strategy

Unit do parse (uma, várias, espaços, vazios, inválida) + prova manual `curl` REST +
socket + fluxo no browser. Cadeia: `lint` + `tsc` + `npm test`.

## 12. Documentation Updates

`.env.example`; README só se preciso.

## 13. Implementation Order

1. Env + parse + unit.
2. `enableCors` + socket + prova `curl`.
3. Fluxo no browser + cadeia.

## 14. Technical Decisions

### TD-01 — Parse no Zod, não no `main`

Problema: onde transformar a string em lista. Decisão: `z.transform` + validação
por item na env. Motivo: `main.ts` recebe `string[]` pronto e válido; regra testável
sem boot. Trade-off: nenhum relevante.

## 15. Things We Will NOT Do

- Ecoar `Origin`; wildcard; mudar rota/contrato/cookie/timeout; mexer no front.
