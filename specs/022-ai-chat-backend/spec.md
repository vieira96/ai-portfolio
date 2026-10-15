# SPEC (backend): Chat IA — implementação (gateway, worker, eventos)

## Status

`APPROVED`

## 1. Context

Dada a spec 021 executada (dependências de socket e fila instaladas, `REDIS_URL` lida e validada, tabela `chat_message` migrada, gateway base registrado e boot provado), esta SPEC implementa o comportamento do chat: gateway com eventos, validação, persistência de pendente, worker com stream, fallback e contrato.

Premissas desta SPEC: transporte via socket com push na resposta; pergunta válida persiste pendente e entra na fila para não travar o fluxo; inválida recebe resposta como se fosse a IA sem tocar fila nem modelo; stream de tokens com evento de conclusão; cookie anônimo por visitante sem conta; texto montado dos CRUDs; Socket.IO.

## 2. Requested Feature

Escopo: backend. Pergunta em linguagem natural sobre o dono do portfólio, enviada pelo socket: se válida, cria na hora uma resposta pendente e entra na fila; o worker gera em stream com o Qwen a partir dos dados reais do banco e empurra tokens e conclusão pelo socket. Se inválida, resposta como se fosse a IA com texto de assunto inválido, sem tocar fila nem modelo.

## 3. Goal

Uma pergunta como "onde você trabalhou com NestJS?" tem sua resposta pendente criada e enfileirada sem bloquear o envio; durante a geração, tokens chegam pelo socket; ao concluir, evento de conclusão com texto completo em pt-BR citando dados reais. Modelo fora/timeout: evento de erro amigável, conexão de pé, resto do backend intacto.

## 4. Current System

Somente componentes reais + base da 021:

- Fundação 020: Ollama + Qwen, `LlmProvider` (`chat()` + `isAvailable()`), `GET /ai/health`, env `OLLAMA_*` validadas.
- Base 021 (premissas desta SPEC): `socket.io` + adaptador Nest instalados; `bullmq`/`@nestjs/bullmq`/`ioredis` instalados com Redis do compose; `REDIS_URL` lida no schema; tabela `chat_message` (`visitorId`, pergunta, resposta nulável, status, timestamps) migrada; gateway base registrado (aceita conexão, sem handlers).
- Services de domínio reutilizáveis: `Users`, `Projects`, `Experiences`, `Technologies`, `Educations`; `GET /users/profile` público; lists públicos paginados.
- `ValidationPipe` global + `GlobalExceptionFilter` em `backend/src/main.ts`; Scalar em `/docs`.

## 5. Existing Behavior

Reutilizado sem mudança: `LlmProvider` (timeout e erro tipado; stream onde couber), services de domínio (mesmos dados da home), boot com Redis conectado, gateway base aceitando conexão.

## 6. Functional Requirements

### FR-01 — Gateway com envio de pergunta e push de resposta

O gateway Socket.IO recebe a pergunta e empurra, no canal do visitante (filtrado pelo cookie anônimo): tokens durante a geração, conclusão ao final, ou erro tratado quando algo falha.

**Por que precisa:** a resposta chega quando pronta, não na hora do envio; request bloqueante prende a conexão e não comporta atualização posterior. Socket mantém o canal aberto e o filtro por visitante garante que cada um só recebe o seu atendimento.

### FR-02 — Pergunta validada no recebimento

Toda pergunta é validada antes de qualquer processamento: obrigatória, string não vazia (só espaços conta como vazia), máximo 2000 caracteres (ASSUMPTION-01). Pergunta inválida não entra na fila nem chega ao provider: o servidor responde no evento de resposta, como se fosse a IA, com o texto de assunto inválido — proposta inicial: "Desculpe, só respondo perguntas sobre experiência, projetos, habilidades e formação."

**Por que precisa:** socket não passa pelo `ValidationPipe` do HTTP; sem validação própria, lixo entra na fila e no modelo ou quebra a montagem do prompt. Cada geração tem custo (tempo de modelo); barrar a inválida antes de tudo evita pagar esse custo à toa. E responder como a IA (em vez de erro seco) mantém o mesmo formato de mensagem nos dois casos, sem bifurcar o contrato.

### FR-03 — Pergunta válida persiste pendente e entra na fila sem bloquear

Pergunta válida cria imediatamente o registro da resposta com status pendente (com o `visitorId` do cookie) e um job na fila de geração. O envio retorna rápido, sem esperar a inferência.

**Por que precisa:** geração leva dezenas de segundos; sem fila, o atendimento prende recurso até o modelo terminar e perguntas simultâneas se enfileiram no escuro. Persistir o pendente na hora dá rastro (o que foi pedido, em que estado está) e desacopla recebimento de inferência.

