# Plan 019 — Home Pública do Portfólio

## Contexto

Ver `spec.md`. Pré-requisito: nenhum (endpoints de projects/technologies/experiences já públicos; só falta o perfil).

## Decisão

**Página server-side com seções independentes (cada uma busca seus dados e falha sozinha).**

- Backend: `UsersService.getPublicProfile()` (primeiro usuário por `createdAt`) + `GET /users/profile` público no `UsersController` (sem guard); resto intacto.
- Frontend (`/`): cada seção é Server Component async que busca seus próprios dados (`profile`, `projects`, `technologies`, `experiences`) — falha isolada por seção; `HeaderPublico` (logo + âncoras + CTA) separado do `DashboardHeader`, avaliando base comum só se sair de graça.
- Componentes: `hero`, `sobre`, `experiencia-timeline`, `tecnologias-chips`, `projetos-grid`, `contato` (+ `header-publico`), todos presentacionais puros recebendo dados (testáveis sem fetch).
- Paginação (`src/components/ui/pagination.tsx`, reutilizável): só botões numerados (sem Anterior/Próxima), página atual com destaque + `aria-current="page"`, props `current`/`totalPages`/`onChange`; adotado nas listas paginadas da home no lugar dos botões de texto.

## Arquivos a alterar/criar

### Backend

1. `backend/src/modules/users/services/users.service.ts` — `getPublicProfile()`.
2. `backend/src/modules/users/controllers/users.controller.ts` — `GET /users/profile` público.
3. Specs: unit (`getPublicProfile`) + e2e (200 sem cookie).

### Frontend

4. `frontend/src/lib/profile/profile.ts` (ou reusar padrão `lib/*`) + tipos se preciso.
5. `frontend/src/components/home/*` — seções + header público.
6. `frontend/src/components/ui/pagination.tsx` (+ spec) — números, `aria-current`, sem Anterior/Próxima.
7. `frontend/src/app/page.tsx` — composição (substitui placeholder).
8. Specs das seções críticas.

### Intocados

- `GET /auth/me`, gate do dashboard, resto do backend/frontend.

## Ordem de execução

1. **Backend**: endpoint + specs.
2. **Seções + header** (dados mockados primeiro, igual 012/T1).
3. **Página + fiação real** + specs.
4. **Validação**: `lint` + `tsc` + `test` + `build` verdes + checagem visual desktop e mobile.

## Riscos

- Baixo: padrões copiados do dashboard; seções independentes isolam falhas.
- `getPublicProfile` (primeiro por `createdAt`) assume portfólio single-user — documentado, sem config extra.
