# Tasks 003 — Projetos no Dashboard (Frontend)

Referência: `plan.md` (D1–D6) e `spec.md` (R1–R7). Marcar `[x]` ao concluir
cada uma, com validação indicada. Uma por vez.

## Base tipada

- [x] **T1.** Criar `frontend/src/types/projects/projects.types.ts`
  (`Project` com `technologies: Skill[]`) — validar com `tsc`
- [x] **T2.** Criar `frontend/src/lib/projects/projects.ts`
  (`getProjects(page?, size?)` com fallback `[]`) — validar com `tsc`

## BFF (contrato antes da UI)

- [x] **T3.** Criar `frontend/src/app/api/projects/route.ts`
  (`GET` repassa + `POST` com cookie) + spec co-locado — validar com `curl`
  + `npm test`
- [x] **T4.** Criar `frontend/src/app/api/projects/[id]/route.ts`
  (`PATCH` + `DELETE` com cookie) + spec co-locado — validar com `curl`
  + `npm test`

## UI

- [x] **T5.** Criar `project-card.tsx` (+ spec) — nome, descrição, links,
  chips via `SkillChip`
- [x] **T6.** Criar `projects-section.tsx` (+ spec) — lista vazia/cheia,
  paginação anterior/próxima, orquestra modais
- [x] **T7.** Criar `project-modal.tsx` (+ spec + Zod) — add/edit +
  modal coletivo de categorias antes do POST
- [x] **T8.** Editar `dashboard/page.tsx` — +seção Projetos com dados via props

## Fechamento

- [x] **T9.** `lint` + `test` + `build` verdes no front
- [x] **T10.** README magro (seção Projetos) + conferir no browser —
  README: estrutura + fluxo-chave; rotas conferidas via `next start`
  (`/auth/login` 200, `/dashboard` 307→login, `/api/projects` 200)
