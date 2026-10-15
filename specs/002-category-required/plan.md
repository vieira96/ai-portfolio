# Plan 002 — Categoria de Skill Sempre Presente

Referência: `spec.md` (R1–R4). Nada fora dela entra sem aprovar antes.

## Decisões

| # | Decisão | Motivo |
|---|---|---|
| D1 | Migration `SET NOT NULL` direta, sem backfill | Banco tem 0 nulas (verificado); backfill seria código morto |
| D2 | `category` some dos opcionais no create, continua opcional no update | PATCH parcial não pode exigir o campo |
| D3 | Tipos do front espelham o banco (`SkillCategory`, `Skill` sem `\| null`) | Fonte única em `types/skills/skills.types.ts` |
| D4 | Sem fallback "sem categoria" em UI nenhuma — remover, não esconder | Dado inválido não merece branch de render |

## Arquivos

### Criar

(nenhum — só edições)

### Editar

1. `backend/prisma/schema/technology/technology.prisma` — `category` sem `?`
   (usuário roda `migrate dev` + `generate`)
2. `backend/src/modules/technologies/dto/create-technology.dto.ts` — tira `@IsOptional()` da categoria
3. `frontend/src/types/skills/skills.types.ts` — `SkillItem.category` sem `| null`
4. `frontend/src/lib/skills/skills.ts` — `Skill.category` sem `| null`
5. Caçar fallbacks: `grep "SEM CATEGORIA\|sem categoria\|?? '—'"` no front e remover o que for fallback (não placeholder legítimo)

## Ordem de execução

1. Prisma (1) → usuário roda `migrate dev` + `generate`
2. DTO back (2) → tipos front (3, 4)
3. Caça aos fallbacks (5) um por um, com `build` no fim
