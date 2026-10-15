# PLAN: Widget de chat IA — visual com mock (fase 1)

## Status

`DRAFT`

> SPEC em `DRAFT`. NÃO executar até aprovação da SPEC (`APPROVED` +
> Final Review `PASSED`) e promover este PLAN (`READY`) e as TASKS
> (`READY_FOR_IMPLEMENTATION`).

## Source Spec

`specs/026-ai-chat-widget/spec.md` (DRAFT)

## 1. Implementation Strategy

Premissa: home sem chat; tokens, `Button`/`Textarea`, `lucide`, `zod` e `Toaster`
existem. Ordem: casca (`ChatWidget` + FAB + painel) → mensagens + mock → envio +
stream simulado + erro → validação (`lint` + `build`). Sem backend, sem teste,
sem lib nova.

## 2. Existing Components to Reuse

Somente reais (`frontend/`):

- Home `src/app/page.tsx` (Server; importa o widget, que isola `"use client"`).
- `Button`, `Textarea` (`components/ui/shadcn/`), `lucide-react` (`Bot`, `Send`, `X`,
  confirmar nomes na hora), `Toaster` (só em erro).
- Tokens `bg-ink/bg-surface/border-line`, `text-slate-100`, `accent`, radius e fontes.
- `zod` colocado (`*.schema.ts`, padrão dos forms); `cn()` em `lib/utils` se preciso.

## 3. Components Affected

- `src/components/chat/chat-widget.tsx` (novo: container, dono do estado).
- `src/components/chat/chat-fab.tsx` (novo), `chat-panel.tsx` (novo).
- `src/components/chat/messages/chat-messages.tsx` + `chat-bubble.tsx` (novos).
- `src/components/chat/forms/chat-input.tsx` + `chat.schema.ts` (novos).
- `src/components/chat/mock/chat.mock.ts` (novo: seed + stream simulado + erro).
- `src/types/chat/chat.types.ts` (novo: formato do backend, §10 da SPEC).
- `src/app/page.tsx` (importa e monta o widget).

## 4. Frontend Changes

```text
components/chat/
├── chat-widget.tsx     (open, mensagens, streaming; compõe o resto)
├── chat-fab.tsx        (botão; props: open, onToggle)
├── chat-panel.tsx      (janelinha; header "Chat com IA" + fechar; slots)
├── messages/
│   ├── chat-messages.tsx (lista + scroll grudado + scroll-up carrega mock)
│   └── chat-bubble.tsx   (variantes user/assistant/erro + avatar robô)
├── forms/
│   ├── chat-input.tsx    (form: textarea + zod + send; sem lógica de rede)
│   └── chat.schema.ts    (message não vazia, máx 2000)
└── mock/chat.mock.ts   (seed paginado + push por intervalo + modo erro)
```

- Painel != Form: painel apresenta, `chat-input` cuida de value/validação/submit;
  `onSend(message)` sobe, `onRetry` idem. Estado (`open`, mensagens, streaming) no
  `ChatWidget`, menor owner possível.
- Mock com a interface que a fase 2 implementa de verdade (`list` paginado +
  `send` com pedaços): trocar a fonte sem redesenhar.
- Foco: abre → input; fecha → FAB; `Esc` fecha. Scroll-up no topo carrega página
  anterior do mock. Timers limpos ao desmontar/concluir.

## 5. Backend Changes

Nenhuma.

## 6. Database Changes

Nenhuma.

## 7. API Changes

Nenhuma (zero request; tipos já no formato do backend para a fase 2).

## 8. Authorization / Security Implementation

Sem identidade, sem guarda; sem segredo; texto como texto (sem `dangerouslySetInnerHTML`).

## 9. Performance Requirements

`"use client"` só no widget; sem socket/polling; sem virtualização; sem `memo` por esporte.

## 10. Error Handling

Erro só do mock: bolha com retry + toast (`Toaster`, único uso). Digitado preservado.

## 11. Tests Strategy

Sem testes nesta SPEC (decisão explícita): validação por demo manual dos ACs +
`lint` + `build`. Testes entram depois, sem mudar comportamento.

## 12. Documentation Updates

Nenhuma.

## 13. Implementation Order

1. Casca: widget + FAB + painel (toggle, foco, `Esc`, responsivo).
2. Mensagens + mock (bolhas, robô, seed com par `failed`, ordem + scroll-up).
3. Envio + stream simulado + erro/toast (input, zod, bloqueio, retry).
4. `lint` + `build` + demo dos ACs.

## 14. Technical Decisions

### TD-01 — Mock com interface de fase 2

Problema: dado falso que não vira lixo na integração. Decisão: mock expõe `list`
paginado + `send` por pedaços, nos tipos do §10. Motivo: fase 2 troca a fonte.
Trade-off: um pouco mais de mock agora, zero retrabalho depois.

### TD-02 — Stream por intervalo, não instantâneo

Problema: demonstrar o progressivo sem rede. Decisão: `setInterval` curto anexando
pedaços, limpo ao concluir/desmontar. Motivo: prova bolha crescendo + scroll grudado.
Trade-off: timing falso (óbvio, é mock).

### TD-03 — Scroll-up carrega, scroll-down não puxa

Problema: paginação visual sem backend. Decisão: topo carrega página anterior do
mock; auto-scroll só desce grudado. Motivo: mesma regra da fase 2 real.

## 15. Things We Will NOT Do

- Backend, fetch, socket, cookie, identidade, persistência.
- Testes, markdown, timestamps, sugestões, README, libs novas.
- Rota nova; mexer em layout além de importar o widget na home.

---

## Final Review

### Consistency

`PENDING` (aguardando revisão)

### Checked

- [ ] compatibilidade com SPEC
- [ ] compatibilidade com projeto real
- [ ] arquitetura revisada
- [ ] backend revisado
- [ ] banco revisado
- [ ] segurança revisada
- [ ] estratégia de testes revisada
- [ ] overengineering revisado

### Deviations from SPEC

`Nenhuma (PLAN acompanha SPEC DRAFT).`

### Known Risks

- Nome exato de ícone `lucide` (ex: `Bot`) a confirmar na hora; trocar sem mudar a SPEC.
- Textos do mock (seed, vazio, erro) são demonstração — copy final pode mudar sem SPEC nova.

### Review Result

`DRAFT — NÃO EXECUTAR até aprovação.`
