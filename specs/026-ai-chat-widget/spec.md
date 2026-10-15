# SPEC (frontend): Widget de chat IA — visual com mock (fase 1)

## Status

`DRAFT`

> Status `DRAFT` — NÃO implementar até revisão e aprovação.

## 1. Context

Sem UI de chat no front (só branding). Backend pronto (023/024), mas esta SPEC não
o consome: fase 1 visual com dados falsos; integração real é fase 2, em spec própria.

## 2. Requested Feature

`ChatWidget` autocontido, montado só na home: FAB fixo embaixo à direita abre
janelinha fixa à direita (nunca tela cheia). Pergunta à direita, resposta à esquerda
com robô. Tudo mockado e local; sem fetch/socket/cookie/rota nova/lib nova.

## 3. Goal

Na home, o visitante abre, pergunta e vê a resposta falsa como stream, em mobile e
desktop, com a cara do produto. Mesma estrutura que a fase 2 vai ligar nos dados reais.

## 4. Current System

App Router (Next 16 + React 19); home `src/app/page.tsx` monta o widget (isola
`"use client"`). Tokens dark: `bg-ink/bg-surface/border-line`, `text-slate-100`,
`accent`, radius `0.625rem`; Manrope + DM Mono. shadcn `Button`/`Textarea` +
`lucide`; forms com `zod` + `useState`; testes Vitest+RTL (`*.spec.tsx`).

Não existe (não assumir): `socket.io-client`, `Avatar`, FAB/painel `fixed`, chamada
de API no widget.

## 5. Existing Behavior

Reutiliza tokens, tipografia, `Button`/`Textarea`, `lucide`, `Toaster` (só em erro)
e padrão de erro pt-BR. Nada existente muda.

## 6. Functional Requirements

### FR-01 — FAB na home

Circular fixo (`bottom`/`right` + safe-area), ≥44px, ícone `lucide`, `aria-label` e
`aria-expanded`; `z` acima dos headers, abaixo de Dialog. Alterna abrir/fechar;
foco vai ao input e volta ao FAB. Parte do widget, não do layout.

### FR-02 — Janelinha à direita, nunca tela cheia

Flutuante com margens e radius do projeto: desktop ~400px/~70dvh, mobile contida
com margens/~60dvh; scroll interno, header (`Chat com IA` + fechar) e input fixos. X/`Esc` recolhe sem
destruir o estado em memória.

### FR-03 — Bolhas direita/esquerda com robô

Pergunta à direita; resposta à esquerda com ícone de robô. Texto simples (sem
markdown, sem `dangerouslySetInnerHTML`). Estados via mock: `pending` (digitando),
`done`, `failed` (bolha de erro + botão tentar de novo + toast de aviso via `Toaster`;
só há toast em erro, em nenhum outro fluxo). O seed do mock inclui um par `failed`
para demonstrar erro + retry deterministicamente. Sem timestamps.

### FR-04 — Envio com mock

`Textarea`: Enter envia, Shift+Enter quebra linha, vazio não envia (`zod`, máx 2000
espelhando o backend). Envio mostra bolha + `pending`; mock devolve a resposta.
Bloqueado durante a "geração" (uma conversa por vez).

### FR-05 — Stream simulado grudado

Mock entrega a resposta em pedaços (intervalo curto), anexando na bolha;
auto-scroll só se grudado no fim; fim congela (simula o `done`).

### FR-06 — Histórico falso paginado, scroll-up carrega mais

Abre com as mensagens antigas (mock com mais de uma página, em ordem; vazio só
quando não há nenhuma). Scroll até o topo carrega a página anterior do mock
(comportamento que a fase 2 liga no `GET` paginado real). Reload reinicia o mock;
persistência real é fase 2.

### FR-07 — Sem identidade nesta fase

Nenhum código de cookie/`visitorId`/sessão (identidade via HttpOnly é fase 2).

## 7. Business Rules

- **BR-01:** tokens e cara do produto; mock local óbvio, fácil de arrancar na fase 2.
- **BR-02:** sem segredo, sem HTML injetado, sem rede no widget.
- **BR-03:** sem rota nova, sem lib nova (nem `socket.io-client` — é fase 2).

