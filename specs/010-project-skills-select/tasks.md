# Tasks 010 — Seleção de Skills por Chips + Payload com `id` Opcional

Referência: `plan.md` e `spec.md` (R1–R4 + R2.1). Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## Backend

- [x] **T1.** `ProjectSkillInput` com `id?` + `resolveSkillIds` com passthrough (sem `id` → upsert); unitários (passthrough, misto, criação) — validar com `npm run build` + `npm test` no backend

## Frontend (`SkillsSelection`)

- [x] **T2.** Reescrever para chips (2 desktop / 1 mobile + "+N" clicável), label, digitação no `CommandInput`, chip neutro, toggle + X, `onSelect` único — validar com `npm run lint` + `npx tsc --noEmit`
- [x] **T3.** Spec do componente (selecionar/desselecionar, toggle, chip neutro, vazio, clique abre, `onFocus` não abre) — `npm test`

## `ProjectModal`

- [x] **T4.** Payload estruturado `{id?, name, category}` + fluxo categorizar preservado; adaptar `project-modal.spec.tsx` — `npm test`

## Fechamento

- [x] **T5.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes + checagem visual

## R2.1 — Textos do combobox

- [x] **T6.** Aplicar label "Selecione ou digite uma ou mais habilidade(s)" + placeholder "Buscar ou criar habilidade" + vazio "Habilidade nova" no componente e no spec — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`
