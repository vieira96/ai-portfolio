# Tasks 017 — Education no Frontend (Dashboard)

Referência: `plan.md` e `spec.md` (R1–R6). Pré-requisito: spec 016 concluída. Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## Dados

- [x] **T1.** `lib/educations`, `types/educations`, rotas `/api/educations` + `/[id]` — validar com `npm run lint` + `npx tsc --noEmit`

## Componentes

- [x] **T2.** `EducationModal` (campos, select de degree, datas, checkbox "cursando", schema) + `education-modal.spec.tsx` — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`
- [x] **T3.** `EducationCard` + `EducationsSection` (paginação size 2, `ConfirmModal`, specs) + dashboard (`page`, `DashboardClient`, 5º link no header) — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`

## Extrair `EducationForm`

- [x] **T5.** Extrair `forms/education-form.tsx` (padrão 015: form com tudo, modal só shell) + spec do form; adaptar `education-modal.spec.tsx` — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`

## Fechamento

- [x] **T6.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes + checagem visual desktop e mobile
