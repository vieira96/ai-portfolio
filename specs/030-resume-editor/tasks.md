# Tasks 030 — Editor de currículo ATS com preview em tempo real

## Status

`READY_FOR_IMPLEMENTATION`

Referência: `spec.md` e `plan.md`. Todas as tasks desta SPEC pertencem à fase
visual do frontend. Não criar tabela, migration, endpoint ou persistência de
currículo.

## Fundação e estado local

- [x] **T1.** Criar os tipos de domínio do currículo em
  `frontend/src/types/resumes/`.
- [x] **T2.** Criar a fixture local completa de `ResumeData`.
- [x] **T3.** Criar o mapper local da fixture para o estado editável.
- [x] **T4.** Criar o `ResumeEditor` com estado local.
- [x] **T5.** Manter alterações e modelo selecionado somente na sessão, sem
  botão ou estado de salvamento.

## Layout e formulários

- [x] **T6.** Criar o painel de preenchimento.
- [x] **T7.** Criar o painel de preview.
- [x] **T8.** Aplicar o layout desktop 40/60.
- [x] **T9.** Aplicar o layout mobile sem overflow horizontal.
- [x] **T10.** Criar o formulário de dados pessoais.
- [x] **T11.** Criar o formulário de experiências.
- [x] **T12.** Criar o formulário de projetos.
- [x] **T13.** Criar o formulário de formações.
- [x] **T14.** Criar o formulário de habilidades.
- [x] **T15.** Manter cada formulário em seu diretório de responsabilidade,
  com testes co-localizados e sem barrels desnecessários.
- [x] **T16.** Criar schemas Zod de e-mail e URLs com testes de valores válidos,
  vazios opcionais e inválidos.

## Edição e ordenação

- [x] **T17.** Implementar inclusão, edição e remoção de experiências.
- [x] **T18.** Implementar inclusão, edição e remoção de projetos.
- [x] **T19.** Implementar inclusão, edição e remoção de formações.
- [x] **T20.** Implementar inclusão, edição e remoção de habilidades.
- [x] **T21.** Implementar realizações editáveis (`highlights`) nas
  experiências. **Legado substituído pela T38:** o campo não faz mais parte da
  interface atual.
- [x] **T22.** Implementar ordenação de itens repetíveis no estado local.
- [x] **T23.** Implementar ordenação de categorias e habilidades por drag and
  drop iniciado exclusivamente pelos respectivos ícones.
- [x] **T24.** Renderizar competências por categoria e skills separadas por
  vírgulas, mantendo a ordem escolhida.

## Templates e exportação

- [x] **T25.** Criar o template ATS Clássico.
- [x] **T26.** Criar o template ATS Técnico.
- [x] **T27.** Criar o template ATS Compacto.
- [x] **T28.** Criar o registro dos três templates.
- [x] **T29.** Criar o seletor textual de modelos sem miniaturas vazias.
- [x] **T30.** Atualizar o preview em tempo real sem perder os dados ao trocar
  de modelo.
- [x] **T31.** Implementar exportação direta de PDF A4 com texto selecionável.
- [x] **T32.** Tornar e-mail e URLs válidos clicáveis no PDF.
- [x] **T33.** Garantir que a exportação não use impressão do navegador,
  screenshot ou canvas.
- [x] **T34.** Testar bullets de realizações e competências no HTML e PDF.
  **Legado substituído pela T38:** o conteúdo atual usa a descrição como fonte
  única, sem bullets duplicados.
- [x] **T38.** Remover o campo duplicado de “Realizações e impacto” e usar a descrição da experiência como fonte única no editor, preview e PDF.
- [x] **T39.** Tornar o preview independente da rolagem do formulário em desktop.
- [x] **T40.** Fixar a barra superior do editor durante a rolagem da página.
- [x] **T41.** Permitir reordenar as tecnologias de cada experiência pela alça
  de drag and drop, preservando a ordem no preview e no PDF.

## Rota e navegação

- [x] **T35.** Criar a rota `/dashboard/curriculo`.
- [x] **T36.** Adicionar o acesso ao currículo no dashboard geral.
- [x] **T37.** Remover o `DashboardHeader` da rota do currículo.
- [x] **T38.** Preservar o `DashboardHeader` na página geral `/dashboard`.
- [x] **T39.** Ajustar o espaçamento superior do editor sem header.

## Testes e revisão

- [x] **T40.** Criar testes dos formulários por responsabilidade.
- [x] **T41.** Criar testes do editor para preenchimento, edição, inclusão,
  remoção, reordenação e troca de modelo.
- [x] **T42.** Criar testes do header para o breakpoint responsivo.
- [x] **T43.** Rodar typecheck, lint, testes e `git diff --check`.
- [x] **T44.** Validar visualmente a tela em desktop, tablet e mobile com o
  usuário.

> **Validação de build:** `npx tsc --noEmit`, lint, testes e `git diff --check`
> passaram. `npm run build` com Turbopack ficou bloqueado pelo ambiente ao
> criar processo/abrir porta; `npx next build --webpack` também retornou erro
> interno do Next ao interpretar `tsc --showConfig`. O typecheck isolado passa.

## Definition of Done

- [x] Editor visual funcional com fixture local.
- [x] Nenhuma persistência de currículo criada nesta SPEC.
- [x] Header ausente em `/dashboard/curriculo`.
- [x] Header mantido em `/dashboard`.
- [x] Formulários separados e testados.
- [x] Três templates e exportação PDF implementados.
- [x] Typecheck, lint e testes verdes.
- [x] Revisão visual final concluída.

## Review

`DONE — fase visual concluída; integração com APIs existentes pertence à SPEC 031.`
