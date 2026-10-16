# PLAN 037 — Assistência de escrita com IA no dashboard

## Status

`COMPLETED`

## Source Spec

`specs/037-dashboard-ai-writing-assistance/spec.md` — `APPROVED`

## 1. Estratégia

Adicionar uma operação autenticada ao módulo de IA que recebe o texto atual e
um tipo fechado de campo, monta uma instrução específica para reescrita e usa o
`LlmProvider` já configurado. No frontend, criar um proxy same-origin em
`/api/ai/writing-assistance`, seguindo o encaminhamento de cookie usado pelas
rotas autenticadas existentes. Um componente reutilizável controla o modal e
devolve a sugestão ao formulário somente após confirmação.

Não persistir texto ou sugestão. A gravação continua nos fluxos existentes de
perfil, experiência e projeto. O prompt deve pedir uma reescrita fiel, sem
acrescentar afirmações, e a resposta deve ser validada como texto não vazio.

## 2. Fases

### Fase 1 — Contrato e geração no backend

1. Definir enumeração fechada dos campos `bio`, `headline`,
   `experienceDescription` e `projectDescription`.
2. Criar DTO com tipo do campo e texto original, seguindo validação e Swagger
   existentes.
3. Criar prompt dedicado que instrui a preservar idioma, fatos, tecnologias,
   atribuições e nível de experiência, retornando somente o texto reescrito.
4. Adicionar método de assistência ao `AiService`, reutilizando `LlmProvider`;
   não criar provider ou persistência novos.
5. Adicionar `POST /ai/writing-assistance` protegido por `JwtAuthGuard`, com
   resposta tipada contendo uma única sugestão textual.
6. Tratar falhas de provider pelo filtro e formato de erro já existentes, sem
   expor prompt, credenciais ou detalhes internos.
7. Cobrir DTO, prompt/service, autorização, resposta e falhas com testes unitários
   e E2E.

### Fase 2 — Encaminhamento autenticado pelo frontend

1. Criar `POST /api/ai/writing-assistance` como route handler do Next.
2. Exigir cookie `access_token`, encaminhá-lo ao backend e propagar status e
   resposta conforme o padrão de `/api/users/me`.
3. Validar e encaminhar somente o tipo e o texto do campo; não retransmitir o
   restante do formulário.
4. Adicionar testes da rota para ausência de cookie, sucesso e erro do backend.

### Fase 3 — Componente de assistência e modal

1. Criar tipos e função cliente para chamar a rota same-origin.
2. Criar componente reutilizável de ação/modal com estado de carregamento,
   sugestão, erro e nova tentativa.
3. Exibir os botões **“Usar sugestão”** e **“Manter texto atual”** depois da
   resposta.
4. Capturar o valor submetido e detectar edição concorrente: se o campo mudar
   durante a chamada, não aplicar a resposta automaticamente; exigir nova
   confirmação ou descartar o resultado desatualizado.
5. Cobrir interação, acessibilidade, estados e proteção contra sobrescrita em
   testes do componente.

### Fase 4 — Integração nos formulários

1. Inserir a ação abaixo de Bio e headline no `ProfileForm`.
2. Inserir a ação abaixo da descrição no `ExperienceForm`.
3. Inserir a ação abaixo da descrição no `ProjectForm`.
4. Mapear cada campo ao tipo correto e atualizar apenas seu estado local quando
   a pessoa usar a sugestão.
5. Desabilitar a ação para conteúdo vazio ou composto somente por espaços.
6. Atualizar testes existentes dos formulários e adicionar cobertura para os
   quatro usos.

### Fase 5 — Validação

1. Revisar todos os usos, contratos e estados para confirmar consistência entre
   backend e frontend.
2. Executar `npm test` em `backend/` e `frontend/`, corrigindo testes existentes
   afetados e adicionando novos para o comportamento implementado.
3. Executar lint, typecheck e build nos dois projetos conforme seus scripts.
4. Executar `git diff --check` e registrar resultados reais nas TASKS.

