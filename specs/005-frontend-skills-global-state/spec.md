# Spec 005 — Frontend: Estado Global de Skills + Modal de Categorização Extraído

## Contexto

Hoje o `ProjectModal`:
1. Faz `GET /api/skills` ao salvar (busca skills existentes) — acoplamento desnecessário.
2. Contém **modal de categorização de novas skills** embutido (duas etapas no mesmo componente) — viola SRP.
3. Skills criadas junto com o projeto não aparecem na seção de Habilidades até recarregar a página.

A dashboard já carrega skills via `getSkills()` (server-side) e passa para `SkillsSection`. O estado compartilhado deve viver no cliente e ser sincronizado entre a seção de habilidades e o modal de projetos.

## Requisitos

- **R1.** Extrair modal de categorização para `src/components/skills/modals/new-skills-modal.tsx`:
  - Recebe `unknownSkills: string[]` (nomes das skills desconhecidas).
  - Props: `onConfirm(skills: { name: string; category: SkillCategory }[])`, `onCancel()`.
  - Internamente: estado `pendingSkills: { name: string; category: SkillCategory }[]` com default `BACKEND`.
  - UI: lista de selects (um por skill), botões "Confirmar e salvar" / "Voltar".

- **R2.** `ProjectModal` usa `NewSkillsModal`:
  - Recebe `skills: Skill[]` e `onSkillsCreated(newSkills: Skill[])` por props, repassadas de `DashboardClient` por `ProjectsSection`.
  - `handleSubmit` → separa `typedNames` em `known` + `unknown` usando `skills` recebidas por props.
  - Se `unknown.length > 0` → abre `NewSkillsModal` com `unknownSkills`.
  - `onConfirm` → chama `submitWithSkills(skills)`.
  - Remove `fetch('/api/skills')` interno.

- **R2.1.** Input de skills no `ProjectModal` vira **combobox customizado**:
  - Label: "Selecione ou digite uma skill".
  - Dropdown mostra `skills` recebidas por props, agrupadas por categoria.
  - Usuário pode **selecionar** existente OU **digitar** nome novo.
  - Se digitou nome que não existe na lista → trata como skill nova (entra no fluxo `unknown` → `NewSkillsModal`).
  - Múltiplas skills: separadas por vírgula (mantém comportamento atual), cada token processado individualmente.
  - Combobox de **seleção múltipla**: o usuário pode selecionar várias skills no dropdown, uma após a outra; os valores selecionados são concatenados no input separados por vírgula.
  - Ao selecionar uma sugestão, apenas o token atual (texto após a última vírgula) é substituído pelo nome canônico; os tokens anteriores são preservados.
  - O dropdown permanece disponível após cada seleção, filtrando pelo token atual, para escolher a próxima skill.
  - Não usar apenas `<select>` ou `<datalist>`: o primeiro não permite digitação livre e o segundo não oferece agrupamento por categoria de forma nativa.
  - Antes da separação entre conhecidas e desconhecidas, remover tokens vazios e deduplicar nomes sem diferenciar maiúsculas/minúsculas; ao encontrar uma skill conhecida, usar seu nome e categoria canônicos.

- **R2.2.** Bloqueio de scroll com modal aberto:
  - Ao abrir `ProjectModal` ou `NewSkillsModal`, desabilitar o scroll da página (`document.body.style.overflow = 'hidden'`).
  - Ao fechar por qualquer caminho (salvar, cancelar, voltar, clique no overlay), restaurar o valor anterior de `overflow`.
  - Garantir restauração no cleanup do efeito (unmount com modal aberto não pode deixar a página travada).
  - Preferir um hook compartilhado (ex.: `useLockBodyScroll`) usado pelos dois modais, em vez de lógica duplicada.
  - Caso de regressão (fluxo aninhado): digitar skill inexistente → `NewSkillsModal` → confirmar e salvar com sucesso → o scroll da página deve voltar ao normal (não pode ficar travado).

- **R3.** Estado compartilhado local ao dashboard:
  - `DashboardClient` mantém `skills: Skill[]` em `useState`, inicializado por `initialSkills` vindo do server.
  - Expõe `addSkills(newSkills: Skill[])`, que evita duplicatas por `id`, e uma função para substituir a lista quando necessário.
  - `SkillsSection` recebe `skills`, `onAddSkills` e `onSetSkills` por props.
  - `ProjectsSection` recebe `skills` e `onSkillsCreated`; repassa ambos para `ProjectModal`.
  - Não criar `SkillsProvider`, `SkillsContext` ou hook `useSkills`.

- **R4.** Ao criar/atualizar projeto com skills novas:
  - Response do backend já traz `technologies: Technology[]` (com `id`, `name`, `category`).
  - `submitWithSkills` deve fazer o parse do JSON da resposta de sucesso e devolver o projeto salvo.
  - `ProjectModal` converte as `technologies` do projeto salvo para `Skill[]` e chama `onSkillsCreated`.
  - `SkillsSection` re-renderiza automaticamente após a atualização do estado no `DashboardClient` — sem reload.

- **R5.** Testes unitários para `NewSkillsModal`:
  - Renderiza selects para cada skill desconhecida.
  - Default category = BACKEND.
  - `onConfirm` chamado com skills + categorias escolhidas.
  - `onCancel` chamado ao clicar "Voltar".

- **R6.** Testes de integração e atualização dos existentes — cobrir o estado compartilhado por props entre `DashboardClient`, `SkillsSection` e `ProjectModal`.

- **R7.** Zero breaking changes na API pública (rotas, DTOs, responses).
