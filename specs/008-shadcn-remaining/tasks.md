# Tasks 008 — Migrar Modais e Base Restantes para shadcn/ui

Referência: `plan.md` e `spec.md` (R1–R8). Pré-requisitos: specs 006 e 007 concluídas. Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## `AddSkillModal`

- [x] **T1.** Migrar shell para `Dialog` (form e schema intactos) — validar com `npm run lint` + `npx tsc --noEmit`
- [x] **T2.** Adaptar `add-skill-modal.spec.tsx` (portal, queries) — `npm test`

## Botão adicionar habilidade

- [x] **T3.** Padronizar botão "Adicionar habilidade" ao lado do título "Habilidades" (igual "Novo projeto" em `ProjectsSection`: header `flex` + `justify-between`); remover a área inferior do botão — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`

## `ConfirmModal`

- [x] **T4.** Migrar shell para `Dialog` (props e fluxos intactos) — validar com `npm run lint` + `npx tsc --noEmit`
- [x] **T5.** Adaptar specs que o exercitam (`projects-section.spec`, `skill-chip.spec` e similares) — `npm test`

## Base (`Button`, depois `Input`/`Textarea`)

- [x] **T6.** Trocar `Button` custom pelo shadcn em todos os usos (variants + `className` de identidade); remover `ui/buttons/button.tsx` (grep zero) — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`
- [x] **T7.** Trocar `Input`/`Textarea` customs pelos shadcn em todos os usos (`className` de identidade); remover `ui/inputs/input.tsx` e `textarea.tsx` (`image-picker` fica; grep zero) — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`

## Toast (`sonner`)

- [x] **T8.** Instalar `sonner` via CLI + montar `<Toaster />` no layout (tema/posição escuros) — validar com `npm run lint`
- [x] **T9.** Migrar `profile-form` para `toast.success`/`toast.error`; remover `ui/toast.tsx` (grep zero); adaptar spec se preciso — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`

## Organização shadcn

- [x] **T10.** Mover primitivos gerados para `components/ui/shadcn/` (deixa claro que é base shadcn): mover arquivos, apontar `aliases.ui` no `components.json` para `@/components/ui/shadcn` (suportado oficialmente; próximos `add` seguem o config), reescrever imports `@/components/ui/<x>` nos gerados (cross-imports) e nos usos da app (`@/components/ui/shadcn/<x>`) — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`

## Fechamento

- [x] **T11.** `npm run lint` + `npx tsc --noEmit` + `npm test` verdes
- [x] **T12.** `npm run build` sem erros + checagem visual (modais, formulários, botões, toasts)
