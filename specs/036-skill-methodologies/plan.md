# PLAN 036 — Categorias de metodologias, mensageria e testes nas habilidades

## Status

`IN_PROGRESS — implementação concluída; suites npm test pendentes conforme orientação do usuário`

## Source Spec

`specs/036-skill-methodologies/spec.md` — `APPROVED`

## 1. Estratégia

Estender a enumeração de categorias existente de forma aditiva. Persistir as
categorias no enum Prisma, propagar os valores pelos contratos e validações
backend/frontend e atualizar agrupamentos e ordens padrão usados pelas
superfícies de perfil e currículo. Reclassificar somente as tecnologias
explicitamente descritas na SPEC e consolidar a duplicata de Prisma preservando
o vínculo válido do projeto.

## 2. Fases

### Fase 1 — Persistência e contratos backend

1. Adicionar `METODOLOGIAS`, `MENSAGERIA` e `TESTES` ao enum Prisma `TechnologyCategory`.
2. Manter migration aditiva idempotente e regenerar Prisma Client.
3. Localizar e atualizar DTOs, schemas e tipos backend que declaram categorias.
4. Atualizar fixtures e testes backend para aceitar os novos valores.

### Fase 2 — Contratos e formulários frontend

1. Atualizar o tipo compartilhado `SkillCategory`.
2. Atualizar schemas Zod, formulários e opções de seleção de categoria.
3. Atualizar mappers e fixtures de currículo para preservar as novas categorias.
4. Garantir que dados de perfil e currículo aceitem os valores.

### Fase 3 — Apresentação e ordenação

1. Adicionar rótulos “Metodologias”, “Mensageria” e “Testes” aos agrupamentos de skills.
2. Incluir as categorias na ordem padrão, sem sobrescrever a ordem customizada existente.
3. Verificar perfil público, dashboard, editor de currículo, preview e PDF.
4. Confirmar que o mapeamento do currículo preserva habilidades nessas categorias.

### Fase 4 — Classificação dos dados existentes

1. Classificar Flyway em `DADOS` e Jest, Vitest e PHPUnit em `TESTES`.
2. Manter Docker e Docker Compose em `DEVOPS` e RabbitMQ em `MENSAGERIA`.
3. Remover `Prisma ORM` duplicado após confirmar que o vínculo do projeto já existe por `Prisma`.
4. Aplicar as alterações de dados diretamente no banco local, sem executar migration; manter migration versionada para demais ambientes.

### Fase 5 — Validação

1. Validar migration e Prisma Client.
2. Atualizar testes existentes afetados e adicionar cobertura para as três categorias.
3. Executar `npm test` no backend e no frontend.
4. Executar lint, typecheck e builds conforme scripts dos respectivos `package.json`.
5. Executar `git diff --check` e atualizar TASKS com o resultado real.

## 3. Decisões técnicas

- Categorias novas: `METODOLOGIAS`, `MENSAGERIA` e `TESTES`.
- Reclassificar apenas os itens explicitamente aprovados na SPEC; não inferir mudanças para outras habilidades.
- Categorias antigas continuam válidas e mantêm seus rótulos e comportamento.
- A ordem padrão ganha as novas categorias; preferências de ordenação existentes
  do currículo continuam tendo precedência.
- Não adicionar dependências nem criar uma nova entidade de domínio.

## 4. Áreas de código esperadas

```text
backend/prisma/schema/technology/technology.prisma
backend/prisma/migrations/*_add_skill_categories/
backend/src/modules/ai/schemas/*
backend/src/modules/ai/context/*
frontend/src/types/skills/skills.types.ts
frontend/src/components/skills/*
frontend/src/components/resumes/*
frontend/src/app/page.tsx
```

Os caminhos concretos devem ser confirmados durante a implementação. Toda
enumeração duplicada de categorias deve ser revisada para manter os contratos
backend/frontend consistentes.

## 5. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Uma validação ainda rejeitar categorias novas | Buscar todas as enumerações e cobrir contratos backend/frontend com testes |
| Categoria persistida não aparecer em alguma superfície | Verificar perfil, dashboard, currículo, preview e PDF |
| Ordem customizada ser substituída | Aplicar novas categorias somente à ordem padrão e testar preferências existentes |
| Migration coincidir com categorias já adicionadas diretamente ao banco local | Usar `ADD VALUE IF NOT EXISTS` e não executar a migration no banco local |
| Remoção da duplicata remover skill de projeto | Confirmar que o projeto já possui associação a `Prisma` antes de remover `Prisma ORM` |

## 6. Definition of Done

- As três categorias podem ser persistidas e trafegam pelos contratos sem perda.
- Rótulos e agrupamentos aparecem corretamente nas superfícies especificadas.
- Categorias e registros anteriores continuam funcionando.
- Testes afetados são atualizados e novos testes cobrem as novas categorias.
- `npm test` backend e frontend, lint, typecheck e builds foram executados; os
  resultados reais estão registrados em TASKS.

## Validação da implementação (15/10/2026)

- Prisma Client regenerado e `prisma validate` aprovado.
- Lint, typecheck de produção e build do backend aprovados.
- Lint e typecheck do frontend aprovados. O lint reportou um warning preexistente
  em `src/components/home/header-publico.tsx` (`name` não utilizado).
- Build frontend não concluiu porque o ambiente não conseguiu acessar
  `fonts.googleapis.com` para baixar DM Mono e Manrope.
- `npm test` backend e frontend não foram executados, conforme orientação do
  usuário; solicitar execução manual.
- Migration criada, mas não aplicada a um banco.
- As categorias e classificações de dados acordadas foram aplicadas diretamente ao banco local, sem executar migration.
- `git diff --check` aprovado.
