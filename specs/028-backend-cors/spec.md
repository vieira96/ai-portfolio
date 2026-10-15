# SPEC (backend): CORS para o frontend (origens por env)

## Status

`APPROVED`

## 1. Context

O browser (`:3000`) não alcança a API (`:8000`): `main.ts` não tem `enableCors`
(verificado no código) e o `curl` confirma API no ar. Sem isso, fetch e polling do
Socket.IO morrem no browser — e a integração do chat (027) não funciona. Escopo
só backend, sem tocar em rota, contrato ou cookie.

## 2. Requested Feature

Habilitar CORS com origens vindas de env (`CORS_ORIGINS`, várias separadas por
vírgula), `credentials: true`, cobrindo REST e handshake do Socket.IO.

## 3. Goal

`curl -H "Origin: <front>"` devolve `access-control-allow-origin` +
`access-control-allow-credentials` no REST e no `/socket.io/`; o fluxo do chat
roda no browser sem erro de CORS.

## 4. Current System

`main.ts`: pipes, filtro global, `cookieParser`, `visitorCookieMiddleware`,
Scalar — sem `enableCors`. `IoAdapter` padrão (sem cors próprio). Env validada
por Zod com falha na subida.

## 5. Existing Behavior

Nada muda além dos headers de CORS: mesmas rotas, formatos, cookies e erros.

## 6. Functional Requirements

### FR-01 — CORS com origens explícitas + credentials

`enableCors({ origin: [...], credentials: true })`. Sem wildcard (`*` anula
credential). Preflight (`OPTIONS`) pelo mecanismo padrão.

### FR-02 — Origens em env, várias por vírgula, validadas no boot

`CORS_ORIGINS="https://site1.com,https://site2.com"` (exemplo; dev:
`http://localhost:3000`). Regra: separa por vírgula, apara espaço, ignora vazio,
valida cada uma como URL no Zod — origem inválida aborta a subida com mensagem
clara. Documentada no `.env.example`; sem valor no compose além de exemplo local.

### FR-03 — Handshake do socket coberto

Conferir `curl -H "Origin: ..." /socket.io/` devolvendo os mesmos headers; se não
vier, configurar o cors no adapter do Socket.IO também. Polling usa GET+POST —
ambos precisam passar.

## 7. Business Rules

- **BR-01:** nunca ecoar o `Origin` do request (refletir origem arbitrária anula o CORS).
- **BR-02:** nada além de CORS muda (rotas, contrato, cookie, timeouts intactos).

## 8. User Flow

Browser `:3000` → fetch/POST/GET/polling → headers presentes → cookie vai e volta
→ chat funciona. Devtools sem erro de CORS.

## 9. API Contract

Nenhuma mudança de rota, campo, status ou formato.

## 10. Data Requirements

Nenhum dado novo.

## 11. Validation

Zod: `CORS_ORIGINS` obrigatória, parseada em lista, cada item URL válida.

## 12. Authorization

Nada muda (CORS não é auth; guards intactos).

## 13. Error Scenarios

- Origem fora da lista → browser bloqueia (comportamento correto, sem log especial).
- `CORS_ORIGINS` ausente/malformada → boot aborta (Zod, antes de aceitar request).

## 14. Security Requirements

BR-01/BR-02; sem segredo em log; key/cookie fora disso (inalterados).

## 15. Performance Requirements

Sem impacto (headers estáticos por resposta; preflight cacheado pelo browser).

## 16. Tests

Unit do parse (uma origem, várias, espaços, vazios ignorados, inválida aborta) +
prova manual `curl` nos dois caminhos + fluxo real no browser. Sem backend real
extra na suíte além do existente.

## 17. Documentation Impact

`.env.example` (`CORS_ORIGINS` com exemplo); README só se preciso.

## 18. Acceptance Criteria

- **AC-01:** `curl -H Origin` no REST mostra `allow-origin` da lista + `allow-credentials`.
- **AC-02:** idem no `/socket.io/` (ou adapter configurado + mesma prova).
- **AC-03:** fluxo do chat no browser sem erro de CORS.
- **AC-04:** `CORS_ORIGINS` inválida aborta o boot nomeando a var.

## 19. Assumptions

- **Origens conhecidas** (dev local + produção quando houver; curinga proibido).
- **Cookie prod é outro trabalho** (SameSite cross-site já registrado na 027).

## 20. Definition of Done

- AC-01..AC-04 verificadas; `lint` + `tsc` + `npm test` verdes.
- Diff só em `main.ts` (ou adapter), validação de env, `.env.example` e teste.
