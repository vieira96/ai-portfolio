# PLAN: Chat IA — implementação (gateway, worker, eventos)

## Status

`READY`

## Source Spec

`specs/022-ai-chat-backend/spec.md` (APPROVED)

## 1. Implementation Strategy

Premissa de entrada: a 021 está executada (deps, `REDIS_URL` lida, `chat_message` migrada, gateway base registrado). Verificar isso antes de começar; se faltar, parar. Sobre essa base: estender o provider com stream, criar repository + service (validar, persistir pendente, enfileirar, montar contexto), gateway com handlers (cookie, rooms, eventos fixos) e processor BullMQ (consome, gera em stream, empurra, atualiza status). Testes com provider mockado e HTTP stubado em chunks; Redis e Postgres efêmeros no e2e.

## 2. Existing Components to Reuse

Somente reais:

- Base 021: `socket.io` + adaptador, `bullmq`/`@nestjs/bullmq`/`ioredis`, `REDIS_URL` no schema, `chat_message` migrada, gateway base, fila `chat-generation`.
- `LlmProvider` (`chat()`, `LlmProviderError` com `reason`, timeout) em `backend/src/modules/ai/providers/` — estender, não duplicar.
- Services de domínio para o contexto (nomes exatos a confirmar via levantamento antes de codar — padrão `*Service` com métodos públicos de leitura usados pela home).
- Padrão repository (`PrismaService`, métodos `*WithRelations` quando há relação — aqui CRUD simples) para `ChatMessage`.
- `randomUUID` de `node:crypto` para o cookie anônimo; flags de cookie espelhando `AuthService.buildCookieOptions()` (`httpOnly`, `sameSite: 'lax'`, `secure` em produção).
- Helper e2e (`setupTestApp`/`teardownTestApp`) + Redis efêmero (padrão da 021) + `socket.io-client` (dev, da 021).

## 3. Components Affected

- `backend/src/modules/ai/providers/` (método de stream no provider + interface).
- `backend/src/modules/chat/`: gateway (handlers), service (validação, pendente, enqueue, contexto), repository (`chat_message`), processor (worker), `chat.module.ts` (imports de domínios + exports).
- `backend/README.md` (contrato §9 da SPEC).
- E2E novo do ciclo (`chat.e2e-spec.ts` ou extensão do da 021 — decisão do executor, sem duplicar o de setup).

## 4. Backend Changes

```text
backend/src/modules/chat/
├── chat.module.ts            (BullModule já configurado na 021 + imports de domínio)
├── chat.e2e-spec.ts
├── gateways/
│   └── chat.gateway.ts       (cookie, rooms, chat:send → service)
├── services/
│   └── chat.service.ts       (validar, persistir pendente, enqueue, contexto, conclusão/falha)
├── repositories/
│   └── chat-message.repository.ts
└── processors/
    └── chat-generation.processor.ts  (@Processor('chat-generation'))
```

- Eventos fixos (SPEC manda o PLAN fixar): cliente envia `chat:send` (`{ message }`); servidor empurra `chat:answer` (`{ answer }`, gerado ou texto de assunto inválido), `chat:token` (`{ delta }`), `chat:done` (`{ answer }` completo), `chat:error` (`{ code, message }`).
- Cookie: middleware de handshake lê o cookie, gera `uuid` quando ausente ou malformado e o fixa na resposta do handshake (exige transporte polling habilitado — default do Socket.IO, não desabilitar).
- Room por conexão: `visitor:{visitorId}`; worker empurra via gateway (`server.to(room).emit`) — room estável entre reconnects, ao contrário do socket id (TD-03).
- `LlmProvider` ganha `chatStream(prompt): AsyncGenerator<string>`; `OllamaLlmProvider` implementa com `stream: true` (NDJSON por linhas); `chat()` existente intacto (testes da 020 seguem passando).
- Processor: job `{ messageId }` → recarrega pergunta (ASSUMPTION-03) → monta contexto → `for await` tokens (emite cada um) → `done` + registro concluído; `LlmProviderError`/timeout → falha + erro (parcial descartado); chama o gateway diretamente (mesmo processo — TD-05).
- Enqueue com compensação: service cria o pendente e então enfileira; se o enqueue lançar (Redis fora), marca o registro como falha e emite `QUEUE_UNAVAILABLE` — nunca pendente órfão.
- Service monta contexto só com services de domínio (TD-06); sem queries novas.
- Retorno discriminado do service: inválida → texto pronto (gateway emite `chat:answer`, sem persistir nem enfileirar); válida → pendente + job.
- BullMQ nos defaults (sem retry/backoff custom, sem concorrência custom — TD-07).

## 5. Frontend Changes

Nenhuma.

## 6. Database Changes

Nenhuma migration nova (tabela da 021). Escrita/leitura via repository novo, seguindo o padrão dos demais.

## 7. API Changes

Nenhuma rota HTTP nova. Contrato = eventos §9 da SPEC (nomes na §4 acima).

## 8. Authorization / Security Implementation

Canal aberto + cookie anônimo (SPEC §12): `uuid` opaco, flags do padrão do auth, sem dado pessoal, sem vínculo com login. Sem segredo em evento/log/payload/job (BR-04); prompt fixo em código (BR-03); sem SQL ao LLM (BR-02).

## 9. Performance / Concurrency Requirements

Timeout da fundação em toda geração; fila ordena picos (defaults, sem promessa de paralelismo). Sem pool/cache.

