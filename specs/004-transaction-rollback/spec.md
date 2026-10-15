# Spec 004 — Transação no Service + Diff Inteligente no Update

## Contexto

Hoje `ProjectsService.create()` e `update()` chamam `resolveSkillIds()` (que pode **criar** `Technology` novas via upsert) **fora** da transação. O repository abre a transação internamente em `createWithRelations()` e `updateWithRelations()`. Se a criação/atualização do projeto falhar após as skills serem criadas, ficam `Technology` órfãs no banco.

Além disso, `updateWithRelations()` faz **delete-all + recreate** das relações `project_technology` — ineficiente, gera writes desnecessários e perde histórico/ordem se um dia importar.

## Requisitos

- **R1.** Service controla a transação: `ProjectsService` injeta `PrismaService` e usa `$transaction(callback)` em `create()` e `update()`. O callback recebe `tx: Prisma.TransactionClient`.

- **R2.** `resolveSkillIds(skills, tx)` recebe o client transacional `tx: Prisma.TransactionClient` e faz upsert de `Technology` **dentro** da transação.

- **R3.** Repository expõe `createWithRelations(data, technologyIds, tx?)` e `updateWithRelations(id, data, technologyIds?, tx?)` com `tx?: Prisma.TransactionClient` opcional. **Em produção, o service SEMPRE passa `tx`** (vindo do `$transaction` callback). O fallback para `this.prisma` e abertura de transação própria existe **apenas para compatibilidade com testes de integração** que chamam o repository diretamente sem transação externa. Quando `tx` é fornecido, NÃO abre transação própria (evita nested transaction error do Prisma).

- **R4.** `updateWithRelations` implementa **diff** das relações:
  - Busca `technologyIds` atuais do projeto.
  - `toRemove = currentIds - newIds` → `deleteMany` só esses.
  - `toAdd = newIds - currentIds` → `createMany` só esses.
  - `toKeep = intersection` → nada a fazer.
  - Sem delete-all + recreate.

- **R5.** Testes unitários do service: mock de `PrismaService` com `$transaction` executando callback e passando `tx` mockado (`Prisma.TransactionClient`); verificar que `resolveSkillIds` é chamado dentro da transação (create + update) e que diff funciona (remove, add, keep).

- **R6.** Testes de integração (Testcontainers) e E2E (supertest) continuam passando — validam rollback real e diff real.

- **R7.** Zero breaking changes na API pública: `CreateProjectDto`, `UpdateProjectDto`, `ProjectResponseDto`, rotas `POST/PATCH /projects` inalteradas.

## Fora de escopo

- Mudança no `TechnologyRepository` / `TechnologiesService` — não precisam de transação controlada pelo service.