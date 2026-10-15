# Spec 016 — CRUD de Education (Backend)

## Contexto

Para gerar CVs (inclusive ATS) a partir das experiências, falta a área de estudos do usuário: faculdade, cursos, certificações — com início, fim e previsão de término. O README não modela educação; esta spec cria do zero, espelhando o padrão de `experiences` (spec 011), **sem** relação N:N com `Technology`.

## Requisitos

- **R1 — Schema.** `Education` (`id` uuid, `institution`, `course`, `degree?` enum, `description?` text, `startedAt`/`endedAt` datetime com `endedAt` opcional, `expectedEnd?` datetime opcional, `createdAt`/`updatedAt`, `@@map("educations")`); enum `EducationDegree` (`GRADUACAO`, `POS`, `TECNICO`, `CURSO_LIVRE`, `CERTIFICACAO`); migration aplicada; client regenerado.
  - Semântica: `endedAt` presente = concluído; `endedAt` nulo = cursando; `expectedEnd` = previsão (só faz sentido cursando).

- **R2 — DTOs.** `CreateEducationDto` (institution/course `IsString` + `MinLength(2)`, `degree` `IsEnum` opcional, `description` `IsString` + `MinLength(10)` opcional, `startedAt` `IsDateString` obrigatório, `endedAt`/`expectedEnd` `IsDateString` opcionais); `UpdateEducationDto` (tudo opcional); `EducationResponseDto` com `from()` estático.

- **R3 — Service.** `create()`/`update()`/`findAll` (paginado, padrão 2 por página)/`findOne`/`delete()` com 404; se `startedAt` e `endedAt` presentes e `startedAt > endedAt` → `BadRequestException`. Sem transação (escrita em tabela única, sem relações).

- **R4 — Controller + module.** `GET /educations` público (paginado), `GET /educations/:id` público, `POST/PATCH/DELETE :id` com `JwtAuthGuard` + `ApiCookieAuth`; `DELETE` retorna 204. `EducationsModule` registrado no `AppModule`.

- **R5 — Testes.** Unitários do service (404s, datas inválidas, paginação); integração do repository (CRUD real); E2E (CRUD com cookie, 401, 404).

- **R6 — Validação.** `npm run lint` + `npm run build` + `test` (unit + integration + e2e) verdes; zero breaking changes nos módulos existentes.

## Fora de escopo

- Frontend (seção de education) — spec futura.
