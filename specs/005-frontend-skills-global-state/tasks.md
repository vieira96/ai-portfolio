# Tasks 005 — Frontend: Estado Local no Dashboard + Modal de Categorização Extraído

Referência: `plan.md` e `spec.md` (R1–R7). Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## DashboardClient (estado levantado, sem Provider)

- [x] **T1.** Atualizar `src/app/dashboard/dashboard-client.tsx` — `useState(initialSkills)`, `addSkills` com dedupe por `id`, `setSkills` aceitando array ou updater; repassar `skills`/`onAddSkills`/`onSetSkills` para `SkillsSection` e `skills`/`onSkillsCreated` para `ProjectsSection`; remover `SkillsProvider` — validar com `npm run lint`
- [x] **T2.** Remover `src/lib/skills/skills-context.tsx` e corrigir imports restantes — validar com `npm run lint`

## SkillsSection (props)

- [x] **T3.** Atualizar `src/components/skills/sections/skills-section.tsx` — props `skills`, `onAddSkills`, `onSetSkills`; sem contexto; delete otimista + rollback preservados — validar com `npm run lint` + `npm test`

## ProjectsSection (repasse)

- [x] **T4.** Atualizar `src/components/projects/sections/projects-section.tsx` — novas props `skills`/`onSkillsCreated`; repassar ambas ao `ProjectModal` — validar com `npm run lint`

## NewSkillsModal (novo)

- [x] **T5.** Criar `src/components/skills/modals/new-skills-modal.tsx` — props `unknownSkills`/`onConfirm`/`onCancel` (sem `knownSkills`), selects com default BACKEND, sem API — validar com `npm run lint`
- [x] **T6.** Criar `src/components/skills/modals/new-skills-modal.spec.tsx` — testes: renderiza selects, default BACKEND, onConfirm/onCancel — validar com `npm test`

## ProjectModal

- [x] **T7.** Atualizar `src/components/projects/modals/project-modal.tsx`:
  - Novas props `skills`/`onSkillsCreated`.
  - **Combobox customizado** (não só `<select>`/`<datalist>`): dropdown das `skills` agrupadas por categoria, label "Selecione ou digite uma skill", digitação livre.
  - Remover `fetch('/api/skills')` interno; match case-insensitive com nomes/categorias canônicos.
  - Split por vírgula, remove vazios, deduplica case-insensitive; desconhecidas → `NewSkillsModal`.
  - `submitWithSkills` faz parse do JSON e devolve o projeto salvo; converte `technologies` em `Skill[]` → `onSkillsCreated`.
  - Remover estado/lógica de categorização inline.
  - validar com `npm run lint`

## Testes

- [x] **T8.** Atualizar `src/components/skills/sections/skills-section.spec.tsx` — render com props (sem Provider) — `npm test`
- [x] **T9.** Atualizar `src/components/projects/modals/project-modal.spec.tsx` — props `skills`/`onSkillsCreated`, mock de `NewSkillsModal`, casos de dedupe/canônicos/`onSkillsCreated` — `npm test`
- [x] **T10.** Atualizar `src/components/projects/sections/projects-section.spec.tsx` — passar `skills`/`onSkillsCreated` nos renders — `npm test`

## Refinamentos (R2.1 multi-select + R2.2 scroll lock)

- [x] **T13.** Combobox de seleção múltipla (R2.1) — dropdown permanece aberto após seleção, separador `", "`, +1 teste de multi-seleção — validado com `npm run lint` + `tsc` + `npm test`
- [x] **T14.** Bloqueio de scroll com modal aberto (R2.2) — hook `useLockBodyScroll` + uso em `ProjectModal`/`NewSkillsModal` + 1 teste de lock em cada spec — validado com `npm run lint` + `tsc` + `npm test`

## Fechamento

- [x] **T11.** `npm run lint` + `npm test` verdes
- [x] **T12.** Build Next.js (`npm run build`) sem erros
