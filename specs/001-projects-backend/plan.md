# Plan 001 — Cadastro de Projetos (Backend)

Referência: `spec.md` (R1–R9). Nada fora dela entra sem aprovar antes.

## Decisões

| # | Decisão | Motivo |
|---|---|---|
| D1 | `description` obrigatória (`String`, sem `?`) | Exigido na spec |
| D2 | Sem fotos no projeto (sem `ProjectImage`, sem upload vinculado) | Galeria complica sem necessidade agora; spec futura se preciso |
| D3 | Skills como objetos `{ name, category }`: existente vincula, nova cria com a categoria informada (front garante via modal antes de salvar) | Sem categoria nula; front dono da UX, back valida |
| D4 | `GET /projects` com `?page=`/`?size=` (defaults 1/4, teto 20) | Spec trancada |
| D5 | DTOs genéricos em `src/common/dto/` (`PaginationQueryDto`, `PaginatedResponseDto<T>`) | Reuso por módulos futuros |
| D6 | Sem `GET /:id` | Sem página de detalhe (corte technologies) |
| D7 | `summary` = path puro no Scalar | Padrão da casa |

## Arquivos

### Criar

1. `backend/prisma/schema/project/project.prisma` — `Project` + pivô `project_technologies`
2. `backend/src/modules/projects/dto/create-project.dto.ts` — `name`, `description!`, urls?, `skills: { name, category }[]?`
3. `backend/src/modules/projects/dto/update-project.dto.ts` — `PartialType` do create
4. `backend/src/modules/projects/dto/project-response.dto.ts` — inclui `technologies`
5. `backend/src/modules/projects/repositories/project.repository.ts` — CRUD + `findAll` paginado + transação do pivô
6. `backend/src/modules/projects/services/projects.service.ts` — regra + upsert de skills + `PinoLogger`
7. `backend/src/modules/projects/controllers/projects.controller.ts` — `GET` público; resto com guard; summaries path puro
8. `backend/src/modules/projects/projects.module.ts` — importa `AuthModule`
9. `backend/src/common/dto/pagination-query.dto.ts` + `paginated-response.dto.ts`
10. Specs: `projects.service.spec.ts`, `project.repository.integration.spec.ts`, `projects.e2e-spec.ts` (co-locados)

### Editar

11. `backend/src/app.module.ts` — +`ProjectsModule` (1 linha)

## Ordem de execução

1. Model (1) → usuário roda `migrate dev` + `generate`
2. DTOs genéricos (9) → DTOs do módulo (2, 3, 4)
3. Repository (5) → service (6) → controller (7) → module + registro (8, 11)
4. Testes (10) na ordem: unit → integração → e2e
5. README magro (endpoints-fluxo + árvore) + Scalar conferido no `/openapi.json`

## Riscos

- Upsert de skills em `create`: N writes (tecnologias + pivôs + imagens) — usar transação do Prisma para não orfar nada.
- `size` sem teto estouraria banco — teto 20 já tranca.
- Upload não exige vínculo: `POST /uploads` grava sem saber de projeto (decisão aprovada — genérico de verdade). Arquivo upado e nunca linkado vira órfão; limpeza via cron futuro (já anotado). Sem enforcement no código por escolha, não por falta.
