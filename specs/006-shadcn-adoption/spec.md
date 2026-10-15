# Spec 006 — Setup do shadcn/ui (instalação, sem migração)

## Contexto

Os modais do frontend (`ProjectModal`, `NewSkillsModal`) e o combobox de skills são 100% hand-rolled (`spec 005`). A decisão é adotar shadcn/ui, mas em duas etapas: **esta spec instala e configura**; a migração dos componentes é a `spec 007`. Nenhum comportamento muda aqui.

O projeto usa Next 16 + React 19 + Tailwind v4 + alias `@/*` → `./src/*`, com `@theme` customizado (`surface`, `line`, `accent`). O shadcn/ui suporta oficialmente esse stack (CLI `shadcn@latest init`, estilo `new-york`, CSS variables via `@theme`).

## Requisitos

- **R1.** Inicializar shadcn no projeto existente (`shadcn init`): `components.json` com estilo `new-york`, `rsc: true`, diretório `src`, alias `@/*`, variáveis CSS. **Preservar o `@theme` customizado** (`surface`, `line`, `accent`, fontes) — os tokens injetados pelo CLI não podem quebrar o tema atual.

- **R2.** Instalar via CLI apenas: `dialog`, `popover`, `command` (+ dependências que o CLI puxar: `@radix-ui/*`, `cmdk`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`). **Não instalar `button`**: o `Button` customizado (`components/ui/buttons/button.tsx`) permanece — evita churn e colisão de nomes/imports.

- **R3.** Validação: `components.json` criado, arquivos gerados conferidos (`components/ui/dialog.tsx`, `popover.tsx`, `command.tsx`, `lib/utils.ts`), diff de `globals.css`/`package.json` revisado; `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes; **zero mudança de comportamento** (nenhum componente existente usa shadcn ainda).

## Fora de escopo

- Qualquer migração de componentes existentes para shadcn → `spec 007`.
- `badge`, `sonner`/`toast`, dark-mode via tokens shadcn — não instalar/não mexer.
