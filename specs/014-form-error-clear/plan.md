# Plan 014 — Erro de Validação Some ao Corrigir o Campo

## Contexto

Ver `spec.md`.

## Decisão

**Limpar o erro do campo no `onChange`, sem revalidar nada.**

- Padrão por campo (nos 5 formulários): no handler de mudança, além de setar o valor, remover a chave do campo em `fieldErrors` (se existir):
  ```tsx
  setFieldErrors((current) => {
    if (!(key in current)) return current;
    const { [key]: _removed, ...rest } = current;
    return rest;
  });
  ```
- Sem hook compartilhado (3 linhas por campo, explícito e legível); sem `useEffect`; submit intacto.

## Arquivos a alterar/criar

### Existentes (modificações + specs)

1. `frontend/src/components/projects/modals/project-modal.tsx` (+ spec).
2. `frontend/src/components/experiences/modals/experience-modal.tsx` (+ spec).
3. `frontend/src/components/skills/modals/add-skill-modal.tsx` (+ spec).
4. `frontend/src/components/users/forms/profile-form.tsx` (+ spec).
5. `frontend/src/components/auth/forms/login-form.tsx` (+ spec, se valida campo a campo — verificar).

## Ordem de execução

1. **Modais** (project, experience, add-skill) + specs.
2. **Formulários** (profile, login) + specs.
3. **Validação**: `lint` + `tsc` + `test` + `build` verdes.

## Riscos

- Baixo: mudança aditiva em handlers; `login-form` pode não ter erro por campo (verificar — se só erro geral, pula com registro).
