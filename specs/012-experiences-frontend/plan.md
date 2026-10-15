# Plan 012 — Experiences no Frontend (Dashboard)

## Contexto

O backend de experiences está pronto (`spec 011`): `GET /experiences` paginado (default 2), `GET /:id` públicos; `POST/PATCH/DELETE` com cookie; skills `[{id?, name, category}]`; `endedAt` opcional; 400 em datas invertidas. Falta a camada web no dashboard, espelhando o padrão de `projects` (`lib/*` server-fetch, rotas `/api/*` com cookie, section client com modal + `ConfirmModal` + paginação).

## Decisão

**Espelhar `ProjectsSection`/`ProjectModal`, reutilizando `SkillsSelection` e `ConfirmModal`.**

- lib + types: `lib/experiences/experiences.ts` (`getExperiences(page, size)`, `ExperiencesPage`) + `types/experiences/experiences.types.ts` (`Experience` com `technologies: Skill[]`).
- Rotas `/api`: `/api/experiences` (GET passthrough, POST com cookie) + `/api/experiences/[id]` (GET/PATCH/DELETE com cookie).
- `ExperienceModal`: company, position, description, `startedAt`/`endedAt` (inputs date), checkbox "emprego atual" limpa `endedAt`, `SkillsSelection` para skills, schema zod do form.
- `ExperienceCard`: período (`jan/2023 – atual`) + chips de skills + botões editar/excluir.
- `ExperiencesSection`: lista paginada (size 2), modal criar/editar, `ConfirmModal` para excluir; props `initialPage` + `skills`/`onSkillsCreated` (mesmo encadeamento de `ProjectsSection`).
- Dashboard: seção após Projetos + 4º link "Experiências" no `DashboardHeader` (altera a 009) + fetch na `dashboard/page.tsx` + repasse no `DashboardClient`.
- Visual primeiro com dados fake: implementar os componentes visuais (`ExperienceCard`, `ExperiencesSection`, `ExperienceModal`) alimentados por dados mockados (2–3 experiences + skills variadas, com e sem `endedAt`) antes de ligar na API — valida exibição, paginação visual, modal e responsivo sem depender do backend.

## Arquivos a alterar/criar

### Novos

1. `frontend/src/lib/experiences/experiences.ts` — client + `ExperiencesPage`.
2. `frontend/src/types/experiences/experiences.types.ts` — `Experience`.
3. `frontend/src/app/api/experiences/route.ts` — GET/POST.
4. `frontend/src/app/api/experiences/[id]/route.ts` — GET/PATCH/DELETE.
5. `frontend/src/components/experiences/modals/experience-modal.tsx` (+ schema).
6. `frontend/src/components/experiences/cards/experience-card.tsx`.
7. `frontend/src/components/experiences/sections/experiences-section.tsx`.
8. Specs: `experience-modal.spec.tsx`, `experiences-section.spec.tsx` (+ card se preciso).

### Existentes (modificações)

9. `frontend/src/app/dashboard/page.tsx` — fetch + repasse.
10. `frontend/src/app/dashboard/dashboard-client.tsx` — recebe e repassa para a seção.
11. `frontend/src/components/dashboard/dashboard-header.tsx` (+ spec) — 4º link.

## Ordem de execução (proposta — spec + tasks a seguir)

1. **Spec + tasks** derivadas deste plano.
2. **Visual com dados fake** (card, section, modal) + checagem visual primeiro.
3. **lib + types + rotas `/api`.**
4. **Modal + card + section + specs** (ligando nos dados reais).
4. **Integração dashboard** (page, client, header).
5. **Validação**: `lint` + `tsc` + `test` + `build` verdes + checagem visual.

## Dúvidas (responder antes de implementar)

- **D1 — 4º link no header?** Recomendo sim (altera a 009).
- **D2 — Seção após Projetos, fim da página?** Recomendo sim.
- **D3 — Checkbox "emprego atual" limpa `endedAt`?** Recomendo sim.
- **D4 — Card com período + chips?** Recomendo sim.
- **D5 — Só dashboard, sem página pública?** Recomendo sim (home pública é outra etapa do README).

## Riscos

- Baixo: padrões copiados de `projects` (já validados); `SkillsSelection` e `ConfirmModal` reutilizados sem mudança.
- `endedAt` nulo no card ("atual") — cobrir em teste.
