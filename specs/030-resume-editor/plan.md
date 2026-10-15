# Plan 030 — Editor de currículo ATS com preview em tempo real

## Status

`READY`

## Escopo

Implementar e validar a experiência visual do editor em
`/dashboard/curriculo`, usando uma fixture local tipada. Esta fase não cria
tabela, migration, endpoint ou persistência de currículo. O consumo dos dados
reais do dashboard fica na SPEC 031.

## Decisões de implementação

### Editor

- `ResumeEditor` mantém um único `ResumeData` em estado local.
- Formulários, preview e seletor de modelo recebem dados e callbacks por props.
- O editor fica em layout 40/60 no desktop e fluxo vertical no mobile.
- A rota `/dashboard/curriculo` não renderiza o `DashboardHeader`; o header
  continua na página geral `/dashboard`.
- As alterações e o modelo escolhido desaparecem ao sair ou recarregar a tela.

### Formulários

Organizar cada responsabilidade em seu próprio diretório:

```text
frontend/src/components/resumes/forms/
├── personal/
├── experiences/
├── projects/
├── education/
├── skills/
└── shared/
```

Não criar barrels `index.ts` desnecessários. Cada formulário deve ter teste
co-localizado e receber somente seus dados e callbacks.

### Modelos e PDF

- Manter os três templates no registro do frontend: `classic`, `modern` e
  `minimal`.
- Todos os templates recebem o mesmo `ResumeData`.
- O preview é HTML semântico, uma coluna e compatível com ATS.
- O PDF usa `@react-pdf/renderer`, A4, camada de texto e links clicáveis.
- Não usar screenshot, canvas, `html2canvas` ou `window.print()`.

### Dados locais

A fixture cobre perfil, experiências, projetos, formações, tecnologias,
categorias ordenáveis. A descrição da experiência é a fonte única do conteúdo
descritivo; o mapper deve gerar IDs
locais estáveis para edição, inclusão, remoção e reordenação durante a sessão.

### Navegação

O dashboard geral mantém o acesso para `/dashboard/curriculo`. O editor não
deve herdar o header, para utilizar a largura completa da viewport.

## Arquivos principais

- `frontend/src/app/dashboard/curriculo/page.tsx`
- `frontend/src/components/resumes/editor/`
- `frontend/src/components/resumes/forms/`
- `frontend/src/components/resumes/data/`
- `frontend/src/components/resumes/templates/`
- `frontend/src/components/resumes/pdf/`
- `frontend/src/types/resumes/`
- `frontend/src/app/dashboard/page.tsx`

## Ordem de execução

1. Tipos, fixture e mapper locais.
2. Formulários separados por responsabilidade.
3. Estado do editor, inclusão, edição, remoção e reordenação.
4. Templates, preview, seletor e PDF.
5. Rota sem header global e acesso a partir do dashboard.
6. Testes co-localizados e validação visual.

O backend não participa desta fase. A integração com as APIs existentes será
planejada e executada na SPEC 031.

## Validação

```bash
npx tsc --noEmit
npm run lint
npm test -- --run
npm run build
git diff --check
```

## Definition of Done

- Editor visual funcional em `/dashboard/curriculo`.
- Dados da fixture preenchidos e editáveis somente na sessão.
- Três templates alternáveis sem perda de estado.
- PDF A4 textual com links válidos clicáveis.
- Header ausente do editor e presente no dashboard geral.
- Formulários separados e testados por responsabilidade.
- Typecheck, lint, testes e build do frontend validados.

## Review

`READY — fase visual isolada da integração com backend e sem persistência de currículo.`
