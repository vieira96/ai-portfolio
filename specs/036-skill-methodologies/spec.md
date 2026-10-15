# SPEC 036 — Categorias de metodologias, mensageria e testes nas habilidades

## Objetivo

Adicionar categorias próprias para metodologias de trabalho, tecnologias de mensageria e ferramentas de teste nas habilidades do usuário, além de corrigir classificações existentes e remover uma habilidade duplicada.

## Decisão de classificação

Adicionar as categorias `METODOLOGIAS`, `MENSAGERIA` e `TESTES`.

- Scrum, XP (Extreme Programming) e Kanban pertencem a `METODOLOGIAS`.
- Docker permanece em `DEVOPS`, por ser uma tecnologia de conteinerização usada em desenvolvimento e operações.
- RabbitMQ e Kafka pertencem a `MENSAGERIA`.
- Jest, Vitest e PHPUnit pertencem a `TESTES`.
- Flyway pertence a `DADOS`, por gerenciar migrações e versionamento de schema.
- Docker e Docker Compose pertencem a `DEVOPS`.
- Prisma e Prisma ORM representam a mesma ferramenta: manter `Prisma` e remover a entrada duplicada `Prisma ORM`, preservando associações existentes ao projeto.
- As categorias existentes e suas demais classificações permanecem inalteradas.

## Escopo funcional

1. Usuários podem criar, editar e remover habilidades com categoria `METODOLOGIAS`, `MENSAGERIA` ou `TESTES`.
2. As categorias são persistidas pelo backend e aparecem de forma consistente nas superfícies que exibem habilidades: perfil público, dashboard, editor e preview de currículo e exportação PDF.
3. A ordem padrão das categorias inclui as três categorias novas, mantendo a ordenação já escolhida pelo usuário quando aplicável.
4. Reclassificar as habilidades existentes indicadas nesta SPEC e consolidar a entrada duplicada de Prisma sem remover sua associação válida ao projeto.

## Requisitos técnicos

- Incluir `METODOLOGIAS`, `MENSAGERIA` e `TESTES` no enum Prisma `TechnologyCategory` e manter migration correspondente idempotente para ambientes nos quais os valores já tenham sido adicionados diretamente.
- Atualizar validações, DTOs, tipos e schemas Zod do backend e frontend que enumeram categorias.
- Atualizar rótulos e ordem padrão nos componentes e serviços que agrupam ou apresentam habilidades.
- Garantir que contratos de perfil e currículo aceitem e preservem as novas categorias.
- Não adicionar dependências.

## Critérios de aceite

- Habilidades com categoria `METODOLOGIAS`, `MENSAGERIA` ou `TESTES` podem ser criadas, persistidas, consultadas, editadas e removidas sem erro.
- Scrum, XP e Kanban podem ser apresentados no grupo “Metodologias”; RabbitMQ e Kafka, em “Mensageria”.
- Jest, Vitest e PHPUnit aparecem em “Testes”; Flyway em “Dados”; Docker e Docker Compose em “DevOps”.
- A habilidade `Prisma ORM` duplicada é removida e a associação do projeto permanece por meio da habilidade `Prisma`.
- As novas categorias são exibidas corretamente no perfil, currículo, preview e PDF, sem perder habilidades durante o mapeamento.
- Categorias antigas e registros existentes mantêm seu comportamento.
- Testes existentes afetados são atualizados e novos testes cobrem os caminhos da nova categoria.
- Antes de concluir a implementação, executar `npm test` no backend e no frontend.

## Fora de escopo

- Reclassificar habilidades além das explicitamente descritas nesta SPEC.
- Criar categorias adicionais para cada tecnologia ou alterar a ordenação individual das habilidades; isso permanece responsabilidade do currículo, conforme o comportamento atual.
