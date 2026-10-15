# SPEC (full stack): Editor de currículo ATS com preview em tempo real

## Status

`APPROVED`

## 1. Contexto

O dashboard já possui perfil, experiências, projetos, formações e tecnologias,
mas ainda não existe uma experiência de criação de currículo. O objetivo desta
SPEC é criar uma tela de edição dividida: formulário à esquerda e preview do
currículo à direita, mantendo os dados editados isolados dos dados originais do
dashboard.

## 2. Feature solicitada

Criar a primeira versão do editor de currículo ATS em `/dashboard/curriculo`.
O usuário poderá preencher ou revisar os dados, alternar entre até
três modelos de currículo e visualizar o resultado em tempo real.

Esta SPEC cobre o editor, o preview, os modelos, o estado local da sessão e a
exportação direta em PDF. A carga dos dados reais do dashboard será tratada na
SPEC 031. Geração por IA, otimização por vaga e exportação DOCX ficam fora
desta fase.

## 3. Objetivo

Permitir que o usuário crie um currículo visualmente consistente com o produto,
compatível com leitura ATS, sem modificar acidentalmente o perfil, as
experiências, os projetos, as formações ou as tecnologias cadastradas.

## 4. Sistema atual relevante

- Frontend em Next.js 16, React 19, TypeScript e Tailwind.
- Dashboard em `frontend/src/app/dashboard/`.
- Formulários existentes usam `zod`, `useState` e componentes próprios/shadcn.
- Dados atuais estão em `frontend/src/lib/` e `frontend/src/types/`.
- Backend usa NestJS, Prisma e PostgreSQL.
- Não existe módulo, rota, tabela ou template de currículo.

## 5. Local dos modelos

Os modelos fixos devem ficar no frontend, como componentes React de apresentação:

```text
frontend/src/components/resumes/
├── editor/
│   ├── resume-editor.tsx
│   ├── resume-form-panel.tsx
│   ├── resume-preview-panel.tsx
│   └── template-selector.tsx
├── forms/
│   ├── personal/
│   │   ├── resume-personal-form.tsx
│   │   └── resume-personal-form.spec.tsx
│   ├── experiences/
│   │   ├── resume-experience-form.tsx
│   │   └── resume-experience-form.spec.tsx
│   ├── projects/
│   │   ├── resume-project-form.tsx
│   │   └── resume-project-form.spec.tsx
│   ├── education/
│   │   ├── resume-education-form.tsx
│   │   └── resume-education-form.spec.tsx
│   ├── skills/
│   │   ├── resume-skill-form.tsx
│   │   └── resume-skill-form.spec.tsx
│   └── shared/
│       └── resume-validation.ts
├── data/
│   ├── resume-fixture.ts
│   ├── resume-mapper.ts
│   └── resume-mapper.spec.ts
├── pdf/
│   ├── resume-pdf-document.tsx
│   ├── resume-pdf-document.spec.tsx
│   └── resume-pdf-export.tsx
├── skills/
│   └── resume-skill-groups.ts
├── templates/
│   ├── classic-template.tsx
│   ├── modern-template.tsx
│   ├── minimal-template.tsx
│   ├── resume-template-registry.ts
│   └── index.ts
└── resume.types.ts
```

Os modelos são componentes fixos do frontend. Nesta SPEC, o identificador do
modelo e o snapshot editável ficam somente no estado local da sessão; nenhum
modelo ou conteúdo de currículo deve ser persistido no banco.

Os formulários devem ser organizados por domínio dentro de `forms/`. Cada
subdiretório deve conter somente os componentes e testes da responsabilidade
correspondente; não colocar todos os formulários diretamente na raiz de
`resumes`.

O registro central deve permitir adicionar modelos sem alterar o formulário:

```ts
type ResumeTemplateId = 'classic' | 'modern' | 'minimal';

type ResumeTemplateDefinition = {
  id: ResumeTemplateId;
  name: string;
  description: string;
  component: React.ComponentType<ResumeTemplateProps>;
};
```

## 6. Requisitos funcionais

### FR-01 — Rota e acesso

A rota autenticada oficial é `/dashboard/curriculo`, usada para criar e editar o
currículo. A tela deve usar a autenticação e os tokens visuais existentes, mas
não deve renderizar o `DashboardHeader`, para que o editor tenha o espaço
completo da viewport. O header continua disponível nas demais páginas do
dashboard, incluindo o acesso para esta rota.

