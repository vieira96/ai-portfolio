# Spec 011 — CRUD de Experiences (Backend)

## Contexto

O README (ETAPA 3/4) exige `Experience` com N:N para `Technology` e CRUD completo. Não existe model nem módulo. O padrão a seguir é o de `projects` (specs 004/010), já com transação no service e `id?` no input — mais o método compartilhado de skills (sem duplicar).

## Requisitos

- **R1 — Schema.** `Experience` (`id` uuid, `company`, `position`, `description` text, `startedAt`/`endedAt` datetime com `endedAt` opcional, `createdAt`/`updatedAt`, `@@map("experiences")`) + pivot `ExperienceTechnology` (`experienceId` + `technologyId`, `onDelete: Cascade`, `@@id`, `@@map("experience_technologies")`); migration aplicada; client regenerado.

- **R2 — DTOs.** `CreateExperienceDto` (company/position/description com `IsString` + `MinLength`, `startedAt`/`endedAt` `IsDateString` opcional, `skills?: {id?, name, category}[]` igual ao `ProjectSkillInput`); `UpdateExperienceDto` (tudo opcional); `ExperienceResponseDto` com `technologies` e `from()` estático.

- **R3 — Método compartilhado.** `TechnologiesService.resolveTechnologyIds(inputs, tx: Prisma.TransactionClient)`: com `id` usa direto sem lookup; sem `id` faz `upsert` por nome. `ProjectsService` apaga o `resolveSkillIds` privado e consome o método (dentro do `$transaction` existente); `ProjectsModule` importa `TechnologiesModule` e remove `TechnologyRepository` dos providers.

- **R4 — Repository.** `createWithRelations`, `findByIdWithRelations`, `findAllPaginated`, `updateWithRelations` com **diff** (padrão 004), `delete`; todos com `tx?: Prisma.TransactionClient` (sem `$transaction` própria quando `tx` fornecido).

- **R5 — Service.** `create()`/`update()` com `this.prisma.$transaction` consumindo o método compartilhado; `findAll` paginado com **padrão 2 por página**; `delete`/`update` com 404; se `startedAt` e `endedAt` presentes e `startedAt > endedAt` → `BadRequestException`.

- **R6 — Controller + module.** `GET /experiences` público (paginado), `GET /experiences/:id` público, `POST/PATCH/DELETE :id` com `JwtAuthGuard` + `ApiCookieAuth`; `DELETE` retorna 204. `ExperiencesModule` (importa `TechnologiesModule`) registrado no `AppModule`.

- **R7 — Testes.** Unitários do service (mock `TechnologiesService` + repository; casos: passthrough, misto, 404s, datas inválidas, paginação); integração do repository (Testcontainers, inclui rollback + diff reais); E2E (CRUD com cookie).

- **R8 — Validação.** `lint` + `build` + `test` (unit + integration + e2e) verdes; zero breaking changes nos módulos existentes.

## Fora de escopo

- Frontend (seção de experiences, checkbox "atual") — spec futura.
- Helper compartilhado de pivot/diff além do resolve — fica para spec futura.
- `GET /projects/:id` pendente — fora desta spec.
