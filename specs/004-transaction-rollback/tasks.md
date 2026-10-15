# Tasks 004 — Transação no Service + Diff Inteligente no Update

Referência: `plan.md` e `spec.md` (R1–R7). Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## Repository

- [x] **T1.** Ajustar `createWithRelations(data, technologyIds, tx?: Prisma.TransactionClient)` — `tx` opcional, default `this.prisma`; se `tx` fornecido → executa direto (sem `$transaction`); métodos internos usam `tx` — validar com `npm run build`
- [x] **T2.** Substituir `updateWithRelations` por versão com diff (`_diffTechnologies`) + `tx?: Prisma.TransactionClient` — mesma regra: sem `$transaction` própria quando `tx` passado — validar com `npm run build`
- [x] **T3.** Rodar testes de integração do repository (`project.repository.integration.spec.ts`) — `npm run test:integration`

## Service

- [x] **T4.** Injetar `PrismaService` no `ProjectsService` (hoje não injeta; adicionar no construtor) — validar com `npm run build`
- [x] **T5.** Refatorar `create()` para usar `this.prisma.$transaction(async (tx) => { ... })` + `resolveSkillIds(skills, tx)` — validar com `npm run build`
- [x] **T6.** Refatorar `update()` para usar `this.prisma.$transaction(async (tx) => { ... })` + `resolveSkillIds(skills, tx)` — validar com `npm run build`
- [x] **T7.** Ajustar `resolveSkillIds` para receber `tx: Prisma.TransactionClient` e usar `tx.technology.upsert` — validar com `npm run build`

## Testes Unitários

- [x] **T8.** Atualizar `projects.service.spec.ts`: mock de `PrismaService` com `$transaction` executando callback e passando `tx` mockado (`Prisma.TransactionClient`); testar create + update chamando `resolveSkillIds` dentro da transação; testar diff (remove, add, keep) — `npm test`

## Testes Integração / E2E

- [x] **T9.** Rodar `npm run test:integration` (repository + service integration) — validar rollback real
- [x] **T10.** Rodar `npm run test:e2e` (CRUD projects com cookie) — validar diff real + rollback real

## Fechamento

- [x] **T11.** `lint` + `build` + `test` (unit + integration + e2e) verdes
- [x] **T12.** Rotas inalteradas — validado por E2E (CRUD projects passa) + unit tests passam; openapi.json é servido em runtime (`/openapi.json` no main.ts), não gerado em build