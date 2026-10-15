# Plan 003 — Projetos no Dashboard (Frontend)

Referência: `spec.md` (R1–R7). Nada fora dela entra sem aprovar antes.

## Decisões

| # | Decisão | Motivo |
|---|---|---|
| D1 | `Project` no front espelha o response do back (`technologies` incluídas) | Sem adivinhar forma; Scalar é a fonte |
| D2 | `project-card` em `components/projects/cards/` (pasta no plural) | Padrão aprovado na spec |
| D3 | Reaproveitar `SkillChip` + `ConfirmModal` genérico | Não duplicar o que já existe e está testado |
| D4 | Modal coletivo de categorias antes do POST (bloqueia payload incompleto) | Regra trancada na spec |
| D5 | Paginação anterior/próxima fixa em 4 (sem `size` na UI) | Fora de escopo variar agora |
| D6 | Falha no fetch → lista vazia, nunca throw na tela | Dashboard não quebra sem API |

## Arquivos

### Criar

1. `frontend/src/lib/projects/projects.ts` — `Project` + `getProjects(page?, size?)`
2. `frontend/src/types/projects/projects.types.ts` — `Project` com `technologies`
3. `frontend/src/components/projects/cards/project-card.tsx` — nome, descrição, links, chips
4. `frontend/src/components/projects/sections/projects-section.tsx` — lista + paginação + orquestra modais
5. `frontend/src/components/projects/modals/project-modal.tsx` — add/edit com Zod + modal coletivo de categorias
6. `frontend/src/app/api/projects/route.ts` — `GET` público + `POST` com cookie (molde skills)
7. `frontend/src/app/api/projects/[id]/route.ts` — `PATCH` + `DELETE` com cookie
8. Specs co-locados: card, section, modal, 2 rotas

### Editar

9. `frontend/src/app/dashboard/page.tsx` — +seção Projetos com dados via props

## Ordem de execução

1. Tipos + lib (1, 2) — base tipada primeiro
2. BFF (6, 7) — contrato verificável via curl antes da UI
3. Card (3) → section + modal (4, 5) → dashboard (9)
4. Specs junto de cada arquivo (não no final)
5. README magro + build verde
