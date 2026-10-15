# PLAN 034 — Telefone no perfil do usuário

## Status

`READY`

## Source Spec

`specs/034-user-phone/spec.md` — `APPROVED`

## 1. Estratégia

Estender o perfil existente. Persistir o campo no modelo `User`, reutilizar
`PATCH /users/me` e incluir o valor apenas nos contratos autenticados do próprio
usuário. No frontend, adicionar o campo ao `ProfileForm` e mapear o perfil para
o editor ATS. O editor continua trabalhando sobre um snapshot local; a rota
pública `GET /users/profile` não retorna telefone.

## 2. Fases

### Fase 1 — Persistência e contrato backend

1. Adicionar `phone String?` ao fragmento Prisma de `User`.
2. Criar migration aditiva e regenerar o Prisma Client.
3. Adicionar validação opcional a `UpdateUserDto`.
4. Normalizar string vazia ou whitespace para `null` antes da persistência.
5. Incluir telefone na resposta de `/auth/me` e do `PATCH /users/me`.
6. Garantir que `phone` não seja incluído no DTO/contrato público de
   `GET /users/profile`.
7. Cobrir DTO, service/repository e contratos com testes.

### Fase 2 — Formulário de perfil

1. Separar os tipos de perfil público e autenticado, adicionando `phone` apenas
   ao tipo autenticado.
2. Adicionar o campo ao schema Zod do perfil.
3. Inicializar o estado do campo usando o perfil recebido.
4. Incluir o telefone no payload de atualização existente.
5. Cobrir preenchimento, alteração, remoção e validação no componente.

### Fase 3 — Integração com currículo ATS

1. Mapear `profile.phone` para `ResumeData.personal.phone`.
2. Manter string vazia quando o perfil não tiver telefone.
3. Confirmar que alterações locais no editor não fazem requests de mutação.
4. Cobrir o mapper e o isolamento local com testes.

### Fase 4 — Validação

1. Aplicar migration no banco de desenvolvimento e validar client gerado.
2. Rodar testes backend unitários, integração e E2E relevantes.
3. Rodar testes frontend relevantes, lint e typecheck.
4. Rodar builds backend e frontend.
5. Rodar `git diff --check` e atualizar TASKS.

## 3. Decisões técnicas

- Campo opcional e nullable para compatibilidade com registros existentes.
- Limite de 30 caracteres; não impor padrão internacional de telefone.
- String vazia enviada pelo formulário é convertida para `null` no backend.
- O telefone é privado: limitar sua resposta ao dashboard e ao currículo
  autenticados do próprio usuário; mantê-lo fora da projeção pública.
- O perfil autenticado permanece a fonte de dados para preencher o currículo.
- Alterar o currículo não persiste o telefone no perfil.
- Não criar endpoint, tabela ou módulo novo.

## 4. Arquivos e responsabilidades esperados

```text
backend/prisma/schema/user/user.prisma
backend/prisma/migrations/*_add_user_phone/
backend/src/modules/users/dto/update-user.dto.ts
backend/src/modules/users/dto/user-response.dto.ts
backend/src/modules/users/services/users.service.ts
backend/src/modules/users/controllers/users.controller.ts
frontend/src/types/users/users.types.ts
frontend/src/components/users/forms/profile.schema.ts
frontend/src/components/users/forms/profile-form.tsx
frontend/src/components/resumes/data/resume-mapper.ts
```

Os caminhos podem ser ajustados conforme a implementação existente, mantendo
separados schema, validação, persistência, apresentação e mapeamento.
O tipo atualmente compartilhado entre `getSession()` (`/auth/me`) e
`getPublicProfile()` (`/users/profile`) deve ser separado antes de incluir
`phone`, para não propagar o campo ao contrato público.

## 5. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Telefone privado vazar na rota pública | Manter projeções pública e autenticada separadas e testar ausência de `phone` em `/users/profile` |
| Registros atuais falharem após schema change | Coluna nullable sem default obrigatório |
| Usuário não conseguir apagar telefone | Converter valor vazio para `null` e testar remoção |
| Validação rejeitar números com formato comum | Limitar tamanho sem impor máscara ou E.164 |
| Currículo alterar o cadastro original | Manter editor local e testar ausência de request de mutação |

## 6. Definition of Done

- Perfil autenticado permite salvar e remover telefone.
- Rota pública não retorna `phone`; dashboard e currículo autenticados do próprio
  usuário podem consumi-lo.
- Currículo ATS carrega o telefone quando cadastrado.
- Alterações locais no currículo não são persistidas no perfil.
- Migration, testes, lint, typecheck e builds passam.

## 7. Execução e validação (14/10/2026)

- Implementados schema/migration, contratos autenticados, DTO, formulário,
  tipos públicos/autenticados separados e mapper ATS.
- `npx prisma generate`, `npx prisma validate`, lint e build backend passaram.
- `npm test` do backend: unitários 206/206 e integração 18/18 passaram; E2E
  completo teve 46/47 aprovados. A única falha ocorreu em um teste de IA
  (`ai.e2e-spec.ts`), fora do escopo desta SPEC. O E2E específico de usuários passou (6/6), incluindo atualização,
  leitura e privacidade do telefone.
- A migration `20261014120000_add_user_phone` foi aplicada pelo Prisma ao banco
  local `portfolio` do Compose; schema e client Prisma foram validados.
- `npx tsc --noEmit` no backend aponta erros em arquivos de teste de IA
  preexistentes a esta feature; o typecheck de produção passou.
  O typecheck de produção `npx tsc --noEmit -p tsconfig.build.json` passou.
- `npm test`, `npx tsc --noEmit` e lint do frontend passaram. O build padrão
  Turbopack foi bloqueado pelo sandbox ao criar processo/abrir porta; o build
  alternativo `npx next build --webpack` passou.
- Testes focados de telefone: backend 12/12 e frontend 21/21 passaram.
- Permanece pendente T25 somente para typecheck abrangente dos arquivos de
  teste; tarefas e validações restantes estão discriminadas em `tasks.md`.

## Final Review

- Consistency with approved SPEC: `PASSED`
- Scope and behavior changes: `PASSED` — não introduz endpoint nem exposição
  pública; mantém o telefone restrito ao dashboard e currículo ATS autenticados.
- Backend, frontend, persistence, API, security, testing and implementation order:
  `PASSED`
- Remaining Issues: uma falha E2E e dois erros no typecheck abrangente, todos em
  arquivos de IA/testes preexistentes e fora do escopo desta feature.
- Review Result: `IN_PROGRESS — feature validated; unrelated repository checks remain`
