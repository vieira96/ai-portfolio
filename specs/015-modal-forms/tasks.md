# Tasks 015 — Extrair Forms dos Modais com Formulário

Referência: `plan.md` e `spec.md` (R1–R4). Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## `ProjectForm`

- [x] **T1.** Extrair `forms/project-form.tsx` (campos, schema, `SkillsSelection`, submit/fetch, passo `NewSkillsModal`, `saving`/`error`); modal fica só com shell + repasse — validar com `npm run lint` + `npx tsc --noEmit`
- [x] **T2.** Specs (`project-form.spec` novo + `project-modal.spec` adaptado, inclui fluxo aninhado) — `npm test`

## `ExperienceForm`

- [x] **T3.** Extrair `forms/experience-form.tsx` (mesmo padrão + datas/checkbox) — validar com `npm run lint` + `npx tsc --noEmit`
- [x] **T4.** Specs (`experience-form.spec` novo + `experience-modal.spec` adaptado) — `npm test`

## `AddSkillForm`

- [x] **T5.** Extrair `forms/add-skill-form.tsx` (nome/categoria + schema) — validar com `npm run lint` + `npx tsc --noEmit`
- [x] **T6.** Specs (`add-skill-form.spec` novo + `add-skill-modal.spec` adaptado) — `npm test`

## Fechamento

- [x] **T7.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes + checagem visual (modais idênticos)
