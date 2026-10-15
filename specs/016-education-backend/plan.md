# Plan 016 — CRUD de Education (Backend)

## Contexto

Ver `spec.md`. Módulo simples: tabela única, sem relações, sem transação.

## Decisão

**Espelhar `technologies` na simplicidade + `experiences` na paginação.**

- Prisma (`prisma/schema/education/education.prisma`, novo): `Education` + enum `EducationDegree`, `@@map("educations")`; migration + regenerate. Sem pivot, sem back-relation em `Technology`.
- DTOs: `create/update/education-response.dto.ts`; `startedAt`/`endedAt`/`expectedEnd` como strings ISO (`IsDateString`, opcionais); `degree` `IsEnum` opcional.
- Repository (`experience`→`education`, sem `tx?`, sem diff): `create`, `findById`, `findAllPaginated` (ordenar `startedAt DESC`), `update`, `delete` — Prisma direto via `PrismaService`, sem `$transaction` (escrita em tabela única não precisa).
- Service: `create`/`findAll` (padrão 2)/`findOne`/`update`/`delete` com 404; `validateDates` (`startedAt > endedAt` → `BadRequest`); sem `PrismaService`/`TechnologiesService` injetados (sem relações, sem transação).
- Controller: `GET /` + `GET /:id` públicos; `POST/PATCH/DELETE` com guard; `DELETE` 204. `EducationsModule` (imports `AuthModule`) + registro no `AppModule`.

## Arquivos a alterar/criar

### Novos

1. `backend/prisma/schema/education/education.prisma` — model + enum.
2. `backend/prisma/migrations/*` — via CLI (gerado).
3. `backend/src/modules/educations/dto/create-education.dto.ts`.
4. `backend/src/modules/educations/dto/update-education.dto.ts`.
5. `backend/src/modules/educations/dto/education-response.dto.ts`.
6. `backend/src/modules/educations/repositories/education.repository.ts`.
7. `backend/src/modules/educations/services/educations.service.ts`.
8. `backend/src/modules/educations/controllers/educations.controller.ts`.
9. `backend/src/modules/educations/educations.module.ts`.
10. `backend/src/modules/educations/services/educations.service.spec.ts` — unitários.
11. `backend/src/modules/educations/repositories/education.repository.integration.spec.ts` — integração.
12. `backend/src/modules/educations/educations.e2e-spec.ts` — E2E.

### Existentes (modificações)

13. `backend/src/app.module.ts` — registra `EducationsModule`.
14. Client Prisma gerado — regenerado via CLI.

## Ordem de execução (proposta — tasks a seguir)

1. **Schema + migration + regenerate.**
2. **DTOs + repository + service + controller + module.**
3. **Testes**: unitários → integração → E2E.
4. **Validação**: `lint` + `build` + `test` verdes.

## Riscos

- Mínimo: CRUD simples, padrões copiados de módulos existentes.
- Nome do módulo no plural em inglês: `educations` (segue `experiences`/`technologies`; "education" como incontável soaria estranho em rotas).
