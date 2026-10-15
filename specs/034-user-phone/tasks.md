# TASKS 034 — Telefone no perfil do usuário

## Status

`IN_PROGRESS — full-project typecheck reports pre-existing AI test errors`

## Source Documents

- SPEC: `specs/034-user-phone/spec.md` — `APPROVED`
- PLAN: `specs/034-user-phone/plan.md` — `READY`

## Fase 1 — Persistência e backend

- [x] **T1.** Adicionar `phone String?` ao modelo Prisma `User`.
- [x] **T2.** Criar migration aditiva para a coluna nullable `phone`.
- [x] **T3.** Regenerar Prisma Client e validar o schema.
- [x] **T4.** Adicionar validação opcional de telefone ao `UpdateUserDto`.
- [x] **T5.** Definir limite máximo de 30 caracteres no backend.
- [x] **T6.** Normalizar string vazia ou composta por espaços para `null`.
- [x] **T7.** Incluir `phone` nos contratos autenticados do próprio usuário usados pelo dashboard e currículo ATS.
- [x] **T8.** Garantir que `GET /users/profile` não retorne `phone`.
- [x] **T9.** Testar atualização, leitura e remoção do telefone no service/repository.
- [x] **T10.** Testar validação de ausência, valor válido, vazio e limite excedido.
- [x] **T11.** Testar persistência via E2E autenticado e confirmar ausência de `phone` na resposta pública.

## Fase 2 — Formulário de perfil

- [x] **T12.** Separar os tipos de perfil público e autenticado; adicionar `phone: string | null` somente ao tipo autenticado.
- [x] **T13.** Adicionar telefone opcional ao schema Zod do perfil.
- [x] **T14.** Exibir campo Telefone no `ProfileForm` e inicializá-lo pelo perfil.
- [x] **T15.** Enviar telefone ao endpoint atual `PATCH /users/me`.
- [x] **T16.** Permitir limpar o campo e salvar a remoção.
- [x] **T17.** Testar valor inicial, edição, limpeza, validação e payload do formulário.

## Fase 3 — Currículo ATS

- [x] **T18.** Mapear telefone do perfil autenticado para `ResumeData.personal.phone`.
- [x] **T19.** Mapear telefone ausente ou nulo para string vazia.
- [x] **T20.** Testar o mapeamento com e sem telefone cadastrado.
- [x] **T21.** Confirmar que editar telefone no ATS não chama endpoint de perfil.

## Fase 4 — Validação final

- [x] **T22.** Aplicar a migration no banco de desenvolvimento e validar Prisma.
- [x] **T23.** Rodar testes unitários, integração e E2E relevantes do backend.
- [x] **T24.** Rodar testes relevantes do frontend.
- [ ] **T25.** Rodar lint e typecheck do backend e frontend.
- [x] **T26.** Rodar build do backend e frontend.
- [x] **T27.** Rodar `git diff --check`.
- [x] **T28.** Atualizar SPEC, PLAN e TASKS com os resultados da implementação.

## Critérios de conclusão

- [x] Telefone pode ser cadastrado, alterado e removido no perfil.
- [x] `/auth/me` retorna telefone; `/users/profile` não o expõe; o currículo
  ATS autenticado do próprio usuário recebe o telefone.
- [x] Editar o ATS permanece local e não altera o cadastro.
- [x] Migration e validações da feature passam.
- [x] Testes, lint, typecheck e builds passam.

## Final Review

- Traceability to SPEC and PLAN: `PASSED`
- Task ownership and backend/frontend/test separation: `PASSED`
- Scope: `PASSED` — nenhum requisito adicional; `/users/profile` permanece sem telefone.
- Task progress reflects only implementation and validation completed; blocked
  environment-dependent tasks remain unchecked: `PASSED`
- Remaining Issues:
  - T25: `npx tsc --noEmit` falha em dois arquivos de testes de IA já modificados fora desta feature; typecheck de produção (`tsconfig.build.json`) e typecheck frontend passaram.
  - A suíte E2E completa tem uma falha em teste de IA fora do escopo desta SPEC; o E2E do módulo users passou integralmente.
- Review Result: `IN_PROGRESS — comportamento da SPEC 034 validado; falhas não relacionadas permanecem`

## Resultados de validação (14/10/2026)

- Testes unitários backend: 206/206 passaram.
- Testes focados de telefone backend: 12/12 passaram.
- Testes frontend completos: 232/232 passaram; testes focados: 21/21.
- Integração backend: 18/18 passaram. E2E users: 6/6 passaram. Suíte E2E completa: 46/47 passaram; houve uma falha isolada em teste de IA, fora do escopo desta SPEC.
- Prisma Client gerado, schema validado e migration `20261014120000_add_user_phone` aplicada com sucesso no PostgreSQL local `portfolio` do Compose.
- Lint e build backend passaram. `npx tsc --noEmit -p tsconfig.build.json` passou; `npx tsc --noEmit` ainda encontra dois erros em arquivos de teste de IA já modificados fora desta feature.
- Typecheck, lint e testes frontend passaram. Build padrão Turbopack foi bloqueado pelo sandbox ao criar processo/abrir porta; `npx next build --webpack` concluiu com sucesso.
