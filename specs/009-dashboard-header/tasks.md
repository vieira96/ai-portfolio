# Tasks 009 — Header Fixo do Dashboard com Navegação por Âncoras

Referência: `plan.md` e `spec.md` (R1–R5). Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## `DashboardHeader`

- [x] **T1.** Criar `src/components/dashboard/dashboard-header.tsx` — barra `fixed`, logo, nav (3 links + scroll-spy + `aria-current`), hambúrguer mobile (dropdown absoluto estilo menu com links + `LogoutButton`, `aria-expanded`, fecha ao selecionar/`Escape`) — validar com `npm run lint` + `npx tsc --noEmit`
- [x] **T2.** Criar `src/components/dashboard/dashboard-header.spec.tsx` — links, `aria-current`, navegação por âncora, abrir/fechar do hambúrguer — `npm test`

## Montagem + âncoras

- [x] **T3.** `dashboard/layout.tsx` usa `<DashboardHeader />`; `id="perfil"` no form, `id="habilidades"`/`id="projetos"` + `scroll-mt-*` nas sections; `padding-top` no `main`; `scroll-smooth` no `<html>` — validar com `npm run lint` + `npx tsc --noEmit`

## Fechamento

- [x] **T4.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes + checagem visual desktop e mobile
