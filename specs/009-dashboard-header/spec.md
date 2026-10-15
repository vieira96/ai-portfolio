# Spec 009 — Header Fixo do Dashboard com Navegação por Âncoras

## Contexto

O dashboard tem header estático em `dashboard/layout.tsx` (logo + logout, sem `fixed`, sem nav). A página renderiza Perfil, Habilidades e Projetos em sequência, sem ids de âncora.

## Requisitos

- **R1 — `DashboardHeader`** (`src/components/dashboard/dashboard-header.tsx`): barra fixa (`fixed inset-x-0 top-0 z-40`, fundo `bg-ink/90` + blur) com logo, nav (`#perfil`, `#habilidades`, `#projetos`) e `LogoutButton` na barra (desktop). Scroll-spy via `IntersectionObserver`: link da seção visível recebe `aria-current` + destaque visual.

- **R2 — Navegação por âncoras.** Links com `href="#id"` nativos (sem JS de scroll); `scroll-smooth` no `<html>`; `scroll-mt-*` nas seções para o header fixo não cobrir o título.

- **R3 — Montagem e âncoras.** `dashboard/layout.tsx` usa `<DashboardHeader />` no lugar do header inline; `id="perfil"` no form do `ProfileForm`, `id="habilidades"` na `SkillsSection`, `id="projetos"` na `ProjectsSection`; `padding-top` no `main` do `DashboardClient` equivalente à altura do header.

- **R4 — Menu mobile (hambúrguer).** Em telas pequenas a nav inline esconde (`hidden md:flex`) e aparece botão hambúrguer (`md:hidden`, `aria-label` + `aria-expanded`); abre dropdown absoluto estilo menu (full-width abaixo do header) com os 3 links + `LogoutButton`; selecionar fecha o painel e navega; `Escape` fecha.

- **R5 — Validação.** `dashboard-header.spec.tsx` (links, `aria-current`, navegação por âncora, abrir/fechar do hambúrguer); `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes; checagem visual (fixo no topo ao rolar, clique ancora na seção certa, link ativo acompanha, mobile incluso).

## Fora de escopo

- Outras páginas — só o dashboard.
- Reformulação visual — mesma identidade, só fixo + nav.
