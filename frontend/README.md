# Frontend — Portfolio AI Agent

App em **Next.js + React + Tailwind** do projeto Portfolio AI Agent.
O roadmap completo está no [README da raiz](../README.md).

## Stack

- Node 22 (`frontend/.nvmrc`)
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (tokens próprios em `src/app/globals.css`)
- Fontes Manrope + DM Mono (`next/font`)
- Validação: Zod nos forms (espelha o backend)
- Testes: Vitest + Testing Library + jsdom

## Arquitetura (BFF)

O browser fala só com o Next; o Next repassa pro Nest e carimba o cookie:

```text
Browser → /api/* (Next) → Nest → Set-Cookie httpOnly (domínio do front)
```

- Token nunca aparece no body nem pro JS (`httpOnly` + `SameSite=Lax`, 7 dias)
- `proxy.ts` redireciona por presença do cookie (barato, otimista)
- Páginas validam de verdade no servidor via `getSession()` (autoridade)
- `getSession()` com `cache()` do React: layout + page = 1 chamada por load

Exceção: o widget de chat (`components/chat/`) fala direto com o Nest
(`NEXT_PUBLIC_API_URL` + `credentials`, CORS liberado no backend) — BFF não serve
ali porque o tempo real é Socket.IO push-only e o cookie é anônimo (`chat_visitor`,
não `access_token`). Detalhes do contrato em `backend/README.md` (seção Chat).

## Estrutura

```text
frontend/
├── src/
│   ├── app/
│   │   ├── api/ (BFF: repassa + cookie, sem regra)
│   │   ├── auth/login/ + dashboard/ (Server Components)
│   │   └── layout + globals.css
│   ├── components/
│   │   ├── ui/ (primitivos: button, input, textarea, toast)
│   │   ├── ui/inputs/ (image-picker)
│   │   ├── auth/<tipo>/ + users/<tipo>/ (por domínio e tipo: forms, buttons)
│   │   ├── chat/ (widget: fab, panel, messages/, forms/, mock/ + specs ao lado)
│   │   └── skills/ + projects/ (por domínio: sections, cards, modals)
│   ├── types/chat/ (formato da API: pergunta, resposta, status, paginação)
│   ├── lib/ (clients de domínio (skills, projects, chat) + auth server-only)
│   ├── middlewares/ (lógica) + proxy.ts (entrada única, Next 16)
├── docker/ (Dockerfile + compose dev)
├── .env(.example)
└── run-project.sh
```

## Telas

Referência viva no browser — o README não cataloga tela (não escala).
Fluxo-chave: `/auth/login` → cookie → `/dashboard` (perfil, habilidades e
projetos em SSR; CRUD de skills/projetos via BFF `/api/*` com cookie).

## Variáveis de ambiente

Ver `frontend/.env.example`: `PORT`, `BACKEND_URL`, `NEXT_PUBLIC_APP_URL`,
`NEXT_PUBLIC_API_URL` (base pública que o browser usa pro chat).
Dentro do Docker, `BACKEND_URL` aponta pra `host.docker.internal:8000`
(dentro do container, `localhost` seria ele mesmo).

## Como rodar

```bash
cd frontend
./run-project.sh   # install, .env, sobe o container
```

Manual: `nvm use` → `cp .env.example .env` → `npm install` → `npm run dev`.
App em `http://localhost:3000` (backend em `:8000`).

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
npm test  # Vitest com jsdom
```

## Testes

Specs co-locados (`*.spec.{ts,tsx}` ao lado do fonte), executados com Vitest e
Testing Library quando aplicável.
