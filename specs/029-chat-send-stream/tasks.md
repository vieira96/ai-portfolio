# TASKS: Chat widget — envio e stream reais (fase 2b)

## Status

`DRAFT`

## Sources

SPEC:
`specs/029-chat-send-stream/spec.md`

PLAN:
`specs/029-chat-send-stream/plan.md`

Premissa: histórico real ligado (027); backend no ar com CORS resolvido (028).

Regra: TDD — a task de teste vem antes da implementação (vermelho, depois verde).

---

## Tasks

### [x] TASK-01 — Teste do envio (vermelho)

#### Objective

Escrever a prova do envio antes de existir implementação.

#### Requirements

- FR-01

#### Acceptance Criteria

- AC-01 (par `pending` no `201`)
- AC-02

#### Depends On

`Nenhuma`

#### Implementation Notes

Estende `chat-widget.spec.tsx` com fetch stubado (`vi.stubGlobal` + `Response`,
padrão do repo): `201`→`pending`, `200`→resposta, `503`/rede→só toast sem par.
Os testes falham (sem implementação) — é o esperado.

#### Definition of Done

- Testes escritos e falhando pelo motivo certo (sem `POST` no código).

---

### [x] TASK-02 — Envio real via `POST` (verde)

#### Objective

Fazer os testes da TASK-01 passarem com o `POST` de verdade.

#### Requirements

- FR-01

#### Acceptance Criteria

- AC-01
- AC-02

#### Depends On

- TASK-01

#### Implementation Notes

`POST /chat/messages` com `credentials` (`201`→`pending`, `200`→resposta,
`503`/rede→só toast sem par). Input segue bloqueado no stream.

#### Definition of Done

- Suite verde (`npm test`), sem regressão; sem segredo.

---

### [x] TASK-03 — Teste do stream (vermelho)

#### Objective

Escrever a prova do stream antes de existir implementação.

#### Requirements

- FR-02

#### Acceptance Criteria

- AC-01

#### Depends On

- TASK-02

#### Implementation Notes

Módulo `socket.io-client` mockado (`vi.mock`): conecta ao abrir, tokens anexam,
`done` congela, `error` vira `failed`, desconecta ao fechar. Falham sem a
implementação — é o esperado.

#### Definition of Done

- Testes escritos e falhando pelo motivo certo.

---

### [x] TASK-04 — Stream real via socket (verde)

#### Objective

Fazer os testes da TASK-03 passarem com o socket de verdade.

#### Requirements

- FR-02

#### Acceptance Criteria

- AC-01

#### Depends On

- TASK-03

#### Implementation Notes

Instala `socket.io-client`. Conecta ao abrir com cookies (TD-01 do PLAN),
desconecta ao fechar; `token` anexa, `done` congela, `error` vira `failed` +
toast.

#### Definition of Done

- Suite verde (`npm test`); 1 socket por abertura.

---

### [x] TASK-05 — Teste do retry e da limpeza (vermelho)

#### Objective

Escrever a prova do retry e da ausência de mock antes de existir.

#### Requirements

- FR-03

#### Acceptance Criteria

- AC-03
- AC-05

#### Depends On

- TASK-04

#### Implementation Notes

Unit: retry cria par novo (não edita o falho). Checagem: nenhum import de mock
de envio no código. Falham sem a implementação — é o esperado.

#### Definition of Done

- Testes escritos e falhando pelo motivo certo.

---

### [x] TASK-06 — Retry real + deleta mock (verde)

#### Objective

Fazer os testes da TASK-05 passarem e tirar o mock do bundle.

#### Requirements

- FR-03

#### Acceptance Criteria

- AC-03
- AC-05

#### Depends On

- TASK-05

#### Implementation Notes

Retry faz novo `POST` (par novo); botão volta aos `failed`. Deleta
`streamMockReply` (e o mock inteiro se vazio).

#### Definition of Done

- Suite verde; zero referência a mock de envio; `lint` verde.

---

### [x] TASK-07 — Validação final

#### Objective

Fechar com todas as provas + cadeia verde.

#### Requirements

- FR-01
- FR-02
- FR-03

#### Acceptance Criteria

- AC-01
- AC-02
- AC-03
- AC-04
- AC-05

#### Depends On

- TASK-06

#### Implementation Notes

Demo com backend real + CORS. Cadeia: `npm run lint` + `npm run build` +
`npm test`.

#### Definition of Done

- Todas as AC-01..AC-05 verificadas; cadeia verde.
