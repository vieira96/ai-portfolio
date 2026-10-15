# Tasks 001 — Cadastro de Projetos (Backend)

Referência: `plan.md` (D1–D7) e `spec.md` (R1–R9). Marcar `[x]` ao concluir
cada uma, com validação indicada. Uma por vez.

## Model + Migration

- [x] **T1.** Criar `backend/prisma/schema/project/project.prisma`
  (`Project` + pivô `project_technologies`, SEM imagens) — validar com
  `npx prisma validate`
- [x] **T2.** Usuário roda `migrate dev` + `generate` (comandos manuais)

## DTOs

- [x] **T3.** Criar `backend/src/common/dto/pagination-query.dto.ts` +
  `paginated-response.dto.ts` — validar com `npm run build`
- [x] **T4.** Criar `create-project.dto.ts` (`name`, `description!`, urls?,
  `skills: { name, category }[]?`)
- [x] **T5.** Criar `update-project.dto.ts` via `PartialType`
- [x] **T6.** Criar `project-response.dto.ts` (inclui `technologies`)

## Módulo

- [x] **T7.** Criar `repositories/project.repository.ts` (CRUD + `findAll`
  paginado + writes do pivô em transação)
- [x] **T8.** Criar `services/projects.service.ts` (upsert de skills por nome,
  `PinoLogger`, `NotFoundException`/`ConflictException` onde couber)
- [x] **T9.** Criar `controllers/projects.controller.ts` (`GET` público,
  resto com guard, summaries path puro)
- [x] **T10.** Criar `projects.module.ts` (importa `AuthModule`) + registrar
  no `app.module.ts` — validar boot com `ProjectsModule dependencies initialized`

## Testes (na ordem)

- [x] **T11.** Unit `projects.service.spec.ts` (molde: ok, 404, 409, upsert)
- [x] **T12.** Integração `project.repository.integration.spec.ts` (molde:
  roundtrip uuid, pivô real, cascade no delete)
- [x] **T13.** E2E `projects.e2e-spec.ts` co-locado (molde: helper
  `setupTestApp`, CRUD com cookie, 401 sem cookie, paginação `?page&size`)

## Fechamento

- [x] **T14.** `lint` + `build` + 3 suítes verdes
- [x] **T15.** README magro (fluxo + árvore) + `/openapi.json` com as rotas
