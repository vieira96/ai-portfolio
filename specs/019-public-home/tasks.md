# Tasks 019 — Home Pública do Portfólio

Referência: `plan.md` e `spec.md` (R1–R5). Marcar `[x]` ao concluir cada uma, com validação indicada. Uma por vez.

## Backend (perfil público)

- [x] **T1.** `getPublicProfile()` + `GET /users/profile` público + unit (retorna dono) + e2e (200 sem cookie) — validar com `npm run build` + `npm test` no backend

## Frontend (visual com dados fake primeiro)

- [x] **T2.** Seções + header público com mocks (hero, sobre, timeline, chips, grid, contato) — checagem visual primeiro
- [x] **T3.** Ligar nos dados reais (`lib`, rotas, page, âncoras) + specs das seções — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`

## Paginação com números

- [x] **T4.** Criar `src/components/ui/pagination.tsx` (só números, `aria-current`, props `current`/`totalPages`/`onChange`) + spec; adotar em `experiencia-timeline` (e nas demais listas paginadas da home) no lugar de Anterior/Próxima — validar com `npm run lint` + `npx tsc --noEmit` + `npm test`

## Fechamento

- [x] **T5.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes + checagem visual desktop e mobile
