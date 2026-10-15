# Tasks 011 — CRUD de Experiences (Backend)

Referência: `plan.md` e `spec.md` (R1–R8). Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## Schema

- [x] **T1.** Criar `prisma/schema/experience/experience.prisma`, rodar `prisma migrate` + regenerate — validar com `npm run build` no backend

## DTOs

- [x] **T2.** Criar `create/update/experience-response.dto.ts` — validar com `npm run build`

## Método compartilhado

- [x] **T3.** `TechnologiesService.resolveTechnologyIds` + casos em `technologies.service.spec.ts`; refatorar `ProjectsService` (consome o método, apaga privado) + `ProjectsModule` (importa `TechnologiesModule`, remove `TechnologyRepository`); atualizar `projects.service.spec.ts` (mocka `TechnologiesService`) — validar com `npm run build` + `npm test`

## Repository

- [x] **T4.** Criar `experience.repository.ts` (`tx?` + diff desde o início) — validar com `npm run build`

## Service + controller + module

- [x] **T5.** Criar service (consome método compartilhado, paginado padrão 2, 404s, datas), controller, module + registro no `AppModule` — validar com `npm run build`

## Testes

- [x] **T6.** `experiences.service.spec.ts` (passthrough, misto, 404s, datas, paginação) — `npm test`
- [x] **T7.** `experience.repository.integration.spec.ts` (rollback + diff reais) — `npm run test:integration`
- [x] **T8.** `experiences.e2e-spec.ts` (CRUD com cookie) — `npm run test:e2e`

## Fechamento

- [x] **T9.** `lint` + `build` + `test` (unit + integration + e2e) verdes
