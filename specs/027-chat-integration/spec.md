# SPEC (frontend): Chat widget — histórico real + cookie na carga (fase 2a)

## Status

`APPROVED`

## 1. Context

Fase 1 pronta (026, visual com mock): FAB, janelinha, bolhas, envio e stream
falsos, histórico falso paginado. Esta é a fase 2a: ligar **só o histórico real**
(`GET`) + preparar o cookie ao carregar a home. Envio/stream/retry reais ficam
para a fase 2b, em spec própria. Mock de envio/stream continua até lá; mock de
histórico sai agora.

## 2. Requested Feature

Escopo: frontend. Ao carregar a home, um `GET /chat/messages` silencioso garante
o cookie (`Set-Cookie` na primeira vez) e pré-carrega o histórico em memória —
abrir o painel depois é instantâneo. Abrir mostra a **última** página real;
scroll ao topo busca anteriores. Envio e stream seguem falsos (fase 2b);
retry some até lá (sem ação falsa sobre dado real). Visual idêntico.

## 3. Goal

Home carrega → cookie pronto (mesmo sem abrir o chat) → abrir mostra a conversa
real persistida; scroll-up traz as antigas. Uma chamada silenciosa por carga,
sem polling, sem travar a página.

## 4. Current System

Reais: `components/chat/` (widget dono do estado, fab, panel, `messages/`,
`forms/`, `mock/` com `list` paginado + `send` por pedaços), `types/chat/` no
formato do backend, backend com `GET` paginado asc + cookie HttpOnly (023).

Não existe (não assumir): `socket.io-client`, chamada real no widget, cookie no front.

## 5. Existing Behavior

Visual e envio falso intocados. Sai só o mock de histórico (`getLatestMockMessages`,
`getOlderMockMessages`); `streamMockReply` e seed de envio ficam para a 2b.

## 6. Functional Requirements

### FR-01 — Cookie + histórico preparados na carga da home

Ao montar (uma vez por carga, sem polling), `GET /chat/messages?size=20`: sem
cookie → backend gera, fixa e responde vazio; com cookie → devolve a última página
e guarda em memória. Falha silenciosa (log de console em dev, sem bolha): o painel
tenta de novo ao abrir.

**Por que precisa:** abrir o chat com tudo pronto (cookie + histórico) em vez de
carregar na hora; uma chamada não trava a página.

### FR-02 — Histórico real, última página primeiro

Abrir mostra a última página (`GET` com `total` → `page=totalPages`; 1 request extra
só quando há mais de uma página); scroll ao topo busca a anterior. Ordem de
conversa, `answer: null` enquanto `pending`. Pares falsos de envio convivem na
sessão e somem no reload (só o servidor persiste).

### FR-03 — Retry fora até a fase 2b

Botão tentar-de-novo oculto nesta fase (reenviar de verdade é POST real, fase 2b).
Par `failed` real mostra a bolha de erro sem ação falsa.

**Por que precisa:** retry falso sobre dado real corromperia o histórico com par
mockado; melhor sem botão que com botão de mentira.

## 7. Business Rules

- **BR-01:** visual da fase 1 intocado — integração não redesenha.
- **BR-02:** sem segredo no client; sem `visitorId` manual; texto como texto.
- **BR-03:** contrato backend imutável; mock de envio/stream continua até a 2b.

## 8. User Flow (real no histórico, falso no envio)

Home carrega (GET silencioso, cookie pronto) → abre → histórico real/erro →
scroll-up traz anteriores → envio ainda falso (bolha + stream mockado) →
reload mantém só o real.

## 9. API Contract + Backend Dependency

`GET /chat/messages?page&size` → `{ data: [...], total, page, totalPages }` asc;
cookie HttpOnly do backend (browser manda sozinho). Base via `NEXT_PUBLIC_API_URL`.

```text
Backend Dependency (nest-senior, BLOQUEANTE — antes de qualquer teste no browser):
- CORS no backend: enableCors({ origin: [<URL do front via env>], credentials: true }).
- Nota prod (não bloqueia dev): cookie Lax sem Secure ok same-site entre portas;
  se produção for cross-site, backend precisa SameSite=None + Secure.
```

## 10. Data Requirements

Sem banco. Tipos `src/types/` reaproveitados sem mudança (já no formato).

## 11. Validation

Nada novo (envio segue `zod` atual). Sem lib nova.

## 12. Authorization

Anônimo por cookie (com `credentials` no fetch); sem guarda.

## 13. Error Scenarios

- `GET` inicial falha (rede/500) → silencioso na carga; painel abre com erro +
  tentar de novo (refaz o `GET`).
- Socket/stream: fora de escopo (fase 2b).

## 14. Security Requirements

BR-01..BR-03; sem `dangerouslySetInnerHTML`; sem segredo em código/log.

## 15. Performance Requirements

1 `GET` por carga (sem polling); `"use client"` isolado; timers limpos; sem memo
por esporte.

## 16. Tests (fetch stubado, sem backend real)

Padrão do repo (`vi.stubGlobal('fetch', ...)` + `Response`): 1 `GET` no mount (com
`credentials` e `page`/`size`); histórico renderizado em ordem; `total` maior que a
página → segundo `GET` na última; scroll-up dispara anterior e prefixa; `GET` falho
→ silencioso no mount, erro + retry que refaz o `GET`; vazio orientado; cookie é
comportamento de browser (coberto pelo AC-01 manual, não em unit).

## 17. Documentation Impact

`.env.example` do front (`NEXT_PUBLIC_API_URL`); README só se preciso.

## 18. Acceptance Criteria (backend no ar + CORS resolvido)

- **AC-01:** home carrega sem abrir o chat → resposta com `Set-Cookie` (primeira
  vez) e 1 request total no network.
- **AC-02:** abrir mostra histórico real em ordem (última página; `pending` sem
  resposta ainda).
- **AC-03:** scroll ao topo carrega página anterior real (com 20+ mensagens).
- **AC-04:** `GET` falho (offline devtools) → silencioso na carga; ao abrir, erro +
  retry refazendo o `GET`.
- **AC-05:** envio continua falso e some no reload; só dado real persiste.
- **AC-06:** console sem erro de CORS em nenhum fluxo.
- **AC-07:** visual idêntico à fase 1.

## 19. Assumptions

- **Backend no ar** com mensagens seedadas para demonstrar (20+ para o scroll).
- **CORS resolvido antes** (§9) — sem ele, AC-01..AC-06 falham no browser.
- **Sem socket aqui**; `socket.io-client` continua fase 2b.
- **Retry real é fase 2b** (POST); sem botão falso sobre dado real.

## 20. Definition of Done

- AC-01..AC-07 com backend real; mock de histórico deletado (só `streamMockReply` fica).
- `lint` + `build` (`tsc`) + `npm test` verdes.
- Sem segredo/HTML; widget autocontido; 1 request por carga.
