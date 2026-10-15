# SPEC 034 — Telefone no perfil do usuário

## Status

`APPROVED`

## 1. Objetivo

Adicionar telefone como dado opcional do perfil do usuário, permitindo que o
usuário o cadastre e atualize no dashboard. O currículo ATS deve carregar esse
valor do perfil e preencher o campo de telefone do editor, mantendo a edição do
currículo local e independente do cadastro.

## 2. Escopo

### Incluído

- campo `phone` opcional no modelo `User` do Prisma e migration aditiva;
- validação e atualização do campo no endpoint autenticado `PATCH /users/me`;
- retorno do campo em `GET /auth/me` e na resposta autenticada de atualização;
- campo de telefone no formulário de perfil do dashboard;
- inclusão de `phone` somente no tipo de perfil autenticado do frontend;
- manutenção de tipos distintos para perfil público e perfil autenticado, para
  que a rota pública não passe a expor o telefone;
- mapeamento do telefone do perfil para `ResumeData.personal.phone`;
- testes de validação, persistência, formulário e mapeamento.

### Fora de escopo

- verificação de titularidade do número por SMS ou chamada;
- máscara ou formatação automática dependente de país;
- telefone como identificador de login;
- alteração de outros campos de perfil;
- salvar alterações feitas no telefone dentro do editor ATS no cadastro do
  usuário;

## 3. Requisitos funcionais

### FR-01 — Campo opcional

O telefone pode ficar vazio. Usuários existentes devem continuar válidos após a
migration, com `phone` nulo no banco.

### FR-02 — Edição autenticada

O formulário do perfil deve permitir informar, editar e remover o telefone. A
atualização usa o endpoint autenticado já existente `PATCH /users/me`; não deve
ser criado endpoint novo.

### FR-03 — Validação

- O backend valida `phone` como string opcional, com espaços externos
  removidos e limite máximo de 30 caracteres.
- String vazia ou composta somente por espaços representa ausência de telefone
  e deve ser persistida como `null`.
- O frontend valida o campo com Zod, seguindo as mensagens e o tratamento de
  erros existentes no formulário de perfil.
- Não exigir formato E.164 nem restringir o campo a números: permitir `+`,
  espaços, parênteses, hífens e ramais escritos pelo usuário.

### FR-04 — Contrato do perfil autenticado

`GET /auth/me` e a resposta de `PATCH /users/me` devem incluir `phone` como
`string | null`. A rota pública `GET /users/profile` não deve incluí-lo. O
currículo ATS autenticado deve carregar o telefone do perfil do próprio usuário,
sem persistir alterações locais feitas no editor.

No frontend, os contratos/tipos de perfil público e autenticado devem ser
distintos. `phone` pertence somente ao tipo autenticado; não deve ser adicionado
ao tipo usado por `GET /users/profile`.

### FR-05 — Integração com o currículo ATS

Ao carregar o currículo pelas APIs existentes, o mapper deve usar o telefone
do perfil autenticado em `ResumeData.personal.phone`. Se não houver telefone,
deve usar string vazia. Editar esse campo dentro do editor ATS altera somente o
snapshot local do currículo e não chama `PATCH /users/me`.

### FR-06 — Persistência e compatibilidade

A migration deve ser aditiva, sem valor fictício para registros existentes.
DTOs e respostas existentes devem permanecer compatíveis quando o campo não
for enviado.

## 4. Requisitos não funcionais e privacidade

- O telefone não pode aparecer em logs, mensagens de erro ou dados de seed.
- O telefone é dado privado: só pode ser retornado nos contratos autenticados
  do próprio usuário e consumido pelo currículo ATS autenticado. A resposta
  pública `GET /users/profile` não deve incluí-lo.
- Preservar a autenticação, autorização e fluxo de atualização de perfil
  existentes.
- O telefone só é incluído no currículo quando estiver cadastrado pelo usuário
  ou quando for editado explicitamente no snapshot local.

## 5. Testes

- migration/client Prisma com telefone nulo para usuários existentes;
- DTO: campo ausente, valor válido, string vazia e limite máximo;
- service/repository: atualizar, remover e ler telefone;
- E2E autenticado: atualizar telefone e confirmar persistência em `/auth/me`;
- E2E público: confirmar que `/users/profile` não inclui `phone`;
- formulário: preencher, editar, limpar, validar e enviar telefone;
- mapper: mapear telefone existente e usar string vazia quando nulo;
- regressão: editar telefone no currículo não chama endpoint de mutação.

## 6. Critérios de aceite

- **AC-01:** telefone pode ser cadastrado, alterado e removido no perfil.
- **AC-02:** salvar perfil persiste o telefone e `/auth/me` o retorna.
- **AC-03:** usuários existentes continuam funcionando com telefone nulo.
- **AC-04:** `/users/profile` não retorna `phone`; o telefone fica restrito ao
  dashboard e ao currículo ATS autenticados do próprio usuário.
- **AC-05:** o currículo ATS é preenchido com o telefone cadastrado.
- **AC-06:** editar o telefone no currículo não altera o perfil nem o banco.
- **AC-07:** entrada inválida ou acima do limite é rejeitada conforme o padrão
  de validação do projeto.
- **AC-08:** migration, testes, lint, typecheck e build aplicáveis passam.

## 7. Definition of Done

- migration Prisma aditiva criada e aplicada no ambiente de desenvolvimento;
- contratos backend e frontend atualizados;
- formulário de perfil e mapper do currículo integrados;
- testes unitários, integração e E2E relevantes aprovados;
- lint, typecheck e build aprovados;
- SPEC, PLAN e TASKS consistentes com o resultado.

## 8. Questions for User

Nenhuma pendente. A autorização explícita para executar esta SPEC foi dada em
14/10/2026.

## 9. Requirement Traceability

| Requisito | Critério de aceite |
|---|---|
| FR-01, FR-06 | AC-01, AC-03 |
| FR-02, FR-03 | AC-01, AC-07 |
| FR-04 | AC-02, AC-04 |
| FR-05 | AC-05, AC-06 |
| Privacidade e compatibilidade | AC-03, AC-04, AC-06 |

## 10. Implementation Tracking

Implementação funcional validada em 14/10/2026: migration aplicada no banco
local de desenvolvimento, integração backend (18/18), E2E de usuários (6/6),
testes frontend e builds de produção passaram. A suíte E2E completa tem uma
falha isolada em um teste de IA fora do escopo desta SPEC. O typecheck
abrangente também aponta dois erros em arquivos de teste de IA preexistentes;
typecheck de produção backend e typecheck frontend passaram. O status detalhado
está em `tasks.md`.

## Final Review

- Consistency: `PASSED`
- Scope: `PASSED` — telefone opcional, disponível somente nos fluxos
  autenticados do próprio usuário (dashboard e currículo ATS); nunca em
  `GET /users/profile`.
- API, validation, authorization, privacy, acceptance criteria and traceability:
  `PASSED`
- Remaining Issues: nenhum.
- Review Result: `PASSED`