### FR-04 — Worker gera em stream e empurra tokens até concluir

O worker consome o job: remonta o contexto chamando os **services de domínio existentes** (perfil + projetos + experiências + habilidades + formação, sem queries novas nem regra duplicada), gera em stream via provider, empurra cada token pelo socket à medida que chega e, ao final, atualiza o registro (concluída com o texto completo) e empurra o evento de conclusão. Falha no meio do stream → registro em falha e evento de erro (texto parcial descartado, nunca entregue como resposta).

**Por que precisa:** montar o contexto na execução (não no recebimento) usa os dados mais frescos; tokens progressivos dão vida durante a espera longa em vez de silêncio até o fim; o evento de conclusão ancora a verdade (texto completo) mesmo que algum token se perca; e parcial nunca vale como resposta para não entregar meia verdade como definitiva.

### FR-05 — Geração passa pelo `LlmProvider`, incluindo stream

Toda geração (só existe via worker) usa o `LlmProvider`: resposta única via `chat()` onde couber, tokens via geração em stream do provider. Nenhum código novo fala HTTP com o Ollama diretamente.

**Por que precisa:** um ponto único permite limitar, observar e mockar tudo num só lugar — inclusive o stream (chunks, conclusão, corte); bypass duplicaria timeout, erro e testes em duas formas de gerar.

### FR-06 — Falha vira evento de erro e status, nunca queda

Modelo fora do ar, modelo ausente, timeout, resposta malformada ou fila indisponível: o registro vai para falha e o socket recebe evento de erro com mensagem amigável (códigos §9). Conexão segue aberta, resto do backend intacto.

**Por que precisa:** o LLM é o elo mais frágil (processo externo, pode estar parado); sem fallback, cada falha do modelo vira atendimento perdido sem rastro. Com status persistido, dá para saber depois o que falhou.

### FR-07 — Timeout da fundação em toda geração

Toda geração respeita `OLLAMA_TIMEOUT_MS` (60s default). Estouro marca falha e emite evento de erro de timeout.

**Por que precisa:** com geração levando dezenas de segundos, o timeout separa "demorou" de "travou o worker". Reutiliza o mecanismo provado, sem reinventar.

### FR-08 — Cada job é entregue uma vez ao worker

A fila entrega cada job de pergunta exatamente uma vez para processamento (sem duplicar geração, sem perder job silenciosamente).

**Por que precisa:** gerar duas vezes a mesma pergunta é pagar duas vezes o custo de modelo; perder job é pendente eterno sem resposta. Entrega única é o contrato mínimo entre envio rápido (FR-03) e geração assíncrona (FR-04).

### FR-09 — Contrato dos eventos documentado

Direções, eventos e payloads do §9 documentados onde o projeto documenta contrato de tempo real (README do backend, junto ao setup da IA). Sem inventar sistema novo de docs.

**Por que precisa:** socket não aparece no Scalar/OpenAPI; sem contrato escrito, o consumidor integra no escuro e cada lado inventa um formato.

## 7. Business Rules

### BR-01 — Idioma da resposta

Resposta sempre em pt-BR, independente do idioma da pergunta.

**Por que:** portfólio de profissional brasileiro para recrutadores brasileiros; consistência de idioma é regra de produto.

### BR-02 — LLM nunca acessa banco nem executa SQL

O LLM recebe só o texto montado pelo backend. Não existe ferramenta do tipo `executeSql`.

**Por que:** prompt injection é barato e um LLM com SQL transforma pergunta maliciosa em vazamento ou destruição de dados.

### BR-03 — Dado recuperado é dado, não instrução

Textos do banco (bio, descrições) entram como contexto, nunca como instrução de sistema; a instrução de sistema é fixa em código.

**Por que:** sem a separação, um texto cadastrado no próprio portfólio poderia sequestrar o comportamento do assistente.

### BR-04 — Segredo nenhum trafega pelo socket

Sem chave, URL interna ou segredo em evento, log, payload ou job; a chamada ao LLM parte do backend.

**Por que:** tudo que chega ao cliente é público; job e log são persistentes.

### BR-05 — Só pergunta válida gera job

Inválida resolve na hora (FR-02) e nunca entra na fila.

**Por que:** fila e modelo são recurso lento e caro; enfileirar o que já se sabe inválido é desperdício com rastro inútil.

## 8. User Flow

Fluxo pelo canal (sem implementação):

