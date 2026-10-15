# Tasks 006 — Setup do shadcn/ui (instalação, sem migração)

Referência: `plan.md` e `spec.md` (R1–R3). Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## Setup shadcn

- [x] **T1.** Rodar `shadcn init` (new-york, rsc, `src/app/globals.css`, alias `@/*`) + revisar `components.json` e diff de `globals.css` (preservar `@theme` atual) e `package.json` — validar com `git diff` + `npm run lint`
- [x] **T2.** Adicionar `dialog` via CLI + conferir arquivos gerados (`components/ui/dialog.tsx`, deps) — validar com `npm run lint`
- [x] **T3.** Adicionar `popover` + `command` via CLI + conferir arquivos gerados e `lib/utils.ts` — validar com `npm run lint`

## Fechamento

- [x] **T4.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes, com zero mudança de comportamento
