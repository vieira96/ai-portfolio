# Spec 007 — Migrar Modais de Skills/Projetos para shadcn/ui

## Contexto

O shadcn/ui foi instalado e configurado na `spec 006` (`dialog`, `popover`, `command` disponíveis, sem uso ainda). Os modais `ProjectModal` e `NewSkillsModal` e o combobox de skills continuam 100% hand-rolled (`spec 005`): trava de scroll própria (`useLockBodyScroll` com refcount), combobox customizado, overlay/foco manuais.

Esta spec migra os dois modais para os primitivos e remove o código reinventado.

## Requisitos

- **R1 — `NewSkillsModal`.** Migrar para `Dialog`: overlay, conteúdo, foco preso e **trava de scroll nativa**. Comportamento preservado: selects de categoria nativos, categorias com default `BACKEND`, prop `error`.

- **R2 — `SkillsSelection`** (`src/components/skills/inputs/skills-selection.tsx` + `skills-selection.spec.tsx`): input controlado (`value: string` com texto separado por vírgula, `onChange: (text: string) => void`) que encapsula tokenização, dedupe case-insensitive, match canônico contra `skills: Skill[]` e dropdown de sugestões — seguindo o padrão canônico shadcn (`Popover` + `Command`, `onSelect` único, `CommandEmpty`).
  - Helpers puros exportados (`splitSkillNames`, `dedupeSkillNames`, `findKnownSkill`) para o `ProjectModal` usar no submit e para testes unitários.
  - Regras vindas da pesquisa/doc oficial: **só `onSelect`** no `CommandItem` (nunca `onMouseDown` junto — dispara 2x com closures de renders diferentes); filtro externo por token documentado (cmdk não filtra por vírgula).
  - **Abertura por intenção explícita** (nunca por `onFocus` sozinho): digitar (`onChange`), `ArrowDown`/`ArrowUp`, botão chevron ou clicar no próprio input. Causa raiz do flicker corrigido: dois donos do `open` — reopen incondicional no `onFocus` × fechamento do Radix em `focus-outside` (blur, trap de foco) → fecha, refoca, reabre em loop.
  - **Estabilidade**: após abrir, o dropdown permanece até selecionar, `Escape`, clique fora ou zero resultados.
  - **Scroll**: lista rolável por wheel, touch e arrasto da barra, com todas as skills acessíveis. Causa raiz corrigida: `PopoverContent` portalado fora do `DialogContent` tinha gestos cancelados pelo scroll lock; correção ancora o portal no `DialogContent` ancestral (`portalContainer`) sem tornar o `Popover` modal.
  - **Toggle**: clicar numa opção já selecionada desseleciona (remove os tokens iguais, rejunta com `", "`, desmarca o check, dropdown segue aberto); clicar de novo seleciona — `selectedNames` derivado do texto, `data-checked` + `aria-selected`.

- **R3 — `ProjectModal`.** Migrar shell para `Dialog` e consumir `<SkillsSelection value onChange skills />` (combobox inline removido). Fluxo preservado: dois passos (form → categorizar via `NewSkillsModal`), `submitWithSkills`, `onSaved`/`onClose`/`onSkillsCreated`.

- **R4 — Limpeza.** Remover `useLockBodyScroll` (`components/ui/hooks/`): o `Dialog` do Radix trava o scroll nativamente, inclusive com dialogs aninhados. Remover o hook + seus testes de lock, adaptando os specs para o comportamento do Radix (inclui o caso de regressão do fluxo aninhado do R2.2 da spec 005).

- **R5 — Validação.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes; sem regressão visual nos modais (comparar contra o comportamento da spec 005).

## Fora de escopo

- Migrar `AddSkillModal`, `ConfirmModal`, `Button`, `Input`, `Textarea` — ficam como estão; migração incremental em specs futuras.
- `badge`, `sonner`/`toast`, dark-mode via tokens shadcn — não instalar/não mexer.
- Reformulação visual/UX dos modais — mesma aparência e fluxo, só troca de primitivos.
