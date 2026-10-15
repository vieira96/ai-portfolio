# Tasks 002 — Categoria de Skill Sempre Presente

Referência: `plan.md` (D1–D4) e `spec.md` (R1–R4). Marcar `[x]` ao concluir
cada uma, com validação indicada. Uma por vez.

## Banco + Back

- [x] **T1.** Tornar `category` obrigatória em
  `backend/prisma/schema/technology/technology.prisma` (tirar o `?`) —
  validar com `npx prisma validate`
- [x] **T2.** Usuário roda `migrate dev` + `generate` (comandos manuais)
- [x] **T3.** Tirar `@IsOptional()` da categoria em `create-technology.dto.ts`
  — validar com `npm run build`

## Front

- [x] **T4.** Tirar `| null` de `SkillItem`/`Skill` em
  `types/skills/skills.types.ts` + `lib/skills/skills.ts` — validar com `tsc`
- [x] **T5.** Caçar e remover fallbacks "sem categoria" no front, um por um
  (validar cada remoção com `build`)

## Fechamento

- [x] **T6.** `lint` + `test` + `build` verdes nos 2 lados