1. Visitante conecta (cookie anônimo gerado no primeiro contato quando ausente) e envia pergunta.
2. Servidor valida: inválida → resposta como a IA (texto de assunto inválido), fim.
3. Válida → registro pendente criado + job enfileirado; envio concluído sem esperar.
4. Worker: remonta contexto, gera em stream empurrando tokens e, ao concluir, atualiza registro e empurra o evento de conclusão — ou marca falha e empurra erro (sem conclusão).
5. Canal segue aberto para a próxima pergunta (cada pergunta é independente — sem memória entre elas).

## 9. API Contract

Contrato comportamental (nomes exatos dos eventos o PLAN fixa):

- Conexão: cliente abre canal Socket.IO com o backend (cookie anônimo filtra por visitante).
- Envio: evento de pergunta com `{ "message": "onde você trabalhou com NestJS?" }`; o envio conclui rápido, sem aguardar a inferência.
- Resposta: evento de resposta com `{ "answer": "..." }` em pt-BR — vale para texto gerado e para o texto de assunto inválido, no mesmo formato.
- Token (só geração real): evento de token com `{ "delta": "..." }` por pedaço gerado.
- Conclusão (só geração real): evento de conclusão com `{ "answer": "texto completo" }`; sem conclusão, não há resposta válida — texto parcial nunca vale como resposta.
- Erro: evento de erro com `{ "code": "MODEL_UNAVAILABLE" | "TIMEOUT" | "QUEUE_UNAVAILABLE", "message": "..." }` (amigável, sem stack, sem segredo).
- Encerramento: erro nunca fecha a conexão; só o cliente (ou queda de rede) a encerra.

## 10. Data Requirements

Tabela `chat_message` da spec 021 (já migrada): `visitorId` (texto opaco), pergunta, resposta (nulável), status (`pending` → `done` | `failed`), timestamps. Sem migration nova nesta SPEC. Sem threads, sem conversas: uma linha por pergunta; nada além do id anônimo sobre quem pergunta.

## 11. Validation

`message` obrigatória, string não vazia, máximo 2000 caracteres (ASSUMPTION-01); violação retorna o texto de assunto inválido no evento de resposta (FR-02), sem fila e sem provider. Sem filtro de conteúdo (moderação não foi pedida).

## 12. Authorization

Canal aberto, sem conta. Cookie anônimo com identificador opaco gerado no primeiro contato; filtra o canal por visitante (cada um só recebe os próprios eventos). Sem cadastro, sem dado pessoal, sem vínculo com o login do dono.

## 13. Error Scenarios

- Modelo fora do ar / ausente → evento `MODEL_UNAVAILABLE`, registro em falha.
- Timeout (`OLLAMA_TIMEOUT_MS`) → evento `TIMEOUT`, registro em falha.
- Resposta malformada do provider → `MODEL_UNAVAILABLE`, registro em falha.
- Falha no meio do stream → evento de erro correspondente, sem evento de conclusão, registro em falha, texto parcial descartado.
- Fila indisponível na hora de enfileirar → evento `QUEUE_UNAVAILABLE`, sem pendente eterno.
- Env do provider inválida → coberta pela fundação (falha na subida).

## 14. Security Requirements

- BR-02 e BR-03 (sem SQL via LLM; contexto é dado).
- BR-04 (sem segredo em evento/log/payload/job).
- Sem dependência nova além de socket.io + BullMQ (instalados na 021); sem painel admin exposto, sem prioridade que fure atendimento.

## 15. Performance / Concurrency Requirements

Timeout em toda geração (FR-07); a fila absorve picos ordenando atendimentos, sem exigir paralelismo nem prometer latência. Sem pool, sem cache: a inferência é o gargalo, não o canal nem a fila.

## 16. Tests / Expected Behaviors

Comportamentos a proteger (sem código de teste aqui):

- Orquestração (worker) com provider mockado: monta contexto, gera em stream, empurra tokens e conclusão, atualiza registro; falha (inclusive no meio do stream) → status falha + erro tratado, sem conclusão (nunca exceção crua, nunca parcial como resposta).
- Persistência: válida cria pendente + job (com `visitorId`); inválida não cria job e não chama provider.
- E2E com cliente `socket.io-client` real contra app de teste, Redis de teste, HTTP do Ollama stubado em chunks: pergunta válida → pendente criado, tokens e conclusão com texto real; corte no meio → erro sem conclusão; vazia/longa → texto de assunto inválido sem HTTP chamado; queda simulada → `MODEL_UNAVAILABLE`; timeout simulado → `TIMEOUT`.
- Nada na suíte depende de LLM real, Redis com dados, rede externa ou timing real.

## 17. Documentation Impact

