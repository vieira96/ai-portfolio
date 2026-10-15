# Spec 019 — Home Pública do Portfólio

## Contexto

A rota `/` ainda é o placeholder do `create-next-app`. O README (ETAPA 42) define a home pública como a vitrine do portfólio (o que o recrutador vê): Hero, Sobre, Experiência, Tecnologias, Projetos, GitHub e Contato. Não há endpoint público de perfil (só `PATCH /users/me` com auth e `GET /auth/me` com guard, ambos intocados).

## Requisitos

- **R1 — Perfil público (backend).** Novo `GET /users/profile` público (sem guard, só leitura): retorna o dono do portfólio (primeiro usuário por `createdAt`) via `UserResponseDto` — que **já inclui `email`** (nada a adicionar no DTO). `GET /auth/me` e o gate do dashboard seguem intactos.

- **R2 — Seções da home (frontend, server components).** `/` com visual de portfólio próprio — **diferente do dashboard** (que é denso e administrativo): respiro generoso, tipografia grande, ritmo editorial, mas na mesma identidade (fundo `ink`, superfícies `surface`, bordas `line`, Manrope + DM Mono; sem gradiente gratuito, sem glassmorphism, sem dashboard de métricas).
  - **Hero** (tela cheia, ancorado no topo): avatar com anel, nome em destaque grande, headline, stacks principais em linha, dois CTAs (Ver projetos → `#projetos`, Entrar em contato → `#contato`); detalhe discreto de scroll ("role para ver mais" ou seta).
  - **Sobre** (`#sobre`): bio em coluna de leitura confortável (max-width), links GitHub/LinkedIn com ícones + email copiável.
  - **Experiência** (`#experiencia`): timeline vertical (marcador + linha) com empresa, cargo, período (`jan/2020 – atual`) e 1–2 linhas de descrição; mais recente primeiro.
  - **Tecnologias** (`#tecnologias`): chips agrupadas por categoria com cabeçalho por grupo (BACKEND, FRONTEND, DADOS, DEVOPS, IA); sem chips soltas sem grupo.
  - **Projetos** (`#projetos`): grade de cards (nome, descrição curta com clamp, até 3–4 chips de skills, botões GitHub/demo quando houver); card inteiro clicável se houver demo ou repo.
  - **Contato** (`#contato`, rodapé): chamada curta + email em destaque (copiável) + mesmos links sociais; fecha a página, sem conteúdo após.
  - Header público próprio (não o do dashboard): logo/nome + âncoras das seções + CTA contato; fixo com blur, reutilizando o padrão visual do `DashboardHeader` sem duplicar código à toa (avaliar extração de base comum na implementação).
  - Dados via `GET` públicos (`/users/profile`, `/projects`, `/technologies`, `/experiences`); cada seção busca independente e falha degradada (seção some, página não quebra); página nunca vazia por completo se o perfil existir (Hero + Contato derivam do perfil).

- **R3 — Navegação.** Header/âncoras ou links simples entre seções; CTA de contato (`mailto:` ou link, conforme dado do perfil).

- **R4 — Paginação com números (componente reutilizável).** `src/components/ui/pagination.tsx`: botões numerados (1, 2, 3…), **sem** botões "Anterior/Próxima"; página atual em destaque + `aria-current="page"`; `nav` com `aria-label`; props `current: number`, `totalPages: number`, `onChange: (page: number) => void`. Usado nas listas paginadas da home (experiência, projetos) no lugar dos botões de texto.

- **R5 — Validação.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes; specs para o endpoint e para as seções críticas; checagem visual desktop e mobile.

## Fora de escopo

- Seção "Ask My AI" — sem backend de IA (spec futura).
- `/projects`, `/projects/[id]`, `/experience`, `/ai` — páginas próprias ficam para specs futuras.
- Edição de conteúdo — continua no `/dashboard`.
- Reformulação da identidade — usa o tema atual.
