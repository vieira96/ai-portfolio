# Spec 015 — Extrair Forms dos Modais com Formulário

## Contexto

`ProjectModal`, `ExperienceModal` e `AddSkillModal` misturam três responsabilidades: shell do `Dialog`, estado/validação dos campos e chamadas de API. Proposta: extrair o formulário para `forms/` do módulo — o form cuida de form, o modal cuida de modal.

## Requisitos

- **R1 — Extração.** Criar `forms/project-form.tsx` (módulo projects), `forms/experience-form.tsx` (módulo experiences) e `forms/add-skill-form.tsx` (módulo skills), movendo para lá: estado dos campos, validação zod, UI dos campos (incluindo `SkillsSelection` onde houver), botão de submit, chamadas de API, etapa `NewSkillsModal` e estados de `saving`/`error` — tudo que é função de form.

- **R2 — Contrato.** O form recebe valores iniciais, `skills` (onde houver) e callbacks (`onSkillsCreated`, `onSaved`, `onClose`); o modal mantém **só**: shell `Dialog` (+ `Title`), abrir/fechar e repasse de props. Nada de submit, fetch, stash ou erro vive no modal.

- **R3 — Comportamento idêntico.** Fluxos, validações, mensagens e ordem de telas inalterados; specs existentes adaptados para a nova estrutura (queries por papel/label continuam funcionando) + cobertura dos forms isolados onde fizer sentido.

- **R4 — Validação.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes; sem regressão visual.

## Fora de escopo

- `NewSkillsModal` (só selects, sem validação) e `ConfirmModal` (sem form) — ficam como estão.
- Mudar regras/schemas, fluxos ou visual — só a separação.
