# Plan 007 — Migrar Modais de Skills/Projetos para shadcn/ui

## Contexto

Ver `spec.md`. Pré-requisito: `spec 006` concluída (shadcn instalado).

## Decisão

**Migrar os dois modais e o combobox para os primitivos, removendo o código reinventado.**

- `NewSkillsModal` (`src/components/skills/modals/new-skills-modal.tsx`):
  - Shell → `Dialog`; selects de categoria permanecem nativos; prop `error` preservada.

- `SkillsSelection` (novo, `src/components/skills/inputs/skills-selection.tsx`):
  - Input controlado do combobox; usa `Popover` + `Command` conforme R2 (filtro externo por token, `onSelect` único, `CommandEmpty`, abertura por intenção, toggle com `data-checked`).
  - `PopoverContent` ancorado no `DialogContent` ancestral (`portalContainer`) para o scroll lock não cancelar gestos.
  - Exporta helpers puros de tokenização/match para o submit do modal e para testes.

- `ProjectModal` (`src/components/projects/modals/project-modal.tsx`):
  - Shell → `Dialog` (`DialogContent` com `onInteractOutside` fechando via `onClose`).
  - Combobox inline removido; consome `<SkillsSelection value onChange skills />`.
  - Fluxo em dois passos, `submitWithSkills`, `onSkillsCreated`, `NewSkillsModal` — lógica inalterada.

- Remoção: deletar `src/components/ui/hooks/use-lock-body-scroll.ts`; remover `useLockBodyScroll()` dos dois modais; remover/atualizar os testes de lock (Radix trava o scroll nativamente — em jsdom, cobrir via `Dialog` montado/desmontado ou remover asserções de `body.overflow` se o Radix não aplicar no jsdom, registrando o motivo).

## Arquivos a alterar/criar

### `SkillsSelection` (novo)

1. `frontend/src/components/skills/inputs/skills-selection.tsx` — componente do combobox.
2. `frontend/src/components/skills/inputs/skills-selection.spec.tsx` — testes do componente.

### Modais

3. `frontend/src/components/skills/modals/new-skills-modal.tsx` — `Dialog`, remove `useLockBodyScroll`.
4. `frontend/src/components/skills/modals/new-skills-modal.spec.tsx` — adaptar + remover testes de lock obsoletos.
5. `frontend/src/components/projects/modals/project-modal.tsx` — consome `SkillsSelection` + shell `Dialog`.
6. `frontend/src/components/projects/modals/project-modal.spec.tsx` — adaptar (Radix porta `Dialog` para `document.body` no jsdom; ajustar queries se preciso; manter caso de regressão do fluxo aninhado).

### Limpeza

7. `frontend/src/components/ui/hooks/use-lock-body-scroll.ts` — **remover**.

### Intocados

- `Button`, `Input`, `Textarea`, `AddSkillModal`, `ConfirmModal`, `DashboardClient`, sections, specs 001–006.

## Ordem de execução

1. **`NewSkillsModal`**: migra shell para `Dialog` (menor, valida o padrão) + adapta spec.
2. **`SkillsSelection`**: componente novo + spec (regras canônicas do R2: filtro, `onSelect`, abertura, scroll, toggle).
3. **`ProjectModal`**: consome `SkillsSelection` + migra shell para `Dialog` + adapta spec.
4. **Remover** `src/components/ui/hooks/use-lock-body-scroll.ts` e corrigir imports.
5. **Validação**: `lint` + `tsc` + `test` + `build` verdes + checagem visual dos modais.

## Riscos

- Baixo-médio: lógica de negócio inalterada, só primitivos de UI.
- Radix `Dialog` usa portal + `document.body`: specs em jsdom podem precisar de ajuste nas queries (portal fora do container de render) — `@testing-library` lida via `screen` (document), risco baixo.
- Gestos (wheel/touch) sobre conteúdo portalado dentro de `Dialog` modal: manter o `portalContainer` ancorado; regressão coberta por teste.
- Sem regressão de estilo: aplicar `className` para manter a identidade atual (`bg-surface`, `border-line`, etc.).
