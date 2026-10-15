# SPEC (frontend): Chat widget — envio e stream reais (fase 2b)

## Status

`APPROVED`

## 1. Context

Fase 1 pronta (026, visual com mock) e fase 2a em execução (027: histórico real +
cookie). Falta ligar o envio: `POST` real, Socket.IO push-only e retry de verdade.
Mock de envio/stream (`streamMockReply`) sai nesta SPEC. Premissa: CORS resolvido
(028), senão nada funciona no browser.

## 2. Requested Feature

Escopo: frontend. Enviar pergunta de verdade (`POST`), acompanhar tokens ao vivo
(socket), congelar no `done`, tratar erro com retry que cria par novo. Resposta de
assunto inválido aparece como qualquer outra resposta da IA e some no reload (o
backend não a persiste). Visual e histórico das fases anteriores intocados.

## 3. Goal

Pergunta real respondida pela IA em stream no tempo do modelo; erro com retry
funcional; sem mock restante.

## 4. Current System

Reais: `ChatWidget` (estado + envio mockado), `ChatInput` (`zod`, bloqueio no
stream), `ChatMessages`/`ChatBubble` (erro + retry oculto), `mock/streamMockReply`,
`types/chat/` no formato da API, backend com `POST` (`201`/`200`/`503`/`400`) e
socket push-only (023/024).

## 5. Existing Behavior

Bolhas, scroll, foco, toast e histórico como estão. Sai só a fonte falsa de envio.

## 6. Functional Requirements

### FR-01 — Envio real via `POST`

`POST /chat/messages { message }` (com `credentials`): `201` → par `pending`
aguardando stream; `200` → texto de assunto inválido na bolha da IA, sem fila;
`400` não deve ocorrer (`zod` barra antes); `503`/rede/500 no envio → só toast,
sem par (nada persiste sem `POST` ok).
Input continua bloqueado no stream.

### FR-02 — Stream real via socket

Socket conecta ao abrir (desconecta ao fechar; uma conexão). `chat:token` anexa,
`chat:done` congela (verdade final), `chat:error` vira `failed` + toast. Sem
`done`, sem resposta. Fechar no meio não cancela a geração: o backend termina e o
histórico mostra ao reabrir.

### FR-03 — Retry cria par novo

Reenvio faz novo `POST` → par novo anexado (backend não tem retry por id). Botão
volta a aparecer nos pares `failed`.

## 7. Business Rules

- **BR-01:** visual das fases anteriores intocado.
- **BR-02:** sem segredo; sem `visitorId` manual; texto como texto.
- **BR-03:** mock de envio/stream deletado no fim (zero referência no bundle).

## 8. User Flow (real)

Digita → `POST` → `pending` → tokens → `done` (ou resposta de assunto inválido,
ou erro no envio → só toast, ou `chat:error` → bolha + toast → retry cria par novo).

## 9. API Contract + Dependências

Contrato 023 §9 sem mudança; `NEXT_PUBLIC_API_URL` e `credentials` já no código.
CORS resolvido é premissa (028) — sem ele, nada aqui funciona no browser.

## 10. Data Requirements

Tipos `src/types/` sem mudança.

## 11. Validation

Mesmo `zod`; `socket.io-client` entra aqui (única dep nova). Sem outra lib.

## 12. Authorization

Anônimo por cookie; sem guarda.

## 13. Error Scenarios

- `503`/rede/500 no envio → só toast, sem par; `chat:error` → bolha + toast, parcial
  descartado.
- `chat:error` → `failed` + toast; parcial descartado.
- Socket cai → reconnect; sem `done`, sem resposta.

## 14. Security Requirements

BR-01..BR-03; sem `dangerouslySetInnerHTML`; sem segredo em código/log.

## 15. Performance Requirements

1 socket por abertura (limpo ao fechar); sem polling; timers limpos; sem memo
por esporte.

## 16. Tests (fetch + socket stubados, sem backend)

Padrão do repo: envio `201` → `pending` → tokens → `done`; `200` → resposta de
assunto inválido; `503`/rede no envio → só toast; `chat:error` → `failed`; socket
cai e volta; mock fora do bundle.

## 17. Documentation Impact

Nenhum (README/`env` já cobrem API e socket).

## 18. Acceptance Criteria (backend no ar + CORS resolvido)

- **AC-01:** envio válido → `pending` → stream real → `done` com dados.
- **AC-02:** fora de assunto → resposta de assunto inválido (efêmera, sem registro).
- **AC-03:** erro no envio (503/rede) → só toast, sem par; `chat:error` → bolha +
  toast + retry gerando par novo.
- **AC-04:** histórico, scroll, foco, mobile e teclado como na fase 1 (sem regressão).
- **AC-05:** zero referência a mock de envio no código.

## 19. Assumptions

- **Backend no ar** (Groq ou Ollama) e **CORS resolvido** (028).
- **`socket.io-client`** resolve no install.
- **Sem health na UI**; sem markdown/timestamps (fora de escopo como antes).

## 20. Definition of Done

- AC-01..AC-05 com backend real; mock de envio deletado.
- `lint` + `build` (`tsc`) + `npm test` verdes.
- Sem segredo/HTML; widget autocontido.
