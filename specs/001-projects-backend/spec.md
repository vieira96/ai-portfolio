# Spec 001 — Cadastro de Projetos (Backend)

## Contexto

O portfólio precisa exibir os projetos do dono (ex: Auth API, Library API,
FlowdeskAPI). Hoje não existe nada de Projeto no backend: nem model, nem
módulo. A exibição no front vive na spec 002.

## Requisitos

- **R1.** Model `Project` no Prisma: `id` (UUID nativo via `gen_random_uuid()`),
  `name` (obrigatório), `description` (obrigatória, texto), `repositoryUrl`
  (opcional), `demoUrl` (opcional), `createdAt`, `updatedAt`, tabela `projects`.
- **R2.** Relação N:N com `Technology` via pivô `project_technologies`
  (conforme README raiz, ETAPA 3).
- **R3.** Migration + client regenerado (`migrate dev` + `generate`).
- **R4.** Módulo `projects/` no padrão do repo (`controllers/`, `services/`,
  `repositories/`, `dto/`, `*.module.ts`): `GET /projects` público com
  paginação (`?page=` e `?size=`, default 4 por página); `POST`, `PATCH`,
  `DELETE` protegidos por cookie (guard existente).
  Sem `GET /:id` (sem página de detalhe, mesmo corte do technologies).
- **R5.** DTOs com `class-validator` + `PartialType` no update e response DTO
  (padrão technologies). Query com `PaginationQueryDto` (`page` ≥ 1, `size`
  1–20, defaults 1/4) em `src/common/dto/` (genérico, reusável por qualquer
  módulo futuro). Resposta do `GET` no envelope genérico
  `PaginatedResponseDto<TData>` (`{ data, total, page, totalPages }`),
  também em `src/common/dto/`.
- **R6.** Regras: `name` min 2; `description` obrigatória; URLs válidas
  quando presentes.
- **R7.** Skills no create/update: lista de objetos `{ name, category }`;
  nome existente vincula, nome novo **cria** a `Technology` **com a categoria
  informada**. O front garante a categoria antes (modal dedicado para skills
  ainda-não-salvas); o backend valida (categoria obrigatória nesse fluxo).
- **R8.** Testes no padrão do repo: unit do service, integração do repository
  (Testcontainers), e2e do CRUD (supertest + cookie jar).
- **R9.** Scalar com `summary` = path puro.

## Fora de escopo

- Fotos/galeria do projeto (sem `ProjectImage`; se um dia precisar, spec própria).
