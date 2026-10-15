# TASKS 033 — Provider Gemini e cadeia de fallback de IA

Cada task possui uma responsabilidade única. Como esta alteração é de
infraestrutura de IA, as primeiras tasks estabelecem contrato e configuração;
nenhuma task mistura provider, cadeia e testes de outro componente.

## Fase 1 — Contrato e configuração

- [x] **T1.** Atualizar o schema de ambiente com `GEMINI_API_KEY` opcional.
- [x] **T2.** Adicionar o default de `GEMINI_MODEL` ao schema de ambiente.
- [x] **T3.** Adicionar o default de `GEMINI_TIMEOUT_MS` ao schema de ambiente.
- [x] **T4.** Criar testes para a configuração opcional do Gemini.
- [x] **T5.** Criar testes para os defaults do Gemini.
- [x] **T6.** Criar testes para rejeição de timeout Gemini inválido.
- [x] **T7.** Documentar as variáveis Gemini no `backend/.env.example`.
- [x] **T8.** Expor as variáveis Gemini no ambiente do serviço backend do Docker.
- [x] **T9.** Criar `isGeminiConfigured` no módulo de providers.
- [x] **T10.** Testar a detecção de chave Gemini vazia ou preenchida.

## Fase 2 — Provider Gemini não streaming

- [x] **T11.** Criar a classe `GeminiLlmProvider`.
- [x] **T12.** Implementar a montagem da URL `generateContent` sem registrar a
  chave.
- [x] **T13.** Implementar o payload de conteúdo no formato Gemini.
- [x] **T14.** Implementar a extração de texto do primeiro candidato Gemini.
- [x] **T15.** Implementar concatenação de múltiplas partes de texto.
- [x] **T16.** Mapear HTTP 429 para `rate_limited`.
- [x] **T17.** Mapear HTTP 401 e 403 para erro de provider não recuperável.
- [x] **T18.** Mapear HTTP 404 para `model_not_found`.
- [x] **T19.** Mapear timeout e falha de rede do Gemini.
- [x] **T20.** Mapear resposta JSON inválida ou vazia.
- [x] **T21.** Testar request não streaming do Gemini.
- [x] **T22.** Testar resposta Gemini com múltiplas partes.
- [x] **T23.** Testar mapeamento de erros HTTP do Gemini.
- [x] **T24.** Testar que a chave não aparece em logs ou mensagens de erro.

## Fase 3 — Provider Gemini streaming

- [x] **T25.** Implementar a chamada `streamGenerateContent` do Gemini.
- [x] **T26.** Criar parser incremental dos eventos SSE Gemini.
- [x] **T27.** Ignorar eventos SSE sem texto.
- [x] **T28.** Encerrar o stream no evento final do Gemini.
- [x] **T29.** Mapear erros de abertura do stream Gemini.
- [x] **T30.** Testar streaming com múltiplos eventos de texto.
- [x] **T31.** Testar streaming com evento de abertura sem conteúdo.
- [x] **T32.** Testar stream inválido ou interrompido.

## Fase 4 — Composição da cadeia

- [x] **T33.** Registrar `GeminiLlmProvider` no `AiModule`.
- [x] **T34.** Injetar Gemini na composição de `ChainedLlmProvider`.
- [x] **T35.** Montar cadeia somente com Ollama quando nenhuma chave existir.
- [x] **T36.** Montar cadeia Gemini → Ollama sem chave Groq.
- [x] **T37.** Montar cadeia Groq → Ollama sem chave Gemini.
- [x] **T38.** Montar cadeia Groq → Gemini → Ollama com as duas chaves.
- [x] **T39.** Fazer fallback de Groq para Gemini quando Groq atingir limite.
- [x] **T40.** Fazer fallback de Groq para Ollama quando Gemini não estiver
  configurado.
- [x] **T41.** Fazer fallback de Gemini para Ollama quando Gemini atingir limite.
- [x] **T42.** Propagar erro do Ollama quando a cadeia estiver esgotada.
- [x] **T43.** Impedir fallback automático para erros diferentes de limite.
- [x] **T44.** Preservar `isAvailable` consultando somente o primeiro provider.
- [x] **T45.** Atualizar log da ordem dos providers sem dados sensíveis.
- [x] **T46.** Testar todas as combinações de configuração da cadeia.
- [x] **T47.** Testar fallback sequencial no modo não streaming.
- [x] **T48.** Testar fallback sequencial no modo streaming.
- [x] **T49.** Testar que o mesmo prompt é enviado ao fallback.

## Fase 5 — Regressão e validação

- [x] **T50.** Rodar testes existentes do módulo de IA.
- [x] **T51.** Rodar testes de regressão do chat com Ollama.
- [x] **T52.** Rodar testes de regressão do chat com Groq.
- [x] **T54.** Rodar testes de regressão da geração de currículo.
- [x] **T55.** Rodar lint do backend.
- [x] **T56.** Rodar typecheck do backend.
- [x] **T57.** Rodar build de produção do backend.
- [ ] **T58.** Validar manualmente uma requisição usando Gemini.
- [ ] **T59.** Validar manualmente fallback Groq → Gemini com limite simulado.
- [ ] **T60.** Validar manualmente fallback Gemini → Ollama com limite simulado.
- [x] **T61.** Revisar logs para confirmar ausência de chaves e prompts.
- [x] **T62.** Atualizar SPEC, PLAN e TASKS com os resultados finais.

> T58 foi tentada após recriar o container com a chave configurada, mas a
> chamada real ao Gemini expirou por timeout na rede Docker. T59 e T60 ficam
> pendentes até haver conectividade real com os providers; os cenários
> equivalentes já estão cobertos pelos testes automatizados da cadeia.

## Critérios de conclusão

- [ ] Gemini configurável sem quebrar instalação somente com Ollama.
- [ ] Cadeia respeita Groq → Gemini → Ollama quando as duas chaves existem.
- [ ] Providers ausentes são pulados sem erro de configuração.
- [ ] Fallback acontece em rate limit ou payload excedente (`HTTP 413`).
- [ ] Chat, avaliação e geração continuam usando o mesmo `LlmProvider`.
- [ ] Chaves e prompts não aparecem em logs ou respostas.
- [ ] Testes, lint, typecheck e build aprovados.
