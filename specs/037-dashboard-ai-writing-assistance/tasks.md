# TASKS 037 — Assistência de escrita com IA no dashboard

## Status

`COMPLETED`

## Source Documents

- SPEC: `specs/037-dashboard-ai-writing-assistance/spec.md` — `APPROVED`
- PLAN: `specs/037-dashboard-ai-writing-assistance/plan.md` — `COMPLETED`

## Fase 1 — Contrato e backend

- [x] **T1.** Definir DTO e união fechada dos quatro tipos de campo, com
      validação e documentação OpenAPI.
- [x] **T2.** Criar prompt de reescrita específico por tipo, preservando fatos,
      idioma, tecnologias e nível de experiência, sem conteúdo auxiliar na saída.
- [x] **T3.** Implementar no `AiService` a geração da sugestão usando o provider
      existente e validar retorno não vazio.
- [x] **T4.** Adicionar `POST /ai/writing-assistance` com `JwtAuthGuard` e resposta
      `{ suggestion: string }`.
- [x] **T5.** Adicionar testes unitários do prompt, service e erros de provider;
      validação de payload fica coberta no E2E.
- [x] **T6.** Adicionar testes E2E para autenticação, resposta válida, payload
      inválido e falha do provider; manter o endpoint sem dependência de
      persistência.

## Fase 2 — Proxy frontend

- [x] **T7.** Criar `POST /api/ai/writing-assistance` com verificação e
      encaminhamento do cookie de autenticação.
- [x] **T8.** Garantir que o proxy encaminhe somente o tipo e texto enviados e
      preserve status e contrato da API backend.
- [x] **T9.** Criar testes para ausência de cookie, sucesso, validação e erro do backend.

## Fase 3 — Modal reutilizável

- [x] **T10.** Criar tipos e cliente frontend para solicitar assistência.
- [x] **T11.** Criar componente reutilizável com estado de carregamento, sugestão,
      erro e ação de nova tentativa.
- [x] **T12.** Implementar as ações “Usar sugestão” e “Manter texto atual”, sem
      persistência automática.
- [x] **T13.** Proteger contra aplicação de resposta obsoleta se o campo tiver
      sido editado durante a requisição.
- [x] **T14.** Adicionar testes do componente para estados, botões, fechamento,
      nova tentativa e edição concorrente.

## Fase 4 — Formulários do dashboard

- [x] **T15.** Integrar a ação abaixo de Bio e headline no `ProfileForm`.
- [x] **T16.** Integrar a ação abaixo da descrição no `ExperienceForm`.
- [x] **T17.** Integrar a ação abaixo da descrição no `ProjectForm`.
- [x] **T18.** Mapear corretamente cada campo e aplicar a sugestão somente ao
      estado local do campo escolhido.
- [x] **T19.** Desabilitar a ação para valores vazios ou somente com espaços.
- [x] **T20.** Atualizar testes dos formulários e cobrir os quatro campos e a
      preservação do texto original.

## Fase 5 — Validação

- [x] **T21.** Executar `npm test` em `backend/` e corrigir falhas relacionadas — aprovado, conforme informado pelo usuário.
- [x] **T22.** Executar `npm test` em `frontend/` e corrigir falhas relacionadas — aprovado após o ajuste do teste.
- [x] **T23.** Executar lint e typecheck de backend e frontend; corrigir falhas
      introduzidas pela implementação.
- [x] **T24.** Executar builds de backend e frontend quando aplicável; backend
      aprovado; build frontend não concluiu (Turbopack bloqueado pelo ambiente e
      fallback webpack sem conseguir interpretar `TypeScript --showConfig`).
- [x] **T25.** Executar `git diff --check` e revisar alterações para confirmar
      escopo, privacidade e consistência do contrato.
- [x] **T26.** Atualizar PLAN e TASKS com os resultados reais de validação.

## Critérios de conclusão

- [x] Bio, headline, descrição de experiência e descrição de projeto oferecem
      assistência no dashboard.
- [x] Sugestões só alteram o campo após confirmação e nunca salvam
      automaticamente.
- [x] Conteúdo vazio, falhas da API e edição durante carregamento são tratados
      sem perda de dados.
- [x] Testes existentes afetados foram atualizados e há cobertura dos fluxos
      novos.
- [x] `npm test` em backend e frontend aprovado, conforme informado pelo
      usuário; os comandos não foram repetidos pelo assistente.
- [x] Lint e typecheck foram executados; build backend passou. Build frontend
      executado, mas bloqueado por restrição ambiental do Turbopack.

## Validação registrada (15/10/2026)

- `npm test` (backend e frontend): aprovado conforme informado pelo usuário;
  os comandos não foram repetidos pelo assistente.
- Builds, lint, typecheck e `git diff --check`: registrados na seção de validação
  do PLAN.
