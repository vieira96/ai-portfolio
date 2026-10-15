# Spec 017 — Education no Frontend (Dashboard)

## Contexto

Backend pronto (`spec 016`): CRUD, paginação size 2, enum `EducationDegree`, datas com `endedAt` opcional. Falta a camada web no dashboard, espelhando `ExperiencesSection`.

## Requisitos

- **R1 — Dados.** `lib/educations/educations.ts` (`getEducations`, `EducationsPage`), `types/educations.ts` (`Education`), rotas `/api/educations` (GET/POST) e `/api/educations/[id]` (GET/PATCH/DELETE) com cookie onde precisa.

- **R2 — `EducationModal`.** institution, course, degree (select fixo com os 5 valores), description, `startedAt`/`endedAt`/`expectedEnd` (inputs date), checkbox "cursando" (limpa `endedAt`, libera `expectedEnd`), schema zod com a mesma regra de datas do backend.

- **R3 — `EducationCard` + `EducationsSection`.** Card (instituição, curso + degree, período com "atual"/previsão, descrição); section CRUD com paginação size 2, modal criar/editar, `ConfirmModal` para excluir.

- **R4 — Dashboard.** Seção **Formação** após Experiências (fim da página) + 5º link "Formação" no `DashboardHeader` + `id`/âncora + fetch na `page.tsx` + repasse no `DashboardClient`.

- **R5 — Validação.** Specs novos (modal, section); `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes; checagem visual desktop e mobile.

- **R6 — Extrair `EducationForm`.** Mesma separação da spec 015: `forms/education-form.tsx` com tudo de form (campos, schema, submit/fetch, `saving`/`error`); modal fica só com shell `Dialog` + repasse. Spec do form + modal adaptado.

## Fora de escopo

- Página pública — outra etapa.
- Demais módulos/componentes — inalterados.
- Reformulação visual — identidade atual.
