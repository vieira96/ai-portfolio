# Spec 002 — Categoria de Skill Sempre Presente

## Contexto

`Technology.category` nasceu opcional e o front aprendeu a conviver com nulo
(fallbacks "sem categoria"). Decisão nova: categoria ausente é dado inválido,
não caso de UI. Banco hoje tem 0 nulas (verificado), então a migração é segura.

## Requisitos

- **R1.** Coluna `technologies.category` passa a `NOT NULL` (migration).
- **R2.** `CreateTechnologyDto.category` obrigatória (sem `@IsOptional`).
- **R3.** Front: `Skill.category` não-nulo em `types/skills/skills.types.ts`;
  remover fallbacks "sem categoria" (`skill-list`, dashboard e onde houver);
  `Skill` da API (`lib/skills/skills.ts`) acompanha sem `| null`.
- **R4.** Seed e dados existentes continuam válidos (0 nulas hoje — verificado
  antes de migrar).

## Fora de escopo

- Backfill (não há nulas; se um dia houver, spec própria com estratégia).
- Mudar as 5 categorias (são as trancadas: BACKEND, FRONTEND, DADOS, DEVOPS, IA).