## 8. User Flow (mock)

FAB → abre (foco no input, mock carrega) → Enter → bolha + `pending` → pedaços →
congela → X/`Esc` guarda em memória → reload reinicia. Erro mockado: bolha + retry.

## 9. API Contract (referência da fase 2, sem uso aqui)

Backend 023/024: `POST` (`201`/`200`/`503`/`400`), `GET` paginado, Socket.IO
push-only (`token`/`done`/`error`, sem `chat:send`), cookie HttpOnly do backend.
Base pública/BFF + CORS na spec de integração. Ref: `/openapi.json` + `/docs`.

## 10. Data Requirements

Sem banco. Tipos `src/types/` no formato do backend (`id`, `question`,
`answer: string | null`, `status`, datas) — mock usa e fase 2 reaproveita.

## 11. Validation

`zod` colocado (`*.schema.ts`): `message` não vazia, máx 2000. Sem lib nova.

## 12. Authorization

Nada: sem identidade, sem guarda.

## 13. Error Scenarios (mock)

Erro mockado → bolha amigável + retry (mesma pergunta); digitado preservado.

## 14. Security Requirements

Sem `dangerouslySetInnerHTML`; sem segredo em código/log; mock sem dado real.

## 15. Performance Requirements

`"use client"` só no widget; sem socket/polling; timers do mock limpos ao
desmontar; sem virtualização, sem `memo` por esporte.

## 16. Tests

Fora desta SPEC (só preparo visual; testes entram depois, sem mudar comportamento).

## 17. Documentation Impact

Nenhum.

## 18. Acceptance Criteria (mock, sem backend)

- **AC-01:** FAB alterna a janelinha (desktop ~400px; mobile contida, nunca cheia);
  foco vai e volta; sem quebrar layout/rolagem.
- **AC-02:** envio mostra pergunta + resposta falsa com robô.
- **AC-03:** vazio não envia (validação, sem erro técnico).
- **AC-04:** pedaços crescem ao vivo; subir para de puxar; fim congela.
- **AC-05:** abre com mock em ordem; scroll ao topo carrega página anterior;
  reload reinicia (persistência é fase 2).
- **AC-06:** par `failed` do seed vira bolha + retry + toast; digitado preservado.
- **AC-07:** mobile legível, alvos ≥44px, sem overflow, com safe-area.
- **AC-08:** teclado total (Enter/Shift+Enter/`Esc`), `aria-expanded`, regiões
  anunciadas, contraste dos tokens.
- **AC-09:** sem segredo/HTML/rede (tags como texto, zero request).
- **AC-10:** tokens do projeto, sem estética genérica de IA.

## 19. Assumptions

- **Sem markdown:** texto simples; lib seria dependência + XSS sem caso real.
- **Sem timestamps/sugestões:** enfeite sem pedido (sugestões ficam pra spec própria).
- **Envio único por vez:** vale nas duas fases; liberar seria redesign.
- **Mock no formato final** (§10): fase 2 troca a fonte sem retipar.
- **Integração é outra spec:** POST/GET/socket/cookie/CORS não entram aqui.

## 20. Definition of Done

- FAB + janelinha (AC-01, AC-07, AC-08, AC-10) e fluxo falso (AC-02..AC-06), com mock.
- AC-09; `lint` + `build` (`tsc`) verdes (sem `npm test` nesta SPEC).
- Sem rota/lib/rede/cookie; `ChatWidget` autocontido na home.

## Final Review

### Consistency

`PENDING` (aguardando revisão)

### Checked

- [ ] requisitos revisados
- [ ] regras de negócio revisadas
- [ ] fluxos revisados
- [ ] critérios de aceite revisados
- [ ] conflitos com sistema atual revisados

### Remaining Issues

`SPEC DRAFT — pendente de revisão antes de virar APPROVED e gerar PLAN/TASKS.`

### Review Result

`DRAFT — NÃO IMPLEMENTAR até aprovação.`
