# Plan 006 — Setup do shadcn/ui (instalação, sem migração)

## Contexto

Ver `spec.md`. Escopo: instalar e configurar. Migração → `spec 007`.

## Decisão

**shadcn/ui, estilo `new-york`, instalado via CLI no projeto existente. Nenhum componente existente é alterado.**

- Init (`shadcn@latest init`, responder prompts): TypeScript sim, estilo `new-york`, base color neutra que não conflite (ex.: `zinc`/`slate` — só para tokens do shadcn), CSS variables sim, `rsc: true`, `src/app/globals.css`, alias `@/*` (já existe no `tsconfig.json:22`).
- **Proteger `src/app/globals.css`**: o CLI injeta variáveis/tokens shadcn — revisar o diff e manter o bloco `@theme` atual (`ink`, `surface`, `line`, `accent`, fontes) intacto e precedente. Se o CLI sobrescrever, restaurar manualmente.
- Componentes via `shadcn@latest add dialog popover command`: gera `components/ui/dialog.tsx`, `popover.tsx`, `command.tsx` + `lib/utils.ts` (`cn`) + deps (`@radix-ui/react-dialog`, `@radix-ui/react-popover`, `cmdk`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`). Conferir `package.json` após cada `add`. **Não adicionar `button`**.
- Validação final: `lint` + `tsc` + `test` + `build` verdes, com os mesmos testes/comportamento de antes (nada consome os novos componentes ainda).

## Arquivos a alterar/criar

### Novos (via CLI + config)

1. `components.json` — config shadcn (raiz do `frontend/`).
2. `frontend/src/components/ui/dialog.tsx`, `popover.tsx`, `command.tsx` — via CLI.
3. `frontend/src/lib/utils.ts` — `cn()` via CLI.

### Existentes (revisão de diff, sem mudança de comportamento)

4. `frontend/src/app/globals.css` — revisar tokens injetados, preservar `@theme` atual.
5. `frontend/package.json` — novas deps (via CLI, travar versões).

### Intocados

- Todo o resto, incluindo specs 001–005 e todos os componentes/modais/hooks existentes.

## Ordem de execução

1. **Init**: `shadcn init` + revisar `components.json` e diff de `globals.css`/`package.json`.
2. **Add**: `dialog`, depois `popover` + `command` (um por vez, conferindo arquivos gerados).
3. **Validação**: `lint` + `tsc` + `test` + `build` verdes.

## Riscos

- Baixo: nenhuma lógica existente é tocada.
- CLI pode reescrever `globals.css` além dos tokens — mitigado pela revisão manual do diff.
- `cmdk` + React 19: suportado nas versões atuais puxadas pelo CLI; travar versões no `package.json` após instalar.
