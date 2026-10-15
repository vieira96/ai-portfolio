# PLAN: Chat widget — envio e stream reais (fase 2b)

## Status

`READY`

## Source Spec

`specs/029-chat-send-stream/spec.md` (APPROVED)

## 1. Implementation Strategy

Premissa: widget com histórico real (027), mock só no envio/stream, backend no ar
com CORS resolvido. Ordem: socket + envio real → retry real + erro fim a fim →
deleta mock → validação.

## 2. Existing Components to Reuse

Somente reais: `ChatWidget` (estado), `ChatMessages`/`ChatBubble` (erro + retry
oculto), `ChatInput` + `zod`, `Toaster` (só erro), `types/chat/`,
`NEXT_PUBLIC_API_URL`, `fetch` com `credentials`.

## 3. Components Affected

- `src/components/chat/chat-widget.tsx` (socket lifecycle + `POST` + stream/error).
- `src/components/chat/mock/chat.mock.ts` (sai `streamMockReply`).
- `package.json` do front (`socket.io-client`, única dep nova).

## 4. Frontend Changes

- Socket conecta ao abrir (com cookies — confirmar flag do client), desconecta ao
  fechar/desmontar; `token` anexa, `done` congela, `error` vira `failed` + toast.
- `POST` no envio (`201`→`pending`, `200`→resposta, resto→erro); retry faz `POST`
  novo (par novo); input segue bloqueado no stream.
- Fechar no meio não cancela: sem socket, sem tokens; `done` aparece no histórico.

## 5. Backend Changes

Nenhuma.

## 6. Database Changes

Nenhuma.

## 7. API Changes

Nenhuma (consome o contrato 023 como está).

## 8. Authorization

Cookie anônimo (fetch + socket com credenciais); sem guarda.

## 9. Performance Requirements

1 socket por abertura (limpo ao fechar); sem polling; timers limpos; sem memo
por esporte.

## 10. Error Handling

`503`/rede/500 no envio → só toast sem par; `chat:error` → erro + toast + retry (par novo); parcial
descartado; digitado preservado.

## 11. Tests Strategy

TDD (regra: teste antes da implementação): cada comportamento nasce como teste
falhando (fetch/socket stubados, sem backend) e a task seguinte o faz passar.
`201`→`pending`→tokens→`done`; `200`; erro + retry com par novo; `chat:error`;
queda e volta; conexão só com painel aberto; mock fora do bundle.

## 12. Documentation Updates

Nenhuma.

## 13. Implementation Order

1. Teste do envio (vermelho).
2. Envio real (verde).
3. Teste do stream (vermelho).
4. Stream real (verde).
5. Teste do retry + limpeza (vermelho).
6. Retry real + deleta mock (verde).
7. Validação (`lint` + `build` + `test` + demo com backend).

## 14. Technical Decisions

### TD-01 — Cookie também no socket

Problema: fetch leva cookie, e o polling? Decisão: client com credenciais;
confirma abrindo com cookie fixo e vendo só o próprio histórico. Motivo: sem
isso o socket vira outro visitante. Trade-off: nenhum relevante.

## 15. Things We Will NOT Do

- Redesign, markdown, timestamps, health na UI, libs além de `socket.io-client`,
  rota nova, README, backend.
