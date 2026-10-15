# Plan 018 — `GET /projects/:id` (Só API)

## Contexto

Ver `spec.md`. Menor spec do repo: um endpoint espelhando `findOne` de experiences/educations.

## Decisão

- Controller: `@Get(':id')` público (sem guard), `@ApiResponse` 200 (`ProjectResponseDto`) + 404, antes ou depois das rotas existentes (sem conflito: path exato vs. parâmetro — manter `list` primeiro por convenção).
- Service: `findOne` com `findByIdWithRelations` + `NotFoundException('Project not found')`; repository intacto.

## Arquivos a alterar/criar

### Existentes (modificações)

1. `backend/src/modules/projects/controllers/projects.controller.ts` — `GET :id`.
2. `backend/src/modules/projects/services/projects.service.ts` — `findOne`.
3. `backend/src/modules/projects/services/projects.service.spec.ts` — casos.

### Intocados

- Repository, DTOs, frontend, resto do backend.

## Ordem de execução

1. **Service + controller + unit.**
2. **E2E** (200/404).
3. **Validação**: `lint` + `build` + `test` verdes.

## Riscos

- Nenhum relevante: espelho direto de código existente.
