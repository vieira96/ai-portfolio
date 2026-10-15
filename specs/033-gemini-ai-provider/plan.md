# PLAN 033 — Provider Gemini e cadeia de fallback de IA

## 1. Estratégia

Adicionar o Gemini por trás da abstração `LlmProvider` já usada pelo backend.
O provider será implementado com `fetch`, sem SDK novo, para manter o padrão
dos providers Groq e Ollama e reduzir dependências.

A composição da cadeia será determinada no boot pelas chaves presentes:

```text
Groq? → Gemini? → Ollama
```

A cadeia só avança quando o provider atual indicar `rate_limited` ou
`payload_too_large`. Outros erros continuam sendo retornados para diagnóstico
correto.

## 2. Fases

### Fase 1 — Contrato e configuração

1. Atualizar SPEC, PLAN e TASKS.
2. Adicionar variáveis Gemini ao schema de ambiente.
3. Atualizar testes de ambiente.
4. Atualizar `.env.example` e configuração Docker.
5. Definir a função de detecção de chave Gemini.

### Fase 2 — Provider Gemini

1. Criar o provider não streaming.
2. Mapear respostas e erros Gemini.
3. Criar o provider streaming.
4. Cobrir respostas com múltiplas partes e eventos sem conteúdo.

### Fase 3 — Composição e fallback

1. Registrar o provider no módulo de IA.
2. Atualizar a seleção condicional da cadeia.
3. Manter fallback para rate limit e payload excedente.
4. Atualizar logs seguros da cadeia.
5. Cobrir todas as combinações de chaves e transições.

### Fase 4 — Validação final

1. Rodar testes unitários do provider e da cadeia.
2. Rodar lint e typecheck.
3. Rodar build backend.
4. Validar manualmente com Gemini configurado.
5. Atualizar TASKS com os resultados.

## 3. Decisões técnicas

- O provider usa a API HTTP oficial do Gemini.
- A chave fica somente no backend.
- O modelo é configurável por `GEMINI_MODEL`.
- O default deve ser um modelo com camada gratuita vigente na data da
  implementação, sem acoplar a lógica a esse nome.
- A cadeia não consulta quota previamente; ela reage ao `rate_limited` ou
  `payload_too_large` retornado pela tentativa real.
- O fallback é sequencial e não paralelo.
- O prompt é reutilizado sem transformação entre providers.
- O `AiService` permanece sem conhecimento do provider concreto.
- O Ollama continua sendo o último recurso local.

## 4. Matriz de comportamento

| Configuração | Primeira tentativa | Fallback em limite ou payload excedente |
|---|---|---|
| nenhuma chave | Ollama | erro do Ollama |
| somente Gemini | Gemini | Ollama |
| somente Groq | Groq | Ollama |
| Groq + Gemini | Groq | Gemini, depois Ollama |

## 5. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Mudança do modelo gratuito | modelo configurável por ambiente |
| Formato Gemini diferente | parser isolado e testes de contrato |
| Quota confundida com erro de auth | mapear 429 separadamente de 401/403 |
| Chave vazada na URL | nunca logar URL completa nem payload de erro |
| Fallback inesperado | avançar somente em `rate_limited` ou `payload_too_large` |
| Stream SSE incompleto | parser incremental coberto por testes |
| Falha em provider atual | preservar comportamento quando Gemini não está configurado |

## 6. Validação

Backend:

- testes do schema de ambiente;
- testes do provider Gemini com `fetch` mockado;
- testes da cadeia com Groq, Gemini e Ollama mockados;
- lint;
- typecheck/build;
- testes relevantes de IA e regressão do chat.

Não haverá alteração de banco, migration ou frontend nesta feature.

## 7. Definition of Done

- variáveis Gemini validadas e documentadas;
- provider implementado nos dois modos;
- cadeia respeita a prioridade condicional;
- fallback somente por limite ou payload excedente;
- erros não expõem segredos;
- testes de todas as combinações passam;
- lint, typecheck e build passam;
- SPEC/PLAN/TASKS consistentes.