### FR-02 — Layout do editor

Em desktop, a tela deve apresentar:

- painel de preenchimento ocupando aproximadamente 40% da área;
- painel de preview ocupando aproximadamente 60%;
- divisor visual entre os painéis;
- preview centralizado em proporção A4, com escala adequada à viewport;
- em desktop, o painel de preview deve ter rolagem vertical independente,
  iniciando sempre que o cursor estiver sobre ele, sem depender do formulário à
  esquerda chegar ao fim;
- a barra superior com navegação, título e ações deve permanecer fixa durante
  a rolagem da página;
- ações de voltar e exportar.

Em mobile, os painéis devem virar fluxo vertical ou abas, sem exigir scroll
horizontal.

A divisão inicialmente pode ser feita com CSS Grid. `react-resizable-panels`
somente deve ser adicionada se o redimensionamento manual for aprovado como
requisito; não é dependência obrigatória desta SPEC.

### FR-03 — Dados iniciais

Ao criar um currículo, preencher o estado inicial a partir de:

- perfil;
- experiências;
- projetos;
- formações;
- tecnologias.

Essa carga deve criar um snapshot editável em memória. Alterações posteriores no
editor não podem alterar automaticamente os registros originais nem ser
persistidas nesta fase.

O formulário deve abrir preenchido por padrão com os dados encontrados no
dashboard. O usuário não deve precisar redigitar nome, contatos, experiências,
projetos, formações ou tecnologias já cadastrados. Campos sem valor no cadastro
devem aparecer vazios e disponíveis para preenchimento.

Para o currículo, a carga deve buscar todos os itens cadastrados, e não apenas a
primeira página usada para exibição resumida no dashboard. O limite de paginação
visual do dashboard não pode fazer experiências, projetos ou formações
desaparecerem do editor.

### FR-04 — Formulário

O painel esquerdo deve permitir editar, no mínimo:

- nome;
- headline/cargo;
- e-mail;
- localização;
- telefone, quando o campo existir no contrato de perfil;
- resumo profissional;
- experiências;
- projetos;
- formações;
- habilidades/tecnologias;
- ordem e visibilidade das seções;
- ordem das categorias de habilidades;
- ordem das habilidades dentro de cada categoria.

Os campos podem ser organizados em etapas ou accordions, desde que o preview
continue visível no desktop.

Cada seção de itens repetíveis deve terminar com uma ação de inclusão visível:

- Experiências: **Adicionar nova experiência**;
- Projetos: **Adicionar novo projeto**;
- Formações: **Adicionar nova formação**;
- Habilidades/tecnologias: **Adicionar nova habilidade**.

O botão deve ficar abaixo da lista da respectiva seção, inclusive quando a lista
estiver vazia. Ao acioná-lo, o usuário deve conseguir preencher um novo item e
visualizá-lo imediatamente no preview. O novo item pertence inicialmente apenas
ao snapshot do currículo.

Os itens já cadastrados devem poder ser editados, removidos do currículo ou
reordenados sem alterar o registro original no dashboard.

Na seção de habilidades, a reordenação deve usar drag and drop iniciado
exclusivamente pelo ícone de arraste (`GripVertical`): o ícone da categoria
reordena categorias e o ícone de cada habilidade reordena as habilidades dentro
da própria categoria. O restante da linha não deve iniciar o arraste.

### FR-04A — Conteúdo otimizado para ATS

Cada experiência deve usar a descrição contextual como fonte única do conteúdo
descritivo. O editor não deve exibir um campo separado de “Realizações e
impacto”, evitando duplicar a mesma informação.

O preview HTML e o PDF devem renderizar a descrição da experiência como texto,
preservando números, percentuais, quantidades de usuários e outros resultados
informados pelo usuário. O sistema não pode inventar métricas.

A seção de competências deve usar o título convencional `Competências` e
renderizar uma linha por categoria, com as skills separadas por vírgulas. A
ordem definida no editor deve ser mantida no preview e no PDF para melhorar a
extração por scanners ATS.

### FR-05 — Preview em tempo real

O painel direito deve renderizar o mesmo `ResumeData` usado pelo formulário e
atualizar sem salvar a cada alteração.

