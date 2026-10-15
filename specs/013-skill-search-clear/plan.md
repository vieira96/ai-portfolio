# Plan 013 — Limpar Busca do Popover ao Fechar

## Contexto

Ver `spec.md`.

## Decisão

**Limpar no fechamento, no handler que já existe.**

- `SkillsSelection`: no `onOpenChange` do `Popover`, quando fechar (`open === false`), chamar `setSearch('')` junto ao `setOpen`.
- Nada muda na abertura, seleção, toggle ou `CommandEmpty`.

## Arquivos a alterar/criar

### Existentes (modificações)

1. `frontend/src/components/skills/inputs/skills-selection.tsx` — limpa busca ao fechar.
2. `frontend/src/components/skills/inputs/skills-selection.spec.tsx` — caso do R2.

## Ordem de execução

1. **Implementação + teste.**
2. **Validação**: `lint` + `tsc` + `test` verdes.

## Riscos

- Mínimo: uma linha + um teste; filtro volta a mostrar tudo na próxima abertura (comportamento desejado).
