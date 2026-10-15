# Spec 012 — Experiences no Frontend (Dashboard)

## Contexto

O backend de experiences está pronto (`spec 011`): `GET /experiences` paginado (default 2), `GET /:id` públicos; `POST/PATCH/DELETE` com cookie; skills `[{id?, name, category}]`; `endedAt` opcional. Falta a camada web no dashboard, espelhando `projects`. Assume as recomendações das dúvidas do plano (D1–D5).

## Requisitos

- **R1 — Visual com dados fake primeiro.** Implementar `ExperienceCard`, `ExperiencesSection` e `ExperienceModal` alimentados por dados mockados (2–3 experiences + skills variadas, com e sem `endedAt`) antes de ligar na API; validar exibição, paginação visual, modal e responsivo.

- **R2 — Dados.** `lib/experiences/experiences.ts` (`getExperiences`, `ExperiencesPage`), `types/experiences.ts` (`Experience`), rotas `/api/experiences` (GET/POST) e `/api/experiences/[id]` (GET/PATCH/DELETE) com cookie onde precisa.

- **R3 — Componentes.** `ExperienceModal` (company, position, description, `startedAt`/`endedAt` date, checkbox "emprego atual" limpa `endedAt`, `SkillsSelection` reutilizado, schema zod); `ExperienceCard` (período `jan/2023 – atual` + chips de skills + editar/excluir); `ExperiencesSection` (lista paginada size 2, modal criar/editar, `ConfirmModal` para excluir; props `initialPage` + `skills`/`onSkillsCreated`).

- **R4 — Dashboard.** Seção após Projetos + 4º link "Experiências" no `DashboardHeader` (altera a 009) + fetch na `page.tsx` + repasse no `DashboardClient`.

- **R5 — Validação.** Specs novos (modal, section, card se preciso); `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes; checagem visual desktop e mobile.

## Fora de escopo

- Página pública de experiences (home) — outra etapa do README.
- Outros módulos/componentes — inalterados.
- Reformulação visual — identidade atual.