O preview deve ser HTML semântico, com títulos convencionais (`h1`, `h2`) e
texto selecionável. Não usar imagem, canvas ou tabela para representar o
conteúdo do currículo.

E-mail e URLs exibidos no currículo devem ser validados com schemas Zod antes
de entrarem no preview ou no PDF. Os campos de URL aceitam vazio quando forem
opcionais, mas, quando preenchidos, devem ser URLs válidas com protocolo. O
campo de e-mail, quando preenchido, deve aceitar somente endereço válido. A
interface deve mostrar o erro no campo e impedir exportação de dados inválidos.

### FR-06 — Modelos

Disponibilizar até três modelos:

- `ATS Clássico` (`classic`): uma coluna, tipografia tradicional e máxima
  compatibilidade ATS;
- `ATS Técnico` (`modern`): uma coluna, competências priorizadas e hierarquia
  visual para vagas de tecnologia;
- `ATS Compacto` (`minimal`): visual mais compacto e econômico em páginas.

Todos os modelos devem receber o mesmo `ResumeData` e respeitar as mesmas regras
de conteúdo e acessibilidade. Trocar o modelo não pode apagar ou transformar os
dados do currículo.

### FR-07 — Seletor de modelo

O usuário deve conseguir escolher outro modelo sem sair da tela. O seletor deve
exibir o nome e a descrição de cada modelo em cartões textuais, sem quadrados
vazios ou miniaturas que não representem fielmente o currículo. O modelo ativo
deve possuir destaque visual e estado acessível.

O modelo selecionado deve permanecer no estado local enquanto a tela estiver
aberta. Não existe persistência de currículo nesta SPEC.

### FR-08 — Estado local da sessão

O editor deve manter o `ResumeData` e o `templateId` em estado local enquanto a
página estiver aberta. Não deve exibir botão ou estado de salvamento simulado,
nem criar tabela, migration ou endpoint de currículo.

### FR-09 — Exportação direta em PDF

O botão de exportação deve gerar e baixar diretamente um PDF, sem abrir a janela
de impressão do navegador. A geração deve usar o mesmo `ResumeData` e o mesmo
`templateId` selecionado no editor, sem transformar o preview em imagem.

O PDF deve:

- possuir camada de texto selecionável e pesquisável;
- usar tamanho A4;
- respeitar a ordem e o conteúdo do modelo selecionado;
- respeitar quebras de página razoáveis;
- não incluir formulário, botões, navegação ou elementos do dashboard;
- usar nome de arquivo seguro, como `samuel-vieira-curriculo-ats.pdf`;
- iniciar o download no navegador sem abrir a impressora.

A implementação deve centralizar a transformação do `ResumeData` em um
documento PDF próprio do domínio de currículos. Não usar screenshot, canvas ou
`html2canvas`, pois isso prejudica a leitura ATS.

E-mail, GitHub, LinkedIn, portfólio, repositório e demo de projetos devem ser
links clicáveis no PDF. O e-mail deve usar `mailto:` e as URLs devem preservar o
endereço validado como destino, sem transformar texto inválido em link.

### FR-10 — Inclusão de novos itens

Esta primeira SPEC deve suportar adicionar um item novo apenas ao snapshot do
currículo. O fluxo de perguntar se deseja salvar também no cadastro original
deve ser especificado e implementado em uma etapa posterior, pois depende de
contratos de criação e de uma decisão sobre conflito/sincronização.

O mesmo fluxo deve permitir adicionar novos itens mesmo quando a seção iniciou
vazia. O item novo deve receber uma identidade local estável durante a edição,
para que possa ser alterado ou removido antes do fim da sessão.

## 7. Regras de negócio

- **BR-01:** editar o currículo nunca altera automaticamente os dados do
  dashboard.
- **BR-02:** trocar de modelo preserva integralmente o conteúdo e a ordem das
  seções.
- **BR-03:** os modelos devem ser ATS-friendly: uma coluna, texto semântico,
  sem ícones como fonte de informação, sem texto em imagem e sem tabelas para
  estruturar conteúdo.