## 3. Decisões técnicas

- Backend: endpoint `POST /ai/writing-assistance`, protegido pelo guard JWT
  existente.
- Frontend: proxy autenticado `/api/ai/writing-assistance`; não expor o token ao
  JavaScript cliente nem criar uma chamada cross-origin nova.
- Tipos de campo: união fechada para os quatro campos aprovados na SPEC.
- Resposta: objeto tipado `{ suggestion: string }`; texto vazio/inválido é erro
  controlado, não sugestão aplicável.
- Prompt: instrução interna específica por tipo, sem solicitar ou aceitar
  informações externas ao conteúdo enviado.
- Persistência: nenhuma; a sugestão só atualiza estado local mediante ação
  explícita, e o salvamento segue o formulário atual.
- Testes: atualizar testes existentes quando comportamento coberto mudar e
  criar testes novos para o endpoint, proxy, componente e integrações novas.
- Dependências: nenhuma nova; reutilizar NestJS, provider, Next route handlers,
  shadcn/ui e infraestrutura de testes existentes.

## 4. Áreas de código esperadas

```text
backend/src/modules/ai/
├── controllers/ai.controller.ts
├── dto/
├── prompts/
├── services/ai.service.ts
└── ai.e2e-spec.ts

frontend/src/app/api/ai/writing-assistance/route.ts
frontend/src/components/ai/writing-assistance/
frontend/src/components/users/forms/profile-form.tsx
frontend/src/components/experiences/forms/experience-form.tsx
frontend/src/components/projects/forms/project-form.tsx
```

Confirmar a convenção de diretórios real antes de criar novos arquivos e manter
os testes co-localizados conforme o padrão dos respectivos módulos.

## 5. Riscos e mitigação

| Risco                                              | Mitigação                                                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Sugestão acrescentar fatos ou exagerar experiência | Prompt específico, saída sem texto auxiliar e testes com casos de conhecimento versus experiência profissional |
| Resposta tardia sobrescrever edição recente        | Comparar o texto atual com o snapshot enviado e não aplicar resultado obsoleto sem confirmação                 |
| Cookie não chegar ao endpoint do backend           | Proxy same-origin com encaminhamento explícito de `access_token` e testes HTTP                                 |
| Provider indisponível ou limite atingido           | Usar tratamento de erro existente; preservar conteúdo e permitir nova tentativa                                |
| Requisição enviar dados além do campo              | DTO estrito e route handler que encaminha somente `fieldType` e `text`                                         |
| Exposição acidental de dados em logs               | Não registrar corpo da requisição, prompt ou resposta nos logs do fluxo                                        |

## 6. Definition of Done

- Os quatro campos exibem a ação no dashboard e usam o tipo correto.
- A requisição é autenticada, validada e encaminha somente o campo solicitado.
- O modal cobre carregamento, sucesso, falha, nova tentativa, aplicação e
  descarte.
- A sugestão não substitui nem salva o conteúdo sem ação explícita.
- Edição concorrente não é sobrescrita silenciosamente.
- Testes existentes afetados são atualizados e fluxos novos têm cobertura.
- `npm test`, lint, typecheck e build backend/frontend executados; resultados
  registrados nas TASKS sem presumir aprovação.

## Validação da implementação

- Lint backend: aprovado.
- Build backend: aprovado.
- Lint frontend: sem erros; permanece um warning preexistente em
  `src/components/home/header-publico.tsx` (`name` não utilizado).
- Typecheck frontend (`npx tsc --noEmit`): aprovado.
- Build frontend: não concluído. `next build` falhou ao iniciar processo CSS do
  Turbopack (`Operation not permitted` ao vincular porta); a tentativa de
  fallback `next build --webpack` falhou ao interpretar a saída de
  `TypeScript --showConfig`.
- `npm test` backend e frontend: aprovado conforme informado pelo usuário; os
  comandos não foram repetidos pelo assistente.
- `git diff --check`: aprovado.
