# Plan 004 — Transação no Service (Rollback de Skills Órfãs) + Diff Inteligente no Update

## Contexto

Hoje `ProjectsService.create()` **e** `update()` chamam `resolveSkillIds()` (que pode **criar** `Technology` novas) **fora** da transação. O repository abre a transação internamente. Se a criação/atualização do projeto falhar após as skills serem criadas, ficam `Technology` órfãs no banco.

Além disso, `updateWithRelations()` faz **delete-all + recreate** das relações `project_technology` — ineficiente e perde histórico/ordem se um dia importar.

## Decisão

**Service controla a transação** (padrão NestJS/Prisma oficial):

- Service injeta `PrismaService` e usa `$transaction(callback)`.
- Repository expõe métodos que aceitam `tx?: Prisma.TransactionClient` (opcional). **Em produção o service SEMPRE passa `tx`** (do callback do `$transaction`). O fallback para `this.prisma` e abertura de transação própria serve **apenas para testes de integração** que chamam o repository diretamente.
- `resolveSkillIds()` passa a receber `tx: Prisma.TransactionClient` e usa-o para upsert de technologies.
- Transação única cobre: upsert de technologies + criação/atualização do projeto + **diff** das relações.
- **Regra crítica:** quando `tx` é fornecido ao repository, ele **não** abre `$transaction` própria (Prisma não permite nested interactive transactions).

**Diff das relações (repository)**:
- Recebe `technologyIds: string[]` (novo estado desejado).
- Busca `technologyIds` atuais do projeto.
- `toRemove = currentIds - newIds` → `deleteMany` só esses.
- `toAdd = newIds - currentIds` → `createMany` só esses.
- `toKeep = intersection` → nada a fazer.

## Arquivos a alterar

### Backend

1. `backend/src/modules/projects/services/projects.service.ts`
   - Injeta `PrismaService`.
   - `create()` usa `this.prisma.$transaction(async (tx) => { ... })`.
   - `update()` usa `this.prisma.$transaction(async (tx) => { ... })`.
   - `resolveSkillIds(skills, tx)` recebe `tx: Prisma.TransactionClient` e usa `tx.technology.upsert...`.

2. `backend/src/modules/projects/repositories/project.repository.ts`
   - `createWithRelations(data, technologyIds, tx?: Prisma.TransactionClient)` — `tx` opcional (em produção **sempre vem do service**).
   - `updateWithRelations(id, data, technologyIds?, tx?: Prisma.TransactionClient)` — **novo**: faz diff das relações (não delete-all).
   - Métodos internos (`_createProject`, `_updateProject`, `_linkTechnologies`, `_diffTechnologies`) usam `tx` recebido.
   - Lógica: se `tx` fornecido → executa direto; senão (testes de integração) → abre `$transaction` própria.

3. `backend/src/modules/projects/services/projects.service.spec.ts`
   - Ajustar mocks: `prisma.$transaction` executa callback passando `tx` mockado (`Prisma.TransactionClient`).
   - Verificar que `resolveSkillIds` é chamado dentro da transação (create + update).
   - Testar diff: remover, adicionar, manter.

### Em escopo (baixo acoplamento)

- Service depende de `PrismaService` (concreto) — padrão do ecossistema NestJS/Prisma. Repositories já dependem de `PrismaService` concreto hoje; a mudança só propaga `tx` tipado como `Prisma.TransactionClient`. Se no futuro houver necessidade de swap/teste in-memory, extrai-se interface nessa hora (refatoração barata guiada por necessidade real).

## Ordem de execução

1. **Repository**: adicionar `tx?: Prisma.TransactionClient` em `createWithRelations` e `updateWithRelations`; implementar `_diffTechnologies`; lógica de não-abrir-transação-quando-tx-fornecido.
2. **Service**: injetar `PrismaService`, refatorar `create()` + `update()` + `resolveSkillIds()` para usar `tx`.
3. **Testes unitários**: adaptar mocks; adicionar casos de diff (remove, add, keep).
4. `npm run build` + `npm test` verdes.
5. (Opcional) Integration/E2E — rodam com banco real, transação real, já validam rollback + diff.
