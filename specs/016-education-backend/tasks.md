# Tasks 016 — CRUD de Education (Backend)

Referência: `plan.md` e `spec.md` (R1–R6). Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## Schema

- [x] **T1.** Criar `prisma/schema/education/education.prisma` (model + enum), rodar `prisma migrate` + regenerate — validar com `npm run build` no backend

## Módulo

- [ ] **T2.** Criar DTOs, repository, service, controller, module + registro no `AppModule` — validar com `npm run build`

## Testes

- [x] **T3.** `educations.service.spec.ts` (404s, datas inválidas, paginação) — `npm test`
- [x] **T4.** `education.repository.integration.spec.ts` (CRUD real) — `npm run test:integration`
- [x] **T5.** `educations.e2e-spec.ts` (CRUD com cookie, 401, 404) — `npm run test:e2e`

## Fechamento

- [x] **T6.** `lint` + `build` + `test` (unit + integration + e2e) verdes
