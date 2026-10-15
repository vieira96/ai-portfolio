# Plan 008 — Migrar Modais e Base Restantes para shadcn/ui

## Contexto

Ver `spec.md`. Pré-requisitos: specs 006 (instalação) e 007 (padrão de migração validado) concluídas.

## Decisão

**Mesmo padrão da 007: shell → `Dialog`, identidade via `className`, um componente por vez.**

- `AddSkillModal` (`src/components/skills/modals/add-skill-modal.tsx`):
  - Shell manual → `Dialog` + `DialogContent` + `DialogTitle`/`DialogDescription`; form e schema intactos.

- `ConfirmModal` (`src/components/ui/modals/confirm-modal.tsx`):
  - Shell manual → `Dialog`; props e fluxos (`ProjectsSection`, `SkillChip`) intactos.

- Cabeçalho `SkillsSection` (`src/components/skills/sections/skills-section.tsx`):
  - Botão "Adicionar habilidade" ao lado do título (`flex` + `justify-between`, padrão `ProjectsSection`); remover área inferior do botão.

- `Button` (troca em todos os usos, depois remove o custom):
  - Import `components/ui/buttons/button` → `components/ui/button`; variants `primary`/`secondary`/`danger` → `default`/`secondary`/`destructive`; `className` para preservar pill (`rounded-full`), cores e estados (`disabled:`).
  - Remover `src/components/ui/buttons/button.tsx` ao final (validar zero referências via `grep`).

- Toast (`sonner`):
  - `shadcn add sonner` + `<Toaster />` no `src/app/layout.tsx` (tema escuro, posição equivalente à atual).
  - Migrar `profile-form` para `toast.success`/`toast.error`; remover `src/components/ui/toast.tsx` (grep zero); adaptar `profile-form.spec` se preciso.

- `Input`/`Textarea` (troca em todos os usos, depois remove os customs):
  - Imports `components/ui/inputs/*` → `components/ui/input` / `components/ui/textarea`; `className` para preservar (`rounded-lg`, `border-line`, `bg-surface`, textos, `placeholder:`).
  - Remover `src/components/ui/inputs/input.tsx` e `textarea.tsx` ao final (`image-picker.tsx` permanece). Validar zero referências.

## Arquivos a alterar/criar

### `AddSkillModal`

1. `frontend/src/components/skills/modals/add-skill-modal.tsx` — shell `Dialog`.
2. `frontend/src/components/skills/modals/add-skill-modal.spec.tsx` — adaptar (portal, queries).

### `ConfirmModal`

3. `frontend/src/components/ui/modals/confirm-modal.tsx` — shell `Dialog`.
4. Specs que o exercitam (`projects-section.spec.tsx`, `skill-chip.spec.tsx` e similares) — adaptar queries se preciso.

### Cabeçalho `SkillsSection`

5. `frontend/src/components/skills/sections/skills-section.tsx` (+ spec) — botão ao lado do título.

### Base (`Button`/`Input`/`Textarea`)

6. Todos os arquivos listados no R3/R4 — troca de imports + variants + `className`.
7. `frontend/src/components/ui/buttons/button.tsx`, `inputs/input.tsx`, `inputs/textarea.tsx` — **remover** ao final.

### Organização shadcn

8. Mover primitivos gerados (`button`, `command`, `dialog`, `input`, `input-group`, `popover`, `textarea`, `sonner`) para `frontend/src/components/ui/shadcn/`; apontar `aliases.ui` no `components.json` para `@/components/ui/shadcn`; reescrever imports `@/components/ui/<x>` nos cross-imports dos gerados e nos usos da app.

### Intocados

- `DashboardClient`, specs 001–007, `image-picker.tsx`, resto do frontend. (`ProjectModal`, `NewSkillsModal`, `SkillsSelection`: sem mudanças funcionais nesta spec, apenas imports e classes via R3/R4.)

## Ordem de execução

1. **`AddSkillModal`**: shell + spec.
2. **`ConfirmModal`**: shell + specs que o exercitam.
3. **Cabeçalho `SkillsSection`**: botão ao lado do título + spec.
4. **`Button`**: troca em todos os usos + remove custom.
5. **`Input`/`Textarea`**: troca em todos os usos + remove customs.
6. **Toast**: instala `sonner` + `Toaster`, migra `profile-form`, remove custom.
7. **Organização shadcn**: mover gerados para `ui/shadcn/`, `aliases.ui`, reescrever imports.
8. **Validação**: `lint` + `tsc` + `test` + `build` verdes + checagem visual.

## Riscos

- Baixo-médio: mesma mecânica já validada na 007.
- Mapeamento de variants do `Button` é manual — cobrir cada uso com `className` e conferir visualmente (pill e cores do tema).
- Remoção dos customs só após `grep` provar zero referências.
- Organização `ui/shadcn/` diverge dos exemplos da doc (que assumem `@/components/ui`) — custo consciente; `tsconfig` não muda (`@/*` já cobre o subpath).
