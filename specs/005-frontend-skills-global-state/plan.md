# Plan 005 — Frontend: Estado Local no Dashboard + Modal de Categorização Extraído

## Contexto

Ver `spec.md`.

## Decisão

**Padrão: estado levantado em `DashboardClient` + props (sem Provider/Context).**

- `DashboardClient` (`src/app/dashboard/dashboard-client.tsx`, client component):
  - `const [skills, setSkillsState] = useState<Skill[]>(initialSkills)`.
  - `addSkills(newSkills: Skill[])` — adiciona evitando duplicatas por `id`.
  - `setSkills(next: Skill[] | ((current: Skill[]) => Skill[]))` — aceita array ou updater funcional (o delete otimista de `SkillsSection` usa a forma funcional).
  - Renderiza `ProfileForm`, `SkillsSection` e `ProjectsSection`, repassando estado e callbacks por props.
  - Não criar/usar `SkillsProvider`, `SkillsContext` ou hook `useSkills` (remover `src/lib/skills/skills-context.tsx`).

- `SkillsSection` (`src/components/skills/sections/skills-section.tsx`):
  - Props: `skills: Skill[]`, `onAddSkills(newSkills: Skill[])`, `onSetSkills(next: Skill[] | ((current: Skill[]) => Skill[]))`.
  - Remove `initialTechnologies` e qualquer leitura de contexto.
  - `deleteSkill` mantém o comportamento atual (otimista + rollback via `onSetSkills`).
  - `AddSkillModal` continua chamando `onAdded` → `onAddSkills([skill])`.

- `ProjectsSection` (`src/components/projects/sections/projects-section.tsx`):
  - Novas props: `skills: Skill[]`, `onSkillsCreated(newSkills: Skill[])`.
  - Repassa ambas para `ProjectModal` no ponto de render atual (`projects-section.tsx:134-141`).
  - `onSaved` continua recarregando a página atual de projetos.

- `ProjectModal` (`src/components/projects/modals/project-modal.tsx`):
  - Novas props: `skills: Skill[]`, `onSkillsCreated(newSkills: Skill[])`.
  - Remove `fetch('/api/skills')` interno; `known` = match case-insensitive contra `skills` das props (usa nome/categoria canônicos).
  - **Combobox customizado** (não só `<select>` nem só `<datalist>`): input com dropdown das `skills` agrupadas por categoria, label "Selecione ou digite uma skill"; digitação livre permitida.
  - `handleSubmit`: split por vírgula, remove vazios, deduplica case-insensitive; desconhecidas → `NewSkillsModal`.
  - `submitWithSkills` faz parse do JSON da resposta e devolve o projeto salvo; converte `technologies` em `Skill[]` e chama `onSkillsCreated`.

- `NewSkillsModal` (novo arquivo):
  - `src/components/skills/modals/new-skills-modal.tsx`
  - Props: `unknownSkills: string[]`, `onConfirm(skills: { name: string; category: SkillCategory }[])`, `onCancel()`.
  - Sem prop `knownSkills` (sem uso definido) e sem chamada de API — só UI.
  - UI: um select por skill, default `BACKEND`, botões "Confirmar e salvar" / "Voltar".

## Arquivos a alterar/criar

### Novos

1. `src/components/skills/modals/new-skills-modal.tsx` — modal extraído (só UI).
2. `src/components/skills/modals/new-skills-modal.spec.tsx` — testes unitários.

### Existentes (modificações)

3. `src/app/dashboard/dashboard-client.tsx` — estado `skills` + `addSkills`/`setSkills`, repasse por props, remover `SkillsProvider`.
4. `src/lib/skills/skills-context.tsx` — **remover** (não usar Provider/Context).
5. `src/components/skills/sections/skills-section.tsx` — props `skills`/`onAddSkills`/`onSetSkills`, sem contexto.
6. `src/components/projects/sections/projects-section.tsx` — props `skills`/`onSkillsCreated`, repasse ao `ProjectModal`.
7. `src/components/projects/modals/project-modal.tsx` — props `skills`/`onSkillsCreated`, combobox customizado, `NewSkillsModal`, sem fetch interno.
8. `src/components/skills/sections/skills-section.spec.tsx` — render com props (sem Provider).
9. `src/components/projects/modals/project-modal.spec.tsx` — props `skills`/`onSkillsCreated` + mock de `NewSkillsModal`.
10. `src/components/projects/sections/projects-section.spec.tsx` — passar `skills`/`onSkillsCreated` nos renders.

### Intocados

- `src/app/dashboard/page.tsx` — continua server: busca `session`/`skills`/`projects` e passa para `DashboardClient`.

## Ordem de execução

1. **DashboardClient**: estado `skills` + `addSkills`/`setSkills`, repasse por props, remover `SkillsProvider`.
2. **Remover** `src/lib/skills/skills-context.tsx` e corrigir imports.
3. **SkillsSection**: migrar para props.
4. **ProjectsSection**: novas props + repasse ao `ProjectModal`.
5. **NewSkillsModal**: componente novo + testes.
6. **ProjectModal**: combobox + `NewSkillsModal` + `onSkillsCreated`, sem fetch.
7. **Testes**: atualizar specs existentes; adicionar casos (dedupe case-insensitive, canônicos, `onSkillsCreated`).
8. `npm run lint` + `npm test` verdes.
9. Build Next.js (`npm run build`) sem erros.

## Riscos

- Baixo: prop drilling curto (`DashboardClient` → duas sections → um modal).
- `addSkills` com dedupe por `id` — seguro mesmo se chamado 2x.
- Delete otimista preservado via `onSetSkills` funcional + rollback.
