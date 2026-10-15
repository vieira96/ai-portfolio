# PLAN: Chat widget — histórico real + cookie na carga (fase 2a)

## Status

`READY`

## Source Spec

`specs/027-chat-integration/spec.md` (DRAFT)

## 1. Implementation Strategy

Premissa: widget visual pronto (mock com interface `list` paginado + tipos no
formato do backend); backend no ar com CORS resolvido. Ordem: camada de fetch +
env → prefetch no mount + histórico real (última página, scroll-up) → erro/retry
do `GET` → deleta mock de histórico → validação. Sem POST/socket/retry real.

## 2. Existing Components to Reuse

Somente reais: `ChatWidget` (dono do estado), `ChatMessages` (scroll grudado +
scroll-up), `ChatBubble`, `ChatPanel`, `Toaster` (só erro), `types/chat/`,
`fetch` com `credentials`, `NEXT_PUBLIC_API_URL` (nova).

## 3. Components Affected

- `src/components/chat/` — widget (prefetch + estado real), messages (dados reais),
  mock (sai `getLatest/getOlder`, fica `streamMockReply`).
- Camada de fetch do histórico (função isolada e testável + `NEXT_PUBLIC_API_URL`).
- `src/types/chat/` — sem mudança (já no formato).
- `.env.example` do front (nova var pública).

## 4. Frontend Changes

- `GET /chat/messages?size=20` uma vez no mount (com `credentials`); falha
  silenciosa, painel tenta ao abrir.
- Última página primeiro: lê `total` → `page=totalPages` quando há mais de uma
  (2 requests só nesse caso); scroll-up busca a anterior e prefixa.
- Erro no `GET` → estado de erro + retry que refaz o `GET`. Retry de envio some
  (botão oculto até a 2b).
- Envio/stream seguem mockados e convivem; reload mostra só o servidor.

## 5. Backend Changes

Nenhuma (CORS é dependência prévia, fora deste PLAN).

## 6. Database Changes

Nenhuma.

## 7. API Changes

Nenhuma (consome o contrato 023 como está).

## 8. Authorization

Cookie anônimo com `credentials`; sem guarda, sem login.

## 9. Performance Requirements

1 `GET` por carga; `"use client"` isolado; timers limpos; sem memo por esporte.

## 10. Error Handling

Falha silenciosa no mount; erro + retry no painel; digitado/estado intactos.

## 11. Tests Strategy

`fetch` stubado (`vi.stubGlobal` + `Response`, padrão do repo): 1 `GET` no mount,
ordem, última página, scroll-up, erro + retry que refaz, vazio. Cookie só no AC
manual. Sem backend real na suíte.

## 12. Documentation Updates

`.env.example` (`NEXT_PUBLIC_API_URL`); README só se preciso.

## 13. Implementation Order

1. Fetch + env + teste da camada.
2. Prefetch no mount + histórico real + scroll-up + erro/retry.
3. Deleta mock de histórico; validação (`lint` + `build` + `test`).

## 14. Technical Decisions

### TD-01 — Última página via `total`, não via backend novo

Problema: `GET` ordena do mais antigo. Decisão: primeira resposta dá o `total`;
se há mais de uma página, busca a última. Motivo: sem mudar contrato. Trade-off:
2 requests só quando há +20 mensagens.

### TD-02 — Prefetch no mount, não ao abrir

Problema: quando garantir cookie + histórico. Decisão: 1 `GET` ao montar a home.
Motivo: abrir fica instantâneo. Trade-off: 1 request mesmo sem abrir o chat.

## 15. Things We Will NOT Do

- POST/socket/retry real/cookie no código (fase 2b); markdown/timestamps; libs novas
  além do já admitido; rota nova; README; backend.
