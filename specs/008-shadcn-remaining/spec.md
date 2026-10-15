# Spec 008 — Migrar Modais e Base Restantes para shadcn/ui

## Contexto

A `spec 007` migrou `ProjectModal`, `NewSkillsModal` e o combobox, deixando de fora (fora de escopo): `AddSkillModal`, `ConfirmModal`, `Button`, `Input`, `Textarea`. Os arquivos shadcn correspondentes já existem (`components/ui/button.tsx`, `input.tsx`, `textarea.tsx` — instalados como dependências na `spec 006`). Esta spec completa a migração desses itens.

Atenção: o `Button` customizado tem identidade própria (pill `rounded-full`, variants `primary`/`secondary`/`danger` com a paleta do app). A migração preserva a aparência via `className` + mapeamento de variants — sem reformulação visual.

## Requisitos

- **R1 — `AddSkillModal`.** Migrar shell para `Dialog` (overlay, foco, scroll lock nativo). Form (nome + categoria + `POST /api/skills`) e validações inalterados; continua usando o `Button` shadcn (pós-R3) ou custom até lá — ordem: shell primeiro com custom, troca de botão no R3. Botão X padrão do `DialogContent` aceito (sem equivalente no modal antigo).

- **R2 — `ConfirmModal`.** Migrar shell para `Dialog`; props inalteradas (`title`, `body`, `confirmLabel`/`cancelLabel`, `confirmVariant: 'primary' | 'danger'`, `onConfirm`/`onClose`). Usado em `ProjectsSection` (excluir projeto) e `SkillChip` (excluir skill) — ambos os fluxos preservados. Botão X padrão do `DialogContent` aceito (sem equivalente no modal antigo).

- **R3 — `Button`.** Trocar todos os usos do custom (`components/ui/buttons/button.tsx`) pelo shadcn (`components/ui/button.tsx`): mapear `primary` → `default`, `secondary` → `secondary`, `danger` → `destructive`, com `className` para preservar a identidade (pill, cores, `disabled:`). Arquivos: `profile-form`, `projects-section`, `project-modal`, `project-card`, `skills-section`, `new-skills-modal`, `add-skill-modal`, `confirm-modal`, `logout-button`, `login-form`. Remover o custom ao final (validar zero referências).

- **R4 — `Input`/`Textarea`.** Trocar todos os usos dos customs (`components/ui/inputs/input.tsx`, `textarea.tsx`) pelos shadcn, com `className` para preservar a identidade (`rounded-lg`, `border-line`, `bg-surface`, textos). Arquivos: `profile-form`, `project-modal`, `add-skill-modal`, `login-form`, `skills-selection`. Remover os customs ao final (`image-picker.tsx` permanece — fora de escopo). Validar zero referências.

- **R5 — Toast via `sonner`.** Instalar via CLI (`sonner` → componente `Toaster` + dep); montar `<Toaster />` no layout com `theme="dark"`, `position="top-right"` e `duration={5000}` (mantém os 5 segundos do `Toast` custom, não o padrão de 4s do Sonner); migrar o uso em `profile-form` — sucesso vira `toast.success`, erro vira `toast.error` (o `<p role="alert">` inline é substituído); remover `components/ui/toast.tsx` ao final (grep zero). Testes: mockar `sonner` (`toast.success`/`toast.error` via `vi.mock`) em vez de procurar `role="status"`.

- **R6 — Validação.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes; specs atualizados (modais + formulários que renderizam os componentes trocados); sem regressão visual (comparar contra o comportamento atual).

- **R7 — Cabeçalho `SkillsSection`.** Padronizar o botão "Adicionar habilidade" ao lado do título "Habilidades", igual a "Novo projeto" em `ProjectsSection` (header `flex` + `justify-between`); remover a área inferior do botão.

- **R8 — Organização shadcn.** Mover primitivos gerados para `components/ui/shadcn/` (deixa claro que é base shadcn): mover arquivos, apontar `aliases.ui` no `components.json` para `@/components/ui/shadcn` (suportado oficialmente; próximos `add` seguem o config), reescrever imports `@/components/ui/<x>` nos cross-imports dos gerados e nos usos da app.

## Fora de escopo

- `badge`, dark-mode via tokens shadcn — não instalar/não mexer.
- `image-picker.tsx` e demais customs não listados — não fazer.
- Reformulação visual/UX — mesma aparência e fluxos, só troca de primitivos.
