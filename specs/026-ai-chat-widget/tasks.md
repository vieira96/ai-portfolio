# TASKS: Widget de chat IA — visual com mock (fase 1)

## Status

`DRAFT`

> SPEC + PLAN em `DRAFT`. Nenhuma TASK pode ser executada até aprovação
> (SPEC `APPROVED`, PLAN `READY`, TASKS `READY_FOR_IMPLEMENTATION`).
> Todas nascem `[ ]`.

## Sources

SPEC:
`specs/026-ai-chat-widget/spec.md`

PLAN:
`specs/026-ai-chat-widget/plan.md`

Premissa: home sem chat; tokens e `Button`/`Textarea`/`lucide` existem. Sem backend,
sem testes, sem lib nova.

---

## Tasks

### [x] TASK-01 — Casca: widget + FAB + painel

#### Objective

FAB e janelinha montados na home, com toggle, foco e responsivo.

#### Requirements

- FR-01
- FR-02

#### Acceptance Criteria

- AC-01
- AC-07
- AC-08
- AC-10

#### Depends On

`Nenhuma`

#### Implementation Notes

`chat-widget.tsx` (dono de `open`), `chat-fab.tsx`, `chat-panel.tsx` (header
"Chat com IA" + fechar), mount na home. Foco input/FAB, `Esc`, ~400px/~70dvh e
mobile contido/~60dvh, `z` acima dos headers. Sem mock ainda (painel pode abrir
vazio).

#### Definition of Done

- Toggle, foco e `Esc`; mobile sem overflow; tokens do projeto; `lint` verde.

---

### [x] TASK-02 — Mensagens + mock

#### Objective

Bolhas dos dois lados com robô, histórico falso paginado e erro seedado.

#### Requirements

- FR-03
- FR-06

#### Acceptance Criteria

- AC-05
- AC-10

#### Depends On

- TASK-01

#### Implementation Notes

`chat-bubble.tsx` (user/assistant/erro + avatar robô), `chat-messages.tsx` (ordem,
scroll grudado, scroll-up carrega página), `mock/chat.mock.ts` (seed com pares
`done` + um `failed`, paginado), `types/chat/chat.types.ts` (formato do backend).
Texto simples, sem markdown/HTML.

#### Definition of Done

- Ordem + scroll-up + par `failed` visíveis; `lint` verde; sem rede.

---

### [x] TASK-03 — Envio + stream simulado + erro/toast

#### Objective

Fluxo completo falso: enviar, ver crescer, errar e tentar de novo.

#### Requirements

- FR-04
- FR-05
- FR-03 (erro)

#### Acceptance Criteria

- AC-02
- AC-03
- AC-04
- AC-06

#### Depends On

- TASK-02

#### Implementation Notes

`chat-input.tsx` + `chat.schema.ts` (Enter/Shift+Enter, vazio bloqueado, bloqueio
no stream), mock entrega pedaços por intervalo (limpo ao fim), erro com retry +
toast (`Toaster` só aqui). Digitado preservado no erro.

#### Definition of Done

- Envio/stream/erro demonstráveis; `lint` verde; zero request (spy no `fetch`
  estouraria se chamado).

---

### [x] TASK-04 — Validação final

#### Objective

Fechar o visual com todas as provas + cadeia verde.

#### Requirements

- FR-01
- FR-02
- FR-03
- FR-04
- FR-05
- FR-06
- FR-07

#### Acceptance Criteria

- AC-01
- AC-02
- AC-03
- AC-04
- AC-05
- AC-06
- AC-07
- AC-08
- AC-09
- AC-10

#### Depends On

- TASK-03

#### Implementation Notes

Demo manual de cada AC (sem testes nesta SPEC). Cadeia: `npm run lint` +
`npm run build`. Conferir: sem rota/lib/rede/cookie; widget autocontido.

#### Definition of Done

- Todas as AC-01..AC-10 demonstradas; cadeia verde.

---

## Final Review

### Consistency

`PENDING` (aguardando revisão)

### Checked

- [ ] cobertura da SPEC revisada
- [ ] cobertura do PLAN revisada
- [ ] dependências entre TASKS revisadas
- [ ] referências FR/BR/AC revisadas
- [ ] Definition of Done revisadas
- [ ] escopo revisado
- [ ] nenhuma TASK nasceu concluída
- [ ] ordem de execução revisada

### Uncovered Requirements

`Nenhum.`

### Orphan Tasks

`Nenhuma.`

### Review Result

`DRAFT — NÃO EXECUTAR até aprovação.`

## Implementation Handoff

Fontes:

SPEC:
`specs/026-ai-chat-widget/spec.md`

PLAN:
`specs/026-ai-chat-widget/plan.md`

TASKS:
`specs/026-ai-chat-widget/tasks.md`

Todos os documentos estão em `DRAFT`, pendentes de revisão e aprovação.

Na implementação (só após aprovação):

1. reler SPEC;
2. reler PLAN;
3. reler TASKS;
4. confirmar que o projeto não mudou de forma incompatível;
5. executar as TASKS em ordem;
6. marcar tasks concluídas somente após validar sua Definition of Done.

Se existir conflito entre documentação e projeto real:

PARE e informe.
