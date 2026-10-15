# Plan 017 — Education no Frontend (Dashboard)

## Contexto

Ver `spec.md`. Pré-requisito: `spec 016` (backend) concluída.

## Decisão

**Espelhar `ExperiencesSection`/`ExperienceModal`, reutilizando `ConfirmModal` e `SkillsSelection` onde couber (education não tem skills — sem combobox).**

- lib + types: `lib/educations/educations.ts` (`getEducations(page, size)`, `EducationsPage`) + `types/educations/educations.types.ts` (`Education`).
- Rotas `/api`: `/api/educations` (GET passthrough, POST com cookie) + `/api/educations/[id]` (GET/PATCH/DELETE com cookie).
- `EducationModal`: campos + `degree` (select nativo com os 5 valores) + datas + checkbox "cursando" (limpa `endedAt`, habilita `expectedEnd`) + schema zod espelhando a regra do backend; `submitWithSkills` adaptado para payload sem skills (`POST/PATCH /api/educations`).
- `EducationForm` (`forms/education-form.tsx`): extração padrão 015 — form com tudo (campos, schema, submit, `saving`/`error`); modal só shell + repasse.
- `EducationCard`: instituição, curso + degree, período (`jan/2020 – atual` ou `– previsão mar/2026`), descrição + editar/excluir.
- `EducationsSection`: props `initialPage` + paginação size 2 + modal criar/editar + `ConfirmModal`; sem skills (fora de escopo da 016).
- Dashboard: `page.tsx` fetch + `DashboardClient` repasse + seção após Experiências + 5º link "Formação" no header (`id="formacao"` + `scroll-mt-*`).

## Arquivos a alterar/criar

### Novos

1. `frontend/src/lib/educations/educations.ts` — client + `EducationsPage`.
2. `frontend/src/types/educations/educations.types.ts` — `Education`.
3. `frontend/src/app/api/educations/route.ts` — GET/POST.
4. `frontend/src/app/api/educations/[id]/route.ts` — GET/PATCH/DELETE.
5. `frontend/src/components/educations/modals/education-modal.tsx` (+ schema + spec).
6. `frontend/src/components/educations/forms/education-form.tsx` (+ spec) — extração; modal vira shell.
6. `frontend/src/components/educations/cards/education-card.tsx` (+ spec se preciso).
7. `frontend/src/components/educations/sections/educations-section.tsx` (+ spec).

### Existentes (modificações)

8. `frontend/src/app/dashboard/page.tsx` — fetch + repasse.
9. `frontend/src/app/dashboard/dashboard-client.tsx` — recebe e repassa para a seção.
10. `frontend/src/components/dashboard/dashboard-header.tsx` (+ spec) — 5º link.

## Ordem de execução

1. **lib + types + rotas `/api`.**
2. **Modal + card + section + specs.**
3. **Integração dashboard** (page, client, header).
4. **Validação**: `lint` + `tsc` + `test` + `build` verdes + checagem visual.

## Riscos

- Baixo: padrões copiados de `experiences` (já validados); sem combobox nem categorias — modal mais simples que os anteriores.
- Datas: `expectedEnd` só faz sentido cursando — checkbox controla; teste cobre.
