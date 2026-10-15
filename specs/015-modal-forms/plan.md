# Plan 015 — Extrair Forms dos Modais com Formulário

## Contexto

Ver `spec.md`.

## Decisão

**Extração mecânica por modal, com contrato único form→modal.**

- Contrato (igual nos três):
  - Form recebe: valores iniciais (`project`/`experience` ou nada), `skills` (onde houver) e callbacks (`onSkillsCreated`, `onSaved`, `onClose`); possui campos, schema, submit (fetch), passo `NewSkillsModal`, `saving` e `error`.
  - Modal recebe as mesmas props de antes e só repassa: shell `Dialog`, `Title`, abrir/fechar. Sem `onValidSubmit`, sem stash, sem fetch no modal.
  - Form possui: estado dos campos, `fieldErrors`, schema zod, UI dos campos, `SkillsSelection`, botão Salvar (`disabled={saving}`), submit (fetch), passo `NewSkillsModal` (com stash), `error` e `saving`.
  - Modal possui: `Dialog` + `DialogContent`/`DialogTitle`, abrir/fechar e repasse de props. Nada de submit, fetch, stash ou erro no modal.
- `ProjectModal`: extrai campos nome/descrição/urls + `SkillsSelection` + schema + submit + `NewSkillsModal`; modal fica só com shell + repasse.
- `ExperienceModal`: idem + campos datas/checkbox "atual".
- `AddSkillModal`: extrai nome/categoria + schema + `POST`; modal fica só com shell + repasse.
- Testes: specs dos modais passam a renderizar via modal (fluxo) + casos do form isolado (validação, limpeza de erro); reaproveitar queries existentes sempre que possível.

## Arquivos a alterar/criar

### Novos

1. `frontend/src/components/projects/forms/project-form.tsx` (+ spec).
2. `frontend/src/components/experiences/forms/experience-form.tsx` (+ spec).
3. `frontend/src/components/skills/forms/add-skill-form.tsx` (+ spec).

### Existentes (modificações)

4. `frontend/src/components/projects/modals/project-modal.tsx` (+ spec) — shell + submit + `NewSkillsModal`.
5. `frontend/src/components/experiences/modals/experience-modal.tsx` (+ spec) — idem.
6. `frontend/src/components/skills/modals/add-skill-modal.tsx` (+ spec) — shell + `POST`.

### Intocados

- `NewSkillsModal`, `ConfirmModal`, `SkillsSelection`, specs 001–014, resto do frontend.

## Ordem de execução

1. **`ProjectForm`** + spec (maior, define o padrão e o contrato).
2. **`ExperienceForm`** + spec (segue o padrão).
3. **`AddSkillForm`** + spec (menor).
4. **Validação**: `lint` + `tsc` + `test` + `build` verdes + checagem visual (modais idênticos).

## Riscos

- Baixo-médio: extração mecânica, mas o stash de dados para o passo `NewSkillsModal` precisa preservar exatamente a semântica atual (payload reconstruído após categorizar) — coberto pelos testes de fluxo aninhado.
- Props do form espelham as antigas do modal (`project`, `skills`, `onSkillsCreated`, `onSaved`, `onClose`) — nada novo para o chamador.
