# TASKS 036 — Categorias de metodologias, mensageria e testes nas habilidades

## Status

`IN_PROGRESS — implementação concluída; testes npm pendentes`

## Source Documents

- SPEC: `specs/036-skill-methodologies/spec.md` — `APPROVED`
- PLAN: `specs/036-skill-methodologies/plan.md` — `IN_PROGRESS`

## Fase 1 — Persistência e backend

- [x] **T1.** Adicionar `METODOLOGIAS`, `MENSAGERIA` e `TESTES` ao enum Prisma `TechnologyCategory`.
- [x] **T2.** Criar migration aditiva para os novos valores do enum.
- [x] **T3.** Regenerar Prisma Client e validar schema.
- [x] **T4.** Atualizar schemas, DTOs e tipos backend que enumeram categorias; DTOs usam o enum Prisma gerado.
- [x] **T5.** Atualizar testes e fixtures backend para cobrir as categorias novas.

## Fase 2 — Contratos e formulários frontend

- [x] **T6.** Atualizar `SkillCategory` e tipos relacionados.
- [x] **T7.** Atualizar schemas Zod e formulários de criação/edição de habilidades.
- [x] **T8.** Atualizar schemas de currículo para aceitar os novos valores.
- [x] **T9.** Atualizar mappers e fixtures para preservar as categorias no fluxo de dados.
- [x] **T10.** Adicionar cobertura de teste para criação, agrupamento e alteração de categoria nas categorias novas.

## Fase 3 — Apresentação e ordenação

- [x] **T11.** Adicionar rótulo “Metodologias” aos agrupamentos de habilidades.
- [x] **T12.** Adicionar rótulo “Mensageria” aos agrupamentos de habilidades.
- [x] **T13.** Incluir as categorias nas ordens padrão sem substituir preferências existentes.
- [x] **T14.** Propagar categorias no perfil público, dashboard, editor de currículo, preview e PDF.
- [x] **T15.** Atualizar cobertura de testes para categorias no mapeamento, agrupamento e edição do currículo.

## Fase 4 — Ajuste de classificação existente

- [x] **T22.** Atualizar a SPEC para incluir `TESTES`, Flyway em `DADOS`, frameworks de teste em `TESTES` e deduplicação de Prisma.
- [x] **T23.** Adicionar `TESTES` ao enum Prisma, contratos, validações, formulários, rótulos, ordem padrão e fixtures.
- [x] **T24.** Atualizar testes existentes e adicionar cobertura da categoria `TESTES`.
- [x] **T25.** Confirmar antes da remoção que o projeto Notification API já mantém `Prisma`; remover o vínculo redundante `Prisma ORM` e o registro duplicado.
- [x] **T26.** Reclassificar diretamente no PostgreSQL local Flyway para `DADOS`; Jest, Vitest e PHPUnit para `TESTES`; preservar Docker Compose em `DEVOPS`.
- [x] **T27.** Confirmar as categorias e os dados atualizados por consulta de verificação, sem executar migration.

## Fase 5 — Validação final

- [ ] **T16.** Executar `npm test` no backend e corrigir ou registrar falhas relacionadas.
- [ ] **T17.** Executar `npm test` no frontend e corrigir ou registrar falhas relacionadas.
- [x] **T18.** Executar lint e typecheck do backend e frontend.
- [x] **T19.** Executar builds; backend aprovado. Build frontend bloqueado por indisponibilidade de `fonts.googleapis.com`.
- [x] **T20.** Executar `git diff --check`.
- [x] **T21.** Atualizar PLAN e TASKS com resultados verificados; SPEC aprovada permanece sem alterações.

## Critérios de conclusão

- [x] `METODOLOGIAS`, `MENSAGERIA` e `TESTES` estão no schema, migration, validações e superfícies de apresentação.
- [x] Ordem customizada existente e categorias antigas permanecem compatíveis no código.
- [x] Testes existentes afetados foram atualizados e há testes novos para os caminhos adicionados.
- [ ] Executar `npm test` no backend e frontend; não executado conforme orientação do usuário.
- [ ] Build frontend: repetir quando houver acesso às fontes do Google ou cache disponível.

## Validação registrada (15/10/2026)

- `npx prisma generate` e `npx prisma validate` (backend): aprovados.
- `npm run lint` (backend): aprovado.
- `npx tsc --noEmit -p tsconfig.build.json` (backend): aprovado.
- `npm run build` (backend): aprovado.
- `npm run lint` (frontend): sem erros; um warning preexistente em
  `src/components/home/header-publico.tsx` (`name` não utilizado).
- `npx tsc --noEmit` (frontend): aprovado.
- `npm run build` (frontend): falhou ao buscar DM Mono e Manrope em
  `fonts.googleapis.com`; falha de acesso externo do ambiente.
- `npm test` (backend e frontend): não executado a pedido do usuário. Os testes
  adicionados/modificados precisam ser executados pelo usuário.
- Migration criada e mantida idempotente, mas não aplicada a banco de dados.
- Categorias e registros de skills acordados atualizados diretamente no banco local; a associação do projeto foi preservada ao remover a duplicata Prisma ORM.
- `git diff --check`: aprovado.

## Final Review

- Traceability to approved SPEC and PLAN: `PASSED`.
- Escopo: `PASSED`; reclassificações limitadas aos itens explicitamente definidos na SPEC.
- Implementação: `PASSED`; categorias propagadas por contratos backend/frontend,
  formulários, perfil público e currículo.
- Classificação dos dados locais: `PASSED`; Flyway em Dados, ferramentas de teste
  em Testes, Docker Compose em DevOps e Prisma ORM deduplicado sem perda de vínculo.
- Validação geral: `IN_PROGRESS`; aguardando `npm test` nos dois projetos e
  build frontend em ambiente com acesso às fontes Google.
