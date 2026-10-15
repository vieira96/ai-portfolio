# SPEC 031 — Carregamento do currículo a partir das APIs existentes

## Status

`APPROVED`

## 1. Objetivo

Substituir a fixture local usada em `/dashboard/curriculo` pelo consumo dos
dados já cadastrados no dashboard. Esta SPEC cobre somente carregamento e
mapeamento inicial; não cria persistência de currículo.

## 2. Escopo

Ao abrir `/dashboard/curriculo`, carregar os dados reais de:

- perfil do usuário;
- experiências;
- projetos;
- formações;
- tecnologias/skills.

O resultado deve preencher o mesmo `ResumeData` usado pelo editor da SPEC 030.
Depois da carga, todas as edições continuam somente no estado local da sessão.

## 3. Fora de escopo

- nova tabela ou migration Prisma;
- módulo, controller ou endpoint de currículo;
- salvar currículo, modelo, ordem ou alterações no banco;
- criar, editar ou excluir registros originais do dashboard;
- sincronizar novos itens adicionados no editor com o cadastro original;
- múltiplos currículos ou histórico de versões.

## 4. Fontes existentes

Usar os clientes e rotas já existentes, sem duplicar contratos:

- perfil: sessão/perfil já usado pelo dashboard;
- tecnologias: `GET /technologies`;
- experiências: `GET /experiences`;
- projetos: `GET /projects`;
- formações: `GET /educations`.

Os limites pequenos usados na página resumida do dashboard não podem ser
reutilizados no currículo. O editor deve carregar todas as páginas necessárias.

## 5. Requisitos funcionais

### FR-01 — Carga inicial

Ao acessar a rota autenticada, o servidor ou cliente responsável pela carga
deve buscar os dados reais e entregar um `ResumeData` inicial ao `ResumeEditor`.

### FR-02 — Paginação completa

Para experiências, projetos e formações, consumir a primeira página e seguir
buscando as páginas restantes até `totalPages`, preservando a ordem retornada
pela API. Não assumir que `size=2` ou `size=4` contém todos os registros.

### FR-03 — Mapeamento

Criar um mapper explícito entre os DTOs existentes e o domínio `ResumeData`.
Itens vindos do banco recebem `sourceId` e um `localId` estável para o editor.
Campos ausentes recebem valores vazios compatíveis com os formulários.

### FR-04 — Perfil e contatos

Mapear nome, e-mail, telefone quando disponível, localização, headline, resumo e
URLs conforme o contrato atual. Não inventar telefone, localização, métricas ou
links ausentes no banco.

### FR-05 — Tecnologias

Mapear todas as tecnologias retornadas para `ResumeSkill`, preservando nome e
categoria. Definir uma ordem inicial determinística, sem alterar a categoria
original cadastrada.

### FR-06 — Isolamento local

Após o carregamento, o editor pode alterar, remover, incluir e reordenar itens
somente no snapshot em memória. Nenhuma ação do editor pode chamar endpoint de
criação, atualização ou exclusão dos módulos existentes.

### FR-07 — Falhas de carga

Falhas devem ser tratadas com estado de erro e mensagem clara. Não exibir uma
fixture pessoal como fallback silencioso quando a API falhar. O usuário deve
poder tentar novamente.

### FR-08 — Estados de interface

Exibir carregamento enquanto os dados necessários são buscados e impedir que o
editor apareça parcialmente preenchido como se estivesse pronto.

## 6. Contrato interno

O resultado do carregamento deve ser:

```ts
type ResumeInitialData = ResumeData;
```

O `ResumeEditor` deve aceitar os dados iniciais por prop ou receber um estado
equivalente por um componente de carregamento. A fixture da SPEC 030 não deve
ser usada na tela de produção após esta SPEC.

## 7. Segurança

- preservar a autenticação já usada pelo dashboard;
- não expor tokens no `ResumeData`;
- não buscar dados de outro usuário;
- não alterar endpoints existentes para acomodar o editor.

## 8. Testes

- mapper de perfil, experiências, projetos, formações e tecnologias;
- paginação até a última página;
- preservação da ordem retornada;
- campos opcionais ausentes;
- erro de API sem fallback silencioso para fixture;
- estado de loading e erro;
- editor inicia com os dados reais recebidos;
- edição posterior não dispara mutação nos módulos originais.

## 9. Critérios de aceite

- **AC-01:** o currículo abre preenchido com os dados existentes no dashboard.
- **AC-02:** todos os registros de experiências, projetos e formações aparecem,
  mesmo quando excedem a primeira página.
- **AC-03:** tecnologias preservam nome, categoria e ordem inicial definida.
- **AC-04:** dados ausentes permanecem vazios, sem valores inventados.
- **AC-05:** falha de API exibe erro e opção de tentar novamente.
- **AC-06:** a fixture não é usada como fallback silencioso na produção.
- **AC-07:** editar o currículo não chama endpoints de mutação do dashboard.
- **AC-08:** nenhuma tabela, migration ou endpoint de currículo é criado.
- **AC-09:** ao sair ou recarregar a tela, alterações locais não são mantidas.

## Definition of Done

- Todas as fontes existentes conectadas ao editor.
- Paginação completa validada.
- Fixture removida do caminho de produção.
- Loading, erro e retry implementados.
- Testes do mapper, carga e isolamento local verdes.
- Typecheck, lint, testes e build do frontend verdes.