- Contrato do §9 + verificação documentados no README do backend (junto ao setup da IA) — FR-09.
- Sem migration nova; `.env.example` intacto (tudo já existe da 020/021).

## 18. Acceptance Criteria

### AC-01 — Pergunta válida respondida com dados reais

Given: backend + Ollama com modelo + Redis no ar, banco com dados.
When: cliente socket envia `{ "message": "onde você trabalhou com NestJS?" }`.
Then: registro pendente criado de imediato; durante a geração, eventos de token; ao concluir, evento de conclusão com o texto completo em pt-BR citando dado real.

### AC-02 — Mensagem inválida respondida como a IA, sem fila nem provider

Given: canal aberto.
When: envio de `{ "message": "" }` (ou só espaços, ou acima do limite).
Then: evento de resposta com o texto de assunto inválido; nenhum job criado; HTTP do Ollama nunca chamado.

### AC-03 — Queda do modelo degrada com graça

Given: Ollama parado.
When: pergunta válida (job executa e falha).
Then: evento `MODEL_UNAVAILABLE` amigável, registro em falha, conexão aberta, demais rotas OK.

### AC-04 — Timeout vira evento, não atendimento pendurado

Given: provider que nunca responde, ou que para no meio do stream (simulados).
When: pergunta válida.
Then: evento `TIMEOUT` dentro do timeout configurado, sem evento de conclusão, registro em falha.

### AC-05 — Dado novo aparece sem passo manual

Given: projeto cadastrado via CRUD existente.
When: pergunta sobre ele em seguida (contexto remontado na execução).
Then: a resposta considera o dado novo.

### AC-06 — Envio não bloqueia

Given: modelo ocupado gerando (ou lento).
When: segunda pergunta válida é enviada.
Then: o envio conclui rápido com pendente criado e job enfileirado, sem esperar a primeira terminar.

### AC-07 — Fila indisponível não cria pendente órfão

Given: Redis parado.
When: pergunta válida.
Then: evento `QUEUE_UNAVAILABLE`; nenhum pendente eterno sem job correspondente.

### AC-08 — Contrato documentado e reproduzível

Given: README atualizado.
When: ler a seção do contrato e reproduzir com cliente socket qualquer.
Then: direções, eventos e payloads batem com o §9.

## 19. Assumptions

### ASSUMPTION-01 — Limite de 2000 caracteres

Descrição: `message` com no máximo 2000 caracteres.
Justificativa: pergunta sobre portfólio cabe com folga; limite contém custo/latência e abuso trivial.
Impacto caso esteja errada: ajuste de constante, sem mudar mais nada.

### ASSUMPTION-02 — Timeout e modelo herdados da fundação

Descrição: valem `OLLAMA_TIMEOUT_MS` (60s) e `OLLAMA_CHAT_MODEL` da 020, sem var nova.
Justificativa: já validados e provados; var nova para o mesmo conceito seria duplicação.
Impacto caso esteja errada: ajuste de env, sem código.

### ASSUMPTION-03 — Job carrega só o id; contexto na execução

Descrição: o job leva o identificador do registro; o worker recarrega a pergunta e monta o contexto na hora de gerar.
Justificativa: dados mais frescos (AC-05) e payload mínimo na fila.
Impacto caso esteja errada: nenhum contratual — só frescura de dados.

### ASSUMPTION-04 — Prompt exato é detalhe de implementação

Descrição: texto do system prompt e parâmetros de geração ficam a critério da implementação, respeitando BR-01..BR-03.
Justificativa: ajuste reversível que não muda contrato; engessar trava iteração.
Impacto caso esteja errada: só qualidade da resposta, avaliada no uso.

## 20. Definition of Done

- Pergunta válida: pendente criado + job + tokens com conclusão em pt-BR e dados reais (AC-01, AC-06).
- Inválida: resposta de assunto inválido, sem job e sem provider (AC-02, BR-05).
- Queda/timeout/fila em evento amigável com status coerente (AC-03, AC-04, AC-07).
- Contrato documentado e reproduzível (AC-08).
- `lint` + `tsc --noEmit` + `npm test` (unit/integração/e2e) + `build` verdes, sem LLM real nem Redis com dados na suíte.
- Sem segredo em evento/log/payload/job; sem SQL ao alcance do LLM.

## Final Review

### Consistency

`PASSED`

### Checked

- [x] requisitos revisados
- [x] regras de negócio revisadas
- [x] fluxos revisados
- [x] critérios de aceite revisados
- [x] conflitos com sistema atual revisados

### Remaining Issues

`Nenhuma inconsistência conhecida.`

### Review Result

`SPEC internamente consistente e pronta para aprovação.`
