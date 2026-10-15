# Spec 018 — `GET /projects/:id` (Só API)

## Contexto

O controller de `projects` tem lista, create, update e delete — mas não o detalhe por id (ao contrário de `experiences` e `educations`, que têm). Não haverá página pública de detalhe (decisão do usuário), então o escopo é **só o endpoint**.

## Requisitos

- **R1 — Endpoint.** `GET /projects/:id` público: 200 com `ProjectResponseDto` (incluindo `technologies`); 404 `Project not found` se inexistente.

- **R2 — Service.** `ProjectsService.findOne(id)` via `projectRepository.findByIdWithRelations(id)` (já existe, sem mudança no repository); 404 quando nulo.

- **R3 — Testes.** Unitário (retorna/404); E2E (200 com technologies, 404).

- **R4 — Validação.** `npm run lint` + `npm run build` + `test` verdes no backend.

## Fora de escopo

- Página `/projects/[id]` — não vai existir (decisão do usuário).
- Mudança no repository ou em outros endpoints.
