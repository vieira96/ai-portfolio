# Plan 031 — Carregamento do currículo a partir das APIs existentes

## Status

`READY`

## Estratégia

Reutilizar os clientes existentes do frontend e suas rotas atuais. A SPEC 031
não altera o backend e não adiciona uma camada de persistência.

## Responsabilidades

### Carga

Criar um carregador específico do currículo que:

1. busca o perfil atual;
2. busca tecnologias;
3. busca a primeira página de experiências, projetos e formações;
4. continua até consumir `totalPages` de cada coleção;
5. falha de forma explícita se uma fonte obrigatória não puder ser carregada.

As chamadas devem ser paralelas quando independentes, sem fazer requests por
tecla ou a cada atualização do preview.

### Mapeamento

Manter o mapper separado do editor. Cada responsabilidade deve possuir uma
função pequena ou uma transformação facilmente testável. IDs de banco viram
`sourceId`; `localId` é criado para o estado editável e não é enviado de volta
para nenhuma API.

### Integração do editor

Alterar `ResumeEditor` para receber `initialData: ResumeData`. A página ou um
componente de carga controla loading, erro e retry. O editor continua sendo o
orquestrador de estado local definido na SPEC 030.

O botão de exportação continua usando o snapshot local atual. Nenhum botão de
salvar será adicionado.

## Estrutura prevista

```text
frontend/src/components/resumes/data/
├── resume-api-loader.ts
├── resume-api-loader.spec.ts
├── resume-mapper.ts
└── resume-mapper.spec.ts

frontend/src/components/resumes/editor/
├── resume-editor.tsx
├── resume-editor.spec.tsx
└── resume-editor-loading.tsx

frontend/src/app/dashboard/curriculo/
└── page.tsx
```

Os nomes podem ser ajustados para seguir a estrutura já existente, desde que
carga, mapeamento, estado de loading/erro e editor permaneçam separados por
responsabilidade.

## Ordem de execução

1. Revisar os tipos e clientes atuais das APIs.
2. Implementar helper de paginação para cada coleção.
3. Implementar mapper dos DTOs para `ResumeData`.
4. Implementar carga paralela, loading, erro e retry.
5. Alterar o editor para receber dados iniciais reais.
6. Remover a fixture do caminho de produção, mantendo-a somente para testes
   unitários de componentes/templates quando necessário.
7. Testar que o estado local não chama mutações do dashboard.
8. Rodar validação completa do frontend.

## Validação

```bash
npx tsc --noEmit
npm run lint
npm test -- --run
npm run build
git diff --check
```

## Riscos

- Os endpoints atuais podem ter contratos diferentes dos tipos assumidos pelo
  dashboard; o mapper deve usar os DTOs reais.
- Uma coleção vazia é sucesso, não erro.
- Falha parcial deve ser tratada explicitamente e não mascarada com fixture.
- O carregamento não pode transformar IDs de origem em IDs locais reutilizados
  em requests de mutação.

## Definition of Done

- Editor preenchido pelas APIs existentes.
- Todas as páginas consumidas.
- Loading, erro e retry funcionando.
- Nenhuma alteração de backend ou banco.
- Nenhuma persistência de currículo.
- Testes e validações do frontend verdes.
