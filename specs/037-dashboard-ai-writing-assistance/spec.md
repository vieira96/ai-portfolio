# SPEC 037 — Assistência de escrita com IA no dashboard

## Status

`APPROVED`

## 1. Objetivo

Permitir que a pessoa solicite uma sugestão de escrita para campos textuais do
dashboard. A IA deve tornar o conteúdo mais claro e profissional, preservando as
informações fornecidas e sem acrescentar fatos que não estejam no texto de
origem.

## 2. Escopo

### Incluído

- ação de assistência nos campos Bio, headline, descrição da experiência e
  descrição do projeto;
- chamada autenticada à API de IA usando o valor atual do campo e seu tipo;
- modal com estado de carregamento enquanto a sugestão é solicitada;
- apresentação da sugestão para revisão antes de qualquer alteração;
- aplicação opcional da sugestão no campo correspondente do formulário;
- manutenção do texto original caso a pessoa descarte ou feche a sugestão;
- reutilização da infraestrutura de providers e dos padrões de interface já
  existentes;
- testes de frontend e backend para os comportamentos adicionados ou alterados.

### Fora de escopo

- alteração automática ou persistência automática dos campos;
- assistência em outros campos ou no editor de currículo ATS;
- geração de conteúdo sem texto original;
- alteração do conteúdo de outros registros como efeito colateral;
- introdução de provider ou dependência externa nova.

## 3. Campos contemplados

| Campo | Formulário |
|---|---|
| Bio | Perfil do usuário |
| Headline | Perfil do usuário |
| Descrição da experiência | Formulário de experiência |
| Descrição do projeto | Formulário de projeto |

A ação deve aparecer junto ao respectivo campo, abaixo dele, com o rótulo
**“Aprimorar texto com IA”**. Ela deve seguir o estilo e os estados de interação
dos botões já usados no dashboard.

## 4. Requisitos funcionais

### FR-01 — Solicitar sugestão

Ao acionar **“Aprimorar texto com IA”**, abrir um modal e solicitar uma sugestão
para o valor atual do campo. A requisição deve identificar o tipo do campo para
que a sugestão respeite seu propósito, por exemplo, uma headline curta ou uma
descrição de experiência.

O botão deve ficar indisponível enquanto o campo estiver vazio ou composto
somente por espaços. O texto enviado deve ter no máximo 10.000 caracteres. Não
deve enviar dados de outros campos do formulário que não sejam necessários à
sugestão.

### FR-02 — Carregamento e resultado

Enquanto a API processa a solicitação, o modal deve apresentar um estado de
carregamento claro, impedir solicitações duplicadas e permitir que o usuário
entenda que a sugestão está sendo preparada.

Quando a resposta chegar, o modal deve apresentar, de forma claramente
identificada, os dois conteúdos para comparação:

- **Texto atual** — o valor enviado à API, preservado sem alterações enquanto
  a pessoa revisa;
- **Sugestão** — o texto retornado pela IA.

Os conteúdos devem aparecer em áreas visualmente distintas e permitir a leitura
integral de ambos. O modal também deve apresentar as ações:

- **“Usar sugestão”** — substitui o valor do campo no formulário;
- **“Manter texto atual”** — fecha o modal sem alterar o campo.

O modal não deve substituir o campo automaticamente ao receber a resposta.

### FR-03 — Aplicação local

Usar a sugestão atualiza somente o estado do formulário aberto. A persistência
continua dependendo da ação normal de salvar o perfil, a experiência ou o
projeto. Descartar ou fechar o modal preserva o valor que estava no formulário
antes da solicitação.

Se o usuário editar o campo enquanto uma solicitação está em andamento, a
resposta não pode sobrescrever essa edição sem confirmação explícita.

### FR-04 — Qualidade e fidelidade do texto

A sugestão deve melhorar clareza, organização e tom profissional, mantendo o
idioma e a intenção do texto original. Deve preservar nomes, tecnologias,
responsabilidades, resultados e demais informações fornecidas, sem inventar,
exagerar ou converter aprendizado/conhecimento em experiência profissional.

O conteúdo retornado deve ser texto simples, sem explicações, comentários,
marcação ou conteúdo adicional que não pertença ao campo solicitado.

### FR-05 — Erros

Se a solicitação falhar, o modal deve informar que não foi possível gerar a
sugestão e oferecer uma forma de tentar novamente. O texto atual do formulário
deve permanecer intacto. Mensagens técnicas, prompts, credenciais e dados
internos dos providers não podem ser expostos à pessoa.

## 5. Contrato da API

O backend deve expor uma operação autenticada e validada para solicitar a
sugestão. O contrato deve distinguir os quatro tipos de campo aceitos, receber
o texto atual e retornar uma única sugestão textual. A resposta não deve incluir
nem persistir o texto do currículo ou de outros registros.

O endpoint deve seguir o padrão de autenticação, validação, documentação,
tratamento de erros e uso da cadeia de providers já adotado pelo módulo de IA.
O detalhe final de rota e DTO será definido no PLAN, após confirmar a estrutura
atual do módulo.

## 6. Requisitos não funcionais e privacidade

- A funcionalidade fica disponível apenas no dashboard autenticado.
- Enviar somente o texto do campo solicitado e o identificador de seu tipo.
- Não registrar o conteúdo enviado ou sugerido em logs.
- Não persistir prompts, textos ou sugestões no banco.
- Preservar autorização e isolamento dos dados do usuário autenticado.
- Exibir estados acessíveis de carregamento, resultado e erro no modal.

## 7. Testes

- API: validação dos tipos permitidos, texto obrigatório, resposta e falhas do
  provider;
- API: autenticação e ausência de persistência ou logging do texto;
- frontend: ação presente nos quatro campos e indisponível para texto vazio;
- frontend: carregamento, resultado, nova tentativa após erro e fechamento;
- frontend: aplicar sugestão atualiza somente o campo correspondente;
- frontend: descartar sugestão preserva o conteúdo atual;
- regressão: edição durante uma requisição não é sobrescrita silenciosamente;
- atualizar testes existentes quando os componentes ou contratos cobertos forem
  modificados.

## 8. Critérios de aceite

- **AC-01:** os quatro campos contemplados exibem a ação **“Aprimorar texto com IA”**.
- **AC-02:** ao solicitar assistência, o modal informa o carregamento até a
  resposta da API.
- **AC-03:** após a resposta, o modal exibe separadamente o texto atual e a
  sugestão, com rótulos claros, e não altera o formulário antes da confirmação
  da pessoa.
- **AC-04:** usar a sugestão altera apenas o campo correspondente no estado do
  formulário; salvar continua sendo uma ação separada.
- **AC-05:** manter o texto atual ou fechar o modal não altera o campo.
- **AC-06:** a sugestão melhora clareza e apresentação profissional sem
  acrescentar informações ausentes do texto de origem.
- **AC-07:** falhas permitem nova tentativa e não apagam nem alteram o texto
  atual.
- **AC-08:** `npm test` de frontend e backend passa, com cobertura nova ou
  atualizada para os fluxos modificados.

