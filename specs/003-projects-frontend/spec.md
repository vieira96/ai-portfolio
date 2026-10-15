# Spec 003 — Projetos no Dashboard (Frontend)

## Contexto

Com a API pronta (spec 001 trancada 15/15), o dashboard ganha a seção
Projetos abaixo de Habilidades: lista vinda do servidor + criar via modal +
excluir com confirmação. Reusa os padrões de skills (chip, modal genérico,
BFF, Zod sempre em form).

Contrato real do backend (verificado no código em produção):
- `GET /projects?page&size` público → `{ data, total, page, totalPages }`
  (size default 4, teto 20)
- `POST /projects` (cookie) aceita `{ name, description!, repositoryUrl?,
  demoUrl?, skills: [{ name, category }]? }` — skill nova nasce com a
  categoria informada (upsert)
- `PATCH /projects/:id`, `DELETE /projects/:id` (cookie, 204 no delete)
- Sem `GET /:id`. Summaries path puro no Scalar.

## Requisitos

- **R1.** `lib/projects/projects.ts`: `Project` + `getProjects(page?, size?)`
  (fetch server-side `no-store` do `GET /projects`; falha → `{ data: [],
  total: 0, ... }` vazio, nunca throw na tela).
- **R2.** Tipos em `src/types/projects/projects.types.ts` (só `Project`
  com `technologies`).
- **R3.** `components/projects/cards`: `project-card` (nome, descrição, links
  repo/demo, chips das skills reaproveitando `SkillChip`), `projects-section`
  (lista + paginação simples anterior/próxima), modal add/edit,
  `ConfirmModal` genérico no delete.
- **R4.** Skills no cadastro: input que aceita texto livre; ao salvar, se houver
  skills ainda-não-salvas, abre **1 modal coletivo** (nome à esquerda, select
  de categoria à direita — padrão já aprovado); payload só segue com todas
  categorizadas (`{ name, category }`).
- **R5.** BFF `app/api/projects[/[id]]/route.ts` (mesmo molde do skills:
  repassa cookie/status/body).
- **R6.** Dashboard: nova seção abaixo de Habilidades, dados via props (SSR).
- **R7.** Zod em todo form; specs co-locados no molde (componente, rota).

## Fora de escopo

- Página pública de projetos / detalhe (só dashboard logado por enquanto).
- Paginação com tamanho variável na UI (fixo 4 por página no front, `size`
  do back ajustável depois).