- **BR-04:** dados pertencentes ao usuário devem ser isolados por autenticação.
- **BR-05:** o preview e o PDF exportado devem representar o mesmo conteúdo.
- **BR-06:** conteúdo vazio não deve gerar títulos ou seções vazias no preview.
- **BR-07:** o estado inicial do currículo deve ser pré-preenchido com os dados
  existentes no dashboard.
- **BR-08:** adicionar, editar, remover ou reordenar um item dentro do currículo
  não altera o registro correspondente no dashboard.
- **BR-09:** exportar o currículo gera um PDF textual direto e não abre a janela
  de impressão do navegador.
- **BR-10:** e-mails e URLs do currículo são validados com Zod; valores inválidos
  não podem ser exportados.
- **BR-11:** contatos e URLs válidos permanecem clicáveis no PDF, usando
  `mailto:` para e-mail e o endereço original para links web.

## 8. Contrato de dados frontend

Criar um tipo compartilhado do domínio do currículo, por exemplo:

```ts
type ResumeData = {
  personal: {
    name: string;
    email: string;
    phone: string;
    location: string;
    headline: string;
    summary: string;
    githubUrl: string;
    linkedinUrl: string;
    portfolioUrl: string;
  };
  experiences: ResumeExperience[];
  projects: ResumeProject[];
  educations: ResumeEducation[];
  skills: ResumeSkill[];
  skillCategoryOrder: Array<'FRONTEND' | 'BACKEND' | 'DADOS' | 'IA' | 'DEVOPS'>;
  sections: Array<{
    id: 'summary' | 'experiences' | 'projects' | 'education' | 'skills';
    visible: boolean;
    order: number;
  }>;
};
```

O formato final deve ser revisado contra os DTOs reais antes da implementação.

Os schemas Zod do domínio devem ser a fonte de verdade da validação de campos
de contato e links no frontend. A validação de payloads de API será tratada na
SPEC 031, que consumirá os contratos já existentes.

## 9. Contrato backend

Não há contrato novo de currículo nesta SPEC. A tela usa uma fixture local
tipada para validação visual. O consumo das APIs existentes do dashboard será
especificado na SPEC 031, sem criar tabela, migration ou endpoint de currículo.

## 10. Fora de escopo

- geração ou reescrita por IA;
- adaptação automática para descrição de vaga;
- análise de palavras-chave ATS;
- colaboração ou compartilhamento público;
- persistência ou múltiplas versões do currículo;
- exportação DOCX;
- edição livre por arrastar blocos;
- salvamento de novos itens do currículo no cadastro do usuário;
- criação de templates pelo usuário.

## 11. Segurança

- Não renderizar HTML fornecido pelo usuário com `dangerouslySetInnerHTML`.
- Não expor cookies ou tokens no estado do editor.

## 12. Performance

- O formulário e o preview devem compartilhar estado local da tela.
- Não fazer request a cada tecla.
- O preview deve evitar regeneração de estruturas não afetadas quando possível,
  sem introduzir memoização excessiva.
- A exportação deve ser acionada explicitamente pelo usuário.

## 13. Testes

### Frontend

- componentes de formulário devem ser separados por responsabilidade: dados
  pessoais, experiências, projetos, formações e habilidades não devem ficar
  concentrados no componente orquestrador do editor;
- cada formulário deve ter teste co-localizado cobrindo renderização dos dados,
  edição, inclusão/remoção e callbacks de reordenação quando aplicável;
- o formulário de habilidades deve testar alteração de categoria e o início do
  drag and drop exclusivamente pelo ícone de arraste;
- `ResumeEditor` deve coordenar estado, callbacks, modelo selecionado e ações
  globais, enquanto cada formulário recebe somente os dados e callbacks de que
  precisa;
- o preview, o seletor de modelos e o exportador PDF também devem permanecer
  em componentes/módulos próprios;
- renderização dos três templates com a mesma fixture;
- experiências renderizadas com a descrição contextual, sem duplicação;
- competências renderizadas por categoria, com skills separadas por vírgulas;
- alteração de campo refletida no preview;
- validação de e-mail e URLs válidos e inválidos com Zod;
- reordenação das categorias e das skills dentro de cada categoria por drag and
  drop iniciado exclusivamente pelos respectivos ícones de arraste;
- troca de modelo preservando dados;
- seções vazias ocultas;
- layout desktop e mobile sem overflow horizontal;
- alterações mantidas no snapshot local sem ação de salvar simulada;
- geração de PDF textual escondendo controles e sem abrir a impressão.
- links web e e-mail clicáveis no PDF exportado.

