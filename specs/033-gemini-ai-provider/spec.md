# SPEC 033 — Provider Gemini e cadeia de fallback de IA

## 1. Objetivo

Adicionar suporte ao Gemini API como provider de IA do backend e atualizar a
cadeia de fallback existente para usar, nesta ordem condicional:

```text
Groq (se houver chave) → Gemini (se houver chave) → Ollama
```

A troca de provider acontece quando o provider atual retornar limite de uso
(`rate_limited`) ou rejeitar o payload por tamanho (`413`). Erros de
autenticação, modelo inválido, resposta inválida ou indisponibilidade devem
continuar sendo tratados como erro do provider, sem mascaramento silencioso.

O Gemini deve ser configurável por variável de ambiente e usar um modelo com
camada gratuita por padrão, sem impedir a troca posterior do modelo. A camada
gratuita está sujeita aos limites e às regras vigentes do Google; não deve ser
tratada como cota ilimitada.

Referências oficiais:

- [Modelos Gemini](https://ai.google.dev/gemini-api/docs/models)
- [Preços e camada gratuita](https://ai.google.dev/gemini-api/docs/pricing)

## 2. Escopo

### Incluído

- provider `GeminiLlmProvider` implementando a abstração `LlmProvider` atual;
- chamada REST para `generateContent` do Gemini;
- suporte ao fluxo não streaming usado pelo currículo e pelo chat;
- suporte ao fluxo streaming usado pelo chat existente;
- extração do texto retornado em `candidates[].content.parts[].text`;
- classificação de HTTP 429 como `rate_limited`;
- classificação de HTTP 413 como `payload_too_large`, com fallback;
- classificação segura de erros de autenticação, modelo e resposta;
- variáveis `GEMINI_API_KEY`, `GEMINI_MODEL` e `GEMINI_TIMEOUT_MS`;
- inclusão condicional do Gemini na cadeia de providers;
- testes do provider, da cadeia e da validação de ambiente;
- atualização dos arquivos `.env.example` e documentação técnica necessária.

### Fora do escopo

- alteração dos prompts de currículo ou chat;
- alteração dos endpoints de IA existentes;
- persistência de conversas, currículos ou respostas do Gemini;
- criação de uma tela para escolher provider;
- fallback para erros diferentes de limite de uso e payload excedente;
- exposição da chave Gemini no frontend;
- uso de SDK externo se a chamada HTTP existente for suficiente;
- garantia de cota gratuita, disponibilidade ou preço futuro do Google.

## 3. Cadeia de providers

### Regras de composição

| Groq configurado | Gemini configurado | Cadeia resultante |
|---|---|---|
| não | não | Ollama |
| não | sim | Gemini → Ollama |
| sim | não | Groq → Ollama |
| sim | sim | Groq → Gemini → Ollama |

Uma chave é considerada configurada quando existe e não é uma string vazia.
Espaços devem ser tratados de acordo com o padrão atual de configuração; a
implementação não deve registrar o valor da chave.

### Regras de fallback

- Groq retorna limite: tentar Gemini se configurado; caso contrário, Ollama.
- Gemini retorna limite: tentar Ollama.
- Groq ou Gemini retornam HTTP 413: tentar o próximo provider configurado.
- Ollama retorna limite: propagar o erro, pois não há próximo provider.
- Provider retorna erro diferente de limite ou payload excedente: não avançar
  automaticamente na cadeia.
- O provider seguinte recebe exatamente o mesmo prompt da tentativa anterior.
- O fallback não deve duplicar ou persistir a mensagem, prompt ou currículo.
- O log de fallback deve informar somente provider/modelo de origem, destino e
  razão (`rate_limited` ou `payload_too_large`), sem chaves ou conteúdo sensível.

### Disponibilidade

`isAvailable()` deve consultar somente o primeiro provider da cadeia, mantendo
o contrato atual. A checagem não deve consumir fallback nem fazer uma chamada
para cada provider.

## 4. Configuração

### Variáveis

```env
# Gemini API (opcional — sem chave, segue para Ollama)
# Chave criada em https://aistudio.google.com/apikey
# GEMINI_API_KEY="cole-aqui-a-chave-criada-no-Google-AI-Studio"
GEMINI_MODEL="gemini-3.1-flash-lite"
GEMINI_TIMEOUT_MS=60000
```

`GEMINI_API_KEY` é opcional. `GEMINI_MODEL` deve possuir um default
configurável e `GEMINI_TIMEOUT_MS` deve possuir default positivo, seguindo o
padrão de Groq e Ollama.

O modelo default deve ser documentado como uma escolha de camada gratuita
vigente no momento da implementação, mas nunca hardcoded no provider. Caso o
Google altere disponibilidade, o usuário deve conseguir trocar apenas a
variável de ambiente.

As variáveis devem ser disponibilizadas ao container backend sem serem
expostas ao frontend. A chave nunca pode aparecer em logs, respostas HTTP,
Swagger ou mensagens de erro.

## 5. Contrato do provider Gemini

### Endpoint não streaming

```text
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
```

Request mínimo:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "prompt" }]
    }
  ]
}
```

O provider deve retornar somente o texto concatenado das partes de texto do
primeiro candidato válido:

```json
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "resposta da IA" }]
      }
    }
  ]
}
```

### Endpoint streaming

Para `chatStream`, usar o endpoint de streaming compatível do Gemini e
processar os eventos SSE, extraindo somente `candidates[].content.parts[].text`.
Eventos sem texto, eventos de abertura e evento final devem ser ignorados ou
encerrar o stream conforme o protocolo, sem gerar erro falso.

### Mapeamento de erros

| Resposta/situação | `LlmProviderError.reason` |
|---|---|
| HTTP 429 ou erro explícito de quota/rate limit | `rate_limited` |
| HTTP 401/403 | `unreachable` |
| HTTP 404 de modelo | `model_not_found` |
| HTTP 413 | `payload_too_large` |
| timeout de request | `timeout` |
| JSON inválido, candidato ausente ou texto vazio | `bad_response` |
| outros status HTTP | `bad_response` |
| falha de rede | `unreachable` |

O provider não deve confiar apenas no status para identificar limite quando o
Google retornar um erro estruturado; deve considerar o status 429 e o payload
de erro sem registrar a chave ou o prompt.

## 6. Integração com o módulo de IA

- Registrar `GeminiLlmProvider` no `AiModule`.
- Injetar o provider na composição de `ChainedLlmProvider`.
- Criar `isGeminiConfigured` no módulo de providers, seguindo
  `isGroqConfigured`.
- Preservar a abstração `LlmProvider`; não criar um serviço paralelo.
- Preservar `AiService`, controllers, prompts e contratos de currículo/chat.
- Manter o Ollama como último fallback local.
- Não alterar o comportamento quando somente Ollama estiver configurado.

## 7. Segurança e privacidade

- API key somente no backend e nas variáveis de ambiente;
- nunca incluir a chave na URL registrada por logs ou mensagens de erro;
- não registrar prompt, currículo, descrição de vaga ou resposta completa;
- não retornar detalhes internos do provider ao frontend;
- usar timeout configurável;
- não fazer fallback por erro de autenticação, para não esconder configuração
  inválida;
- não adicionar dependência externa sem necessidade.

## 8. Critérios de aceite

- **AC-01:** backend aceita `GEMINI_API_KEY` opcional.
- **AC-02:** backend aplica defaults válidos para modelo e timeout Gemini.
- **AC-03:** configuração inválida de timeout é rejeitada.
- **AC-04:** provider envia prompt ao endpoint `generateContent` correto.
- **AC-05:** provider extrai texto de respostas Gemini válidas.
- **AC-06:** resposta com múltiplas partes concatena os textos na ordem.
- **AC-07:** HTTP 429 Gemini vira `rate_limited`.
- **AC-08:** HTTP 401/403, 404, timeout e resposta inválida têm mapeamento
  determinístico.
- **AC-09:** sem Groq e com Gemini, a cadeia é Gemini → Ollama.
- **AC-10:** com Groq e Gemini, a cadeia é Groq → Gemini → Ollama.
- **AC-11:** com Groq e sem Gemini, a cadeia é Groq → Ollama.
- **AC-12:** sem Groq e sem Gemini, a cadeia é Ollama.
- **AC-13:** fallback ocorre somente em `rate_limited` ou `payload_too_large`.
- **AC-14:** Groq limitado tenta Gemini antes de Ollama quando Gemini está
  configurado.
- **AC-15:** Gemini limitado tenta Ollama.
- **AC-16:** nenhuma chave aparece em logs, erros ou respostas.
- **AC-17:** fluxo atual de chat, avaliação e geração continua usando a mesma
  abstração e não sofre alteração de contrato.
- **AC-18:** testes unitários, lint, typecheck e build backend passam.

## 9. Definition of Done

- provider implementado e registrado;
- cadeia condicional implementada e testada;
- validação de ambiente atualizada;
- `.env.example` e Docker documentados;
- respostas não streaming e streaming cobertas;
- erros e rate limit cobertos;
- nenhum segredo exposto;
- testes, lint, typecheck e build aprovados.

