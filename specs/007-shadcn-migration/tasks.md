# Tasks 007 — Migrar Modais de Skills/Projetos para shadcn/ui

Referência: `plan.md` e `spec.md` (R1–R5). Pré-requisito: spec 006 concluída. Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## `NewSkillsModal`

- [x] **T1.** Migrar shell para `Dialog` (overlay, foco, scroll lock nativo); selects nativos preservados; remover `useLockBodyScroll` — validar com `npm run lint` + `npx tsc --noEmit`
- [x] **T2.** Adaptar `new-skills-modal.spec.tsx` (portal do Radix, remover testes de lock obsoletos) — `npm test`

## `SkillsSelection`

- [x] **T3.** Criar `skills-selection.tsx` — input controlado (`value`/`onChange`, texto por vírgula), `skills: Skill[]`, tokenização/dedupe/match canônico exportados, `Popover` + `Command` (`onSelect` único, `CommandEmpty`) — validar com `npm run lint` + `npx tsc --noEmit`
- [x] **T4.** Criar `skills-selection.spec.tsx` — tokenização, dedupe, match canônico, multi-seleção via `click` (sem duplo), estado vazio — `npm test`
- [x] **T5.** Scroll da lista — todas as skills roláveis (wheel, touch e arrasto); `PopoverContent` ancorado no `DialogContent` (`portalContainer`) — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`
- [x] **T6.** Toggle de seleção — clicar em opção selecionada desseleciona (remove/rejunta/desmarca, dropdown aberto); `selectedNames` derivado, `data-checked` (o `aria-selected` fica com o cmdk para navegação), helper `removeSkillToken` exportado + testes — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`
- [x] **T7.** Abertura por clique no input (além de digitar/`ArrowDown`/chevron); `onFocus` sozinho não abre + testes — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`

## `ProjectModal`

- [x] **T8.** Consumir `SkillsSelection` + migrar shell para `Dialog`; remover `useLockBodyScroll` do modal; resto inalterado — validar com `npm run lint` + `npx tsc --noEmit`
- [x] **T9.** Adaptar `project-modal.spec.tsx` (inclui regressão do fluxo aninhado) — `npm test`

## Limpeza + Fechamento

- [x] **T10.** Remover `use-lock-body-scroll.ts` + usos restantes; remover testes de lock obsoletos — validar com `grep` (zero referências) + `npm run lint`
- [x] **T11.** `npm run lint` + `npx tsc --noEmit` + `npm test` verdes
- [x] **T12.** `npm run build` sem erros + checagem visual dos modais (abrir, categorizar, salvar)