## 14. Critérios de aceite

- **AC-01:** usuário autenticado acessa o editor sem quebrar o dashboard.
- **AC-02:** desktop exibe formulário à esquerda e preview à direita em proporção
  aproximada de 40/60.
- **AC-03:** dados iniciais do dashboard aparecem no formulário e no preview.
- **AC-04:** editar qualquer campo atualiza o preview sem alterar os dados de
  origem.
- **AC-05:** os três modelos podem ser alternados sem perda de dados.
- **AC-06:** o preview é semântico, selecionável e não usa tabela/canvas/imagem
  para estruturar o conteúdo.
- **AC-07:** o editor não exibe ação de salvar, não cria persistência e não
  altera o cadastro original; as edições existem somente na sessão atual.
- **AC-08:** exportar baixa um PDF A4 textual sem abrir a impressão e sem
  incluir controles do editor.
- **AC-09:** mobile não cria scroll horizontal nem torna o editor inutilizável.
- **AC-11:** ao abrir um currículo novo, os campos são pré-preenchidos com os
  dados da fixture local desta fase. O carregamento dos dados reais será
  validado na SPEC 031.
- **AC-12:** cada seção de itens repetíveis exibe uma ação inferior de adicionar
  novo item, inclusive quando não possui itens.
- **AC-13:** um item adicionado, editado, removido ou reordenado no currículo
  altera o preview sem modificar os dados de origem.
- **AC-14:** categorias de habilidades e skills dentro de cada categoria podem
  ser reordenadas por drag and drop iniciado exclusivamente no ícone de arraste
  de cada item; a mesma ordem aparece no preview e no PDF exportado, enquanto
  clicar ou arrastar o restante da linha não inicia a reordenação.
- **AC-15:** e-mail e URLs preenchidos são validados com Zod; valores inválidos
  exibem erro no campo e impedem a exportação.
- **AC-16:** o PDF exportado torna e-mail, GitHub, LinkedIn, portfólio,
  repositório e demo válidos clicáveis, usando `mailto:` para e-mail.
- **AC-17:** os formulários de dados pessoais, experiências, projetos,
  formações e habilidades são componentes separados por responsabilidade, e o
  `ResumeEditor` atua apenas como orquestrador do estado e das ações globais.
- **AC-18:** experiências exibem e renderizam a descrição contextual como fonte
  única, sem campo separado de realizações e impacto.
- **AC-19:** a seção `Competências` apresenta uma linha por categoria, skills
  separadas por vírgulas e na ordem definida pelo usuário.
- **AC-20:** em desktop, o preview pode ser rolado independentemente do
  formulário, sem exigir que o painel esquerdo chegue ao final.
- **AC-21:** a barra superior do editor permanece visível durante a rolagem e
  não cobre o conteúdo inicial do formulário.
- **AC-22:** tecnologias dentro de cada experiência podem ser reordenadas por
  drag and drop iniciado exclusivamente pela alça da tecnologia; a ordem deve
  ser preservada no preview e no PDF.

## 15. Documentação impactada

- `ROADMAP.md`: marcar a etapa correspondente somente depois da implementação
  completa.
- README do frontend: adicionar a nova tela quando ela estiver pronta.
- README do backend: não há documentação de novos endpoints nesta fase.

## 16. Definition of Done

- SPEC aprovada, PLAN e TASKS criados para a fase visual do frontend.
- Editor, preview e três templates implementados.
- Exportação direta de PDF A4 com texto selecionável funcionando em desktop e
  mobile.
- Testes relevantes, lint, typecheck e build verdes no frontend.
- Critérios AC-01 a AC-09 e AC-11 a AC-19 aplicáveis à fase visual validados.

## Final Review

### Consistency

`PASSED`

### Checked

- [x] requisitos revisados
- [x] regras de negócio revisadas
- [x] limites entre a fase visual e o consumo futuro das APIs revisados
- [x] critérios de aceite revisados

### Remaining Issues

`SPEC aprovada pelo usuário. PLAN/TASKS devem detalhar a implementação sem
alterar o escopo aprovado.`

### Review Result

`APPROVED — pronta para PLAN/TASKS.`