## 10. Error Handling

Mapeamento existente do provider (`unreachable`/`model_not_found`→`MODEL_UNAVAILABLE`, `timeout`→`TIMEOUT`, malformado→`MODEL_UNAVAILABLE`); fila indisponível no enqueue → `QUEUE_UNAVAILABLE` sem pendente órfão; worker nunca deixa exceção crua escapar (vira falha + erro). Conexão nunca cai por erro de atendimento.

## 11. Tests Strategy

Testes escritos junto à implementação, colocados como o repo:

- Unit: provider stream (chunks, `stream: true`, corte → erro tipado); service (validação inválida/válida, pendente + job com `visitorId`, enqueue falhando → falha + `QUEUE_UNAVAILABLE` sem órfão, contexto chama services, conclusão/falha atualizam registro); processor com provider/gateway/repositório mockados (tokens empurrados em ordem, `done` com texto completo, falha mid-stream sem `done`); gateway (cookie gerado quando ausente/malformado, room por visitante).
- E2E: `socket.io-client` real + Redis/PG efêmeros + HTTP do Ollama stubado em chunks NDJSON: válida → pendente + tokens + conclusão real; corte → erro sem conclusão; inválida → texto de assunto inválido sem HTTP; queda → `MODEL_UNAVAILABLE`; timeout simulado → `TIMEOUT`. Sem LLM real, sem rede, sem timing real.
- Validação: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`.

## 12. Documentation Updates

- `backend/README.md`: seção de contrato (direções, eventos, payloads do §9 da SPEC) + verificação com cliente qualquer.

## 13. Implementation Order

0. Verificar saídas da 021 (deps, tabela, gateway base, `REDIS_URL`); se faltar, PARAR.
1. Stream no provider (`chatStream` + unit).
2. Repository + service (validar/persistir/enqueue/contexto) + unit.
3. Gateway (cookie/rooms/handlers) + processor (consumir/empurrar) + unit.
4. README com o contrato.
5. E2E do ciclo + cadeia final.

## 14. Technical Decisions

### TD-01 — Nomes de eventos

Problema: a SPEC deixa os nomes para o PLAN. Decisão: `chat:send`, `chat:answer`, `chat:token`, `chat:done`, `chat:error`. Motivo: prefixo único evita colisão; nomes descrevem direção. Trade-off: nenhum relevante (reversível com versionamento se um dia mudar).

### TD-02 — Cookie no handshake, polling habilitado

Problema: onde gerar/fixar o cookie anônimo. Decisão: middleware de handshake (lê, gera `uuid` quando ausente ou malformado, fixa na resposta); manter transporte polling habilitado (default). Motivo: único ponto onde há resposta HTTP para `Set-Cookie`. Trade-off: depende do polling inicial (default do Socket.IO; desabilitá-lo quebraria o cookie).

### TD-03 — Rooms por visitante, não socket id

Problema: como endereçar o push. Decisão: room `visitor:{id}`, `server.to(room).emit`. Motivo: socket id muda no reconnect; room sobrevive e realiza o "filtrar o canal". Trade-off: nenhum relevante.

### TD-04 — Stream como `AsyncGenerator`

Problema: forma da API de stream. Decisão: `chatStream(prompt): AsyncGenerator<string>` (stdlib, `for await`). Motivo: sem dep nova, mock trivial nos testes. Trade-off: sem operadores reativos (desnecessários aqui).

### TD-05 — Worker chama o gateway diretamente

Problema: como o push sai do worker. Decisão: processor injeta o gateway e chama método de emissão. Motivo: mesmo processo, chamada direta; QueueEvents seria infra a mais sem consumidor. Trade-off: acoplamento worker→gateway explícito e testável via mock.

### TD-06 — Contexto via services de domínio

Problema: de onde vêm os dados do contexto. Decisão: services (não repositories). Motivo: SPEC FR-04 exige services; shapes iguais aos da home, sem divergência. Trade-off: importa módulos de domínio (uma direção, sem ciclo).

### TD-07 — BullMQ nos defaults

Problema: retry/concorrência custom. Decisão: defaults (sem retry custom, sem concorrência custom). Motivo: SPEC não exige; retry de geração de 60s custa caro e mascara falha. Trade-off: falha transitória vira erro imediato (comportamento visível e honesto).

## 15. Things We Will NOT Do

- Memória/threads, moderação, rate-limit, Bull Board.
- Retry/backoff custom, prioridades, agendamento, segunda fila.
- Endpoint HTTP de chat, fallback polling manual, frontend.
- Migration nova, índices novos, seed.
- Refactor de módulos existentes além de importar.

---

## Final Review

### Consistency

`PASSED`

### Checked

- [x] compatibilidade com SPEC
- [x] compatibilidade com projeto real
- [x] arquitetura revisada
- [x] backend revisado
- [x] banco revisado
- [x] segurança revisada
- [x] estratégia de testes revisada
- [x] overengineering revisado

### Deviations from SPEC

`Nenhuma.`

### Known Risks

- Execução exige a 021 pronta (premissa §1/ordem 0); sem ela, parar antes de codar.
- Nomes de services/métodos de domínio a confirmar no código antes de codar (levantamento da ordem 0); se algum padrão divergir, adaptar sem mudar a SPEC.

### Review Result

`PLAN consistente com a SPEC aprovada e com o estado atual conhecido do projeto.`
