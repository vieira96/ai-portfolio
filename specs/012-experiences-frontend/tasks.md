# Tasks 012 — Experiences no Frontend (Dashboard)

Referência: `plan.md` e `spec.md` (R1–R5). Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## Visual com dados fake

- [x] **T1.** Implementar `ExperienceCard`, `ExperiencesSection` e `ExperienceModal` com dados mockados (2–3 experiences, com/sem `endedAt`) — checagem visual primeiro (sem ligar na API)

## Dados

- [x] **T2.** `lib/experiences`, `types/experiences`, rotas `/api/experiences` + `/[id]` — validar com `npm run lint` + `npx tsc --noEmit`

## Componentes + integração

- [x] **T3.** Ligar componentes nos dados reais; `ExperienceModal` (schema, checkbox "atual", `SkillsSelection`) + `experience-modal.spec.tsx` — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`
- [x] **T4.** `ExperiencesSection` (paginação size 2, `ConfirmModal`, specs) + dashboard (`page`, `DashboardClient`, 4º link no header) — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`

## Fechamento

- [x] **T5.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes + checagem visual desktop e mobile
