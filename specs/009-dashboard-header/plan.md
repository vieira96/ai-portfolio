# Plan 009 — Header Fixo do Dashboard com Navegação por Âncoras

## Contexto

O dashboard tem header estático em `dashboard/layout.tsx` (logo + logout, sem `fixed`, sem nav). A página (`DashboardClient`) renderiza Perfil (`ProfileForm`), Habilidades (`SkillsSection`) e Projetos (`ProjectsSection`) em sequência, sem ids de âncora.

## Decisão

**Header fixo dedicado + âncoras nativas + scroll suave via CSS.**

- Novo `DashboardHeader` (`src/components/dashboard/dashboard-header.tsx`, client, a criar): barra `fixed` (`inset-x-0 top-0 z-40`, fundo `bg-ink/90` + blur), logo, nav com os 3 links (`#perfil`, `#habilidades`, `#projetos`) e `LogoutButton` na barra (desktop).
- Menu mobile: nav inline `hidden md:flex`; botão hambúrguer `md:hidden` abre dropdown absoluto estilo menu (full-width abaixo do header); painel contém os 3 links + `LogoutButton`; selecionar ou `Escape` fecha (`aria-expanded` no botão).
- Scroll-spy via `IntersectionObserver` (`rootMargin` compensando o header fixo): link ativo recebe `aria-current` + destaque visual.
- Rolagem: âncoras nativas (`href="#id"`, sem JS de scroll) + `scroll-smooth` no `<html>` + `scroll-mt-*` nas seções para o header fixo não cobrir o título (padrão acessível: preserva hash na URL, teclado e histórico).
- Montagem: `dashboard/layout.tsx` troca o header inline por `<DashboardHeader />`.
- Âncoras: `id="perfil"` no form do `ProfileForm`, `id="habilidades"` na `SkillsSection`, `id="projetos"` na `ProjectsSection`.
- Compensação do fixo: `main` do `DashboardClient` ganha `padding-top` equivalente à altura do header.

## Arquivos a alterar/criar

### Novo (a criar)

1. `frontend/src/components/dashboard/dashboard-header.tsx` — componente.
2. `frontend/src/components/dashboard/dashboard-header.spec.tsx` — testes (links, `aria-current`, clique navega por âncora).

### Existentes (pendentes)

3. `frontend/src/app/dashboard/layout.tsx` — usa `<DashboardHeader />` no lugar do header inline.
4. `frontend/src/app/dashboard/dashboard-client.tsx` — `padding-top` no `main`.
5. `frontend/src/components/users/forms/profile-form.tsx` — `id="perfil"` no form.
6. `frontend/src/components/skills/sections/skills-section.tsx` — `id="habilidades"` + `scroll-mt-*` na section.
7. `frontend/src/components/projects/sections/projects-section.tsx` — `id="projetos"` + `scroll-mt-*` na section.
8. `frontend/src/app/layout.tsx` — `scroll-smooth` no `<html>` (afeta o site todo; intencional e mínimo).

## Ordem de execução

1. **Componente + spec de teste.**
2. **Montagem + âncoras + offset.**
3. **Validação**: `lint` + `tsc` + `test` + `build` verdes + checagem visual (fixo no topo ao rolar, clique ancora na seção certa, link ativo acompanha).

## Decisões (respondidas)

- **D1 — Formato do painel mobile:** dropdown absoluto full-width abaixo do header, estilo menu.
- **D2 — Logout no mobile:** vai para dentro das opções do hambúrguer (desktop mantém na barra).

## Riscos

- Baixo: sem lógica de negócio; `IntersectionObserver` não existe em jsdom antigo — spec cobre links/attrs, não o observer (ou mocka).
- `scroll-smooth` global é mudança pequena e reversível; alternativa seria `scrollIntoView` por JS (pior acessibilidade).
- Altura do header precisa bater com `padding-top`/`scroll-mt` — conferir visualmente em mobile e desktop.
