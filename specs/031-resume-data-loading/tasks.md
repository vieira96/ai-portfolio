# Tasks 031 — Carregamento do currículo a partir das APIs existentes

## Status

`READY_FOR_IMPLEMENTATION`

Cada task possui uma responsabilidade única. Esta fase não cria tabela,
migration, endpoint ou persistência de currículo.

## Contratos e fontes

- [x] **T1.** Revisar os tipos dos endpoints atuais de perfil, tecnologias,
  experiências, projetos e formações.
- [x] **T2.** Documentar no cliente do currículo quais fontes existentes serão
  consumidas.
- [x] **T3.** Criar testes com respostas reais representativas dos endpoints.

## Carga paginada

- [x] **T4.** Criar helper para carregar todas as páginas de experiências.
- [x] **T5.** Criar helper para carregar todas as páginas de projetos.
- [x] **T6.** Criar helper para carregar todas as páginas de formações.
- [x] **T7.** Criar carregador de tecnologias usando o cliente existente.
- [x] **T8.** Criar carregador do perfil usando a fonte autenticada existente.
- [x] **T9.** Criar carga coordenada das fontes independentes.

## Mapeamento

- [x] **T10.** Mapear o perfil para `ResumePersonalData`.
- [x] **T11.** Mapear experiências para `ResumeExperience`.
- [x] **T12.** Mapear projetos para `ResumeProject`.
- [x] **T13.** Mapear formações para `ResumeEducation`.
- [x] **T14.** Mapear tecnologias para `ResumeSkill`.
- [x] **T15.** Criar IDs locais estáveis sem reutilizá-los como IDs de API.
- [x] **T16.** Preservar ordem e categorias retornadas pelas fontes.

## Estados de interface

- [x] **T17.** Criar o estado visual de carregamento do currículo.
- [x] **T18.** Criar o estado visual de erro da carga.
- [x] **T19.** Criar a ação de tentar novamente.
- [x] **T20.** Impedir renderização de editor parcialmente preenchido durante a
  carga.

## Integração do editor

- [x] **T21.** Alterar `ResumeEditor` para receber `initialData` por prop.
- [x] **T22.** Inicializar o estado local a partir de `initialData`.
- [x] **T23.** Remover a fixture do caminho de produção da rota.
- [x] **T24.** Manter a fixture somente onde for necessária para testes isolados.
- [x] **T25.** Garantir que edição, inclusão, remoção e ordenação não chamem
  endpoints de mutação.

## Testes

- [x] **T26.** Testar paginação completa de experiências.
- [x] **T27.** Testar paginação completa de projetos.
- [x] **T28.** Testar paginação completa de formações.
- [x] **T29.** Testar mapeamento dos dados reais para `ResumeData`.
- [x] **T30.** Testar campos opcionais ausentes sem valores inventados.
- [x] **T31.** Testar erro de API sem fallback silencioso para fixture.
- [x] **T32.** Testar loading, erro e retry.
- [x] **T33.** Testar editor inicializado com dados reais.
- [x] **T34.** Testar isolamento local sem requests de mutação.

## Validação final

- [x] **T35.** Rodar typecheck e corrigir erros do contrato.
- [x] **T36.** Rodar lint e corrigir problemas do carregador.
- [x] **T37.** Rodar todos os testes do frontend.
- [x] **T38.** Rodar build do frontend.
- [x] **T39.** Rodar `git diff --check`.
- [x] **T40.** Validar a tela com dados reais em desktop, tablet e mobile.

## Definition of Done

- [x] `/dashboard/curriculo` usa as APIs existentes.
- [x] Todas as páginas de dados são carregadas.
- [x] Fixture não é usada em produção.
- [x] Não existe persistência de currículo.
- [x] Nenhuma tabela, migration ou endpoint novo foi criado.
- [x] Loading, erro e retry estão cobertos por testes.
- [x] Typecheck, lint, testes e `git diff --check` passaram.
- [x] Build de produção validado com sucesso.
- [x] Validação visual final com dados reais concluída.
