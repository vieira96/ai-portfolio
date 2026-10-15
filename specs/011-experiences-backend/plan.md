# Plan 011 — CRUD de Experiences (Backend)

## Contexto

O README (ETAPA 3/4) exige `Experience` (id, company, position, description, startedAt, endedAt?) com N:N para `Technology`, e CRUD `GET/POST/PATCH/DELETE /experiences` (+ `GET /:id`). Hoje não existe model nem módulo: só `auth`, `projects`, `technologies`, `uploads`, `users`.

## Decisão

**Espelhar o módulo `projects` (que já resolveu N:N + transação na spec 004), já nascendo com o padrão correto.**

- Prisma (`prisma/schema/experience/experience.prisma`, novo):
  - `Experience`: `id` uuid (`dbgenerated("gen_random_uuid()")`), `company`, `position`, `description` (`@db.Text`), `startedAt`/`endedAt` `DateTime` (`endedAt` opcional = emprego atual), `technologies ExperienceTechnology[]`, `createdAt`/`updatedAt`, `@@map("experiences")`.
  - `ExperienceTechnology`: `experienceId` + `technologyId` (uuid), relations com `onDelete: Cascade`, `@@id([experienceId, technologyId])`, `@@map("experience_technologies")`.
  - Migration via `prisma migrate`; regenerar client.

- Módulo `src/modules/experiences/` espelhando `projects/`:
  - `dto/`: `CreateExperienceDto`, `UpdateExperienceDto` (todos opcionais), `ExperienceResponseDto` (com `technologies`, `from()` estático); skills como `{id?, name, category}` igual ao `ProjectSkillInput` atual (com `id` opcional da spec 010).
  - `repositories/experience.repository.ts`: `createWithRelations`, `findByIdWithRelations`, `findAllPaginated`, `updateWithRelations` com **diff** (padrão 004), `delete`; todos com `tx?: Prisma.TransactionClient`.
  - `services/experiences.service.ts`: `create()`/`update()` com `this.prisma.$transaction`, consumindo o método compartilhado abaixo; `findAll` paginado (**padrão 2 itens por página**, D3); `delete`/`update` com 404.
  - `controllers/experiences.controller.ts`: `GET /experiences` público (paginado), `GET /experiences/:id` público, `POST/PATCH/DELETE :id` com `JwtAuthGuard` + `ApiCookieAuth`; `DELETE` retorna 204.
  - `experiences.module.ts` + registro no `AppModule` (ao lado de `ProjectsModule`, `app.module.ts:29-30`).
  - Validação de datas no service: se `startedAt` e `endedAt` presentes, `startedAt <= endedAt`, senão `BadRequestException`.

- Método compartilhado de skills (sem duplicar entre services):
  - `TechnologiesService.resolveTechnologyIds(inputs: Array<{ id?: string; name: string; category: TechnologyCategory }>, tx: Prisma.TransactionClient): Promise<string[]>` — com `id` usa direto (confia, sem lookup); sem `id` faz `tx.technology.upsert` por nome (tipo estrutural, sem importar DTO de outro módulo).
  - `ProjectsService`: apaga o `resolveSkillIds` privado, injeta `TechnologiesService` e consome o método (dentro do `$transaction` já existente); remove `TechnologyRepository` dos providers do `ProjectsModule` (não terá mais uso lá).
  - `ExperiencesService`: mesma injeção/consumo desde o início.
  - Wiring: `ProjectsModule` e `ExperiencesModule` importam `TechnologiesModule` (que já exporta o service e só importa `AuthModule` — sem ciclo).
  - Testes: `technologies.service.spec.ts` ganha casos do método (mock de `tx`); `projects.service.spec.ts` passa a mockar `TechnologiesService.resolveTechnologyIds` em vez de `tx.technology.upsert`; specs de experiences mockam igual.

## Arquivos a alterar/criar

### Novos

1. `backend/prisma/schema/experience/experience.prisma` — models + pivot.
2. `backend/prisma/migrations/*` — via CLI (gerado).
3. `backend/src/modules/experiences/dto/create-experience.dto.ts`.
4. `backend/src/modules/experiences/dto/update-experience.dto.ts`.
5. `backend/src/modules/experiences/dto/experience-response.dto.ts`.
6. `backend/src/modules/experiences/dto/experience-pagination-query.dto.ts` — `size` padrão 2 (o `PaginationQueryDto` fixa 4; `?? 2` no service seria morto).
7. `backend/src/modules/experiences/repositories/experience.repository.ts`.
8. `backend/src/modules/experiences/services/experiences.service.ts`.
9. `backend/src/modules/experiences/controllers/experiences.controller.ts`.
10. `backend/src/modules/experiences/experiences.module.ts`.
11. `backend/src/modules/experiences/services/experiences.service.spec.ts` — unitários.
12. `backend/src/modules/experiences/repositories/experience.repository.integration.spec.ts` — integração.
13. `backend/src/modules/experiences/experiences.e2e-spec.ts` — E2E.

### Existentes (modificações)

14. `backend/src/app.module.ts` — registra `ExperiencesModule`.
15. Client Prisma gerado — regenerado via CLI.
16. `backend/prisma/schema/technology/technology.prisma` — back-relation `experiences` (obrigatório para validar a relation).
17. `backend/src/modules/technologies/services/technologies.service.ts` — novo método `resolveTechnologyIds`.
18. `backend/src/modules/technologies/services/technologies.service.spec.ts` — casos do método.
19. `backend/src/modules/projects/services/projects.service.ts` — consome o método compartilhado; apaga `resolveSkillIds` privado.
20. `backend/src/modules/projects/services/projects.service.spec.ts` — mocka `TechnologiesService`.
21. `backend/src/modules/projects/projects.module.ts` — importa `TechnologiesModule`; remove `TechnologyRepository` dos providers.

## Ordem de execução (proposta — spec + tasks a seguir)

1. **Schema + migration + regenerate.**
2. **DTOs.**
3. **Método compartilhado** em `TechnologiesService` + refator `ProjectsService`/`ProjectsModule` + testes.
4. **Repository** (com `tx?` + diff desde o início).
5. **Service** (consome o método compartilhado) + **controller** + **module**.
6. **Testes**: unitários → integração → E2E.
7. **Validação**: `lint` + `build` + `test` (unit + integration + e2e) verdes.

## Decisões (respondidas)

- **D1 — Escopo da relação N:N?** README manda `Experience N:N Technology` (pivot + resolve + diff, igual `projects`). Alternativa seria CRUD simples primeiro e relação depois. Recomendo completo de uma vez (padrão já dominado na 004/010). -> completo.
- **D2 — `endedAt` opcional + validação?** `endedAt` ausente = emprego atual; com ambos presentes, exigir `startedAt <= endedAt` (`BadRequest`)? Recomendo sim. -> sim, pode exigir que seja maior.
- **D3 — Lista paginada ou cheia?** `GET /experiences` paginado igual `projects` (recomendo — dashboard vai paginar) vs. lista cheia igual `technologies`? -> paginado, 2 itens por vez por padrão.
- **D4 — `GET /:id` agora?** README lista, e a futura página de detalhes vai precisar. Recomendo incluir (barato). -> sim, pode incluir.

## Riscos

- Baixo-médio: código espelha `projects` (padrão validado); a lógica de resolve **não** é duplicada — vive no método compartilhado do `TechnologiesService`.
- DI entre módulos sem ciclo (`TechnologiesModule` só importa `AuthModule`); specs unitários mockam `TechnologiesService` em vez do `tx`.
- `endedAt` opcional precisa de contrato claro no frontend depois (checkbox "atual") — fora desta spec (backend).
