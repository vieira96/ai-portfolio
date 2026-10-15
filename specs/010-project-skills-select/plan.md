# Plan 010 — Seleção de Skills por Chips + Payload com `id` Opcional

## Contexto

Hoje o `SkillsSelection` é um input de texto separado por vírgula, e o backend recebe `[{name, category}]` fazendo upsert sempre. Proposta: exibir chips (2 no desktop, 1 no mobile, + "+N") e o backend receber `[{id?, name, category}]` — com `id` só vincula, sem `id` cria via upsert (o `unique(name)` protege).

## Decisão

**Backend** (`create-project.dto.ts`, cobre update via `PartialType`):
- `ProjectSkillInput` ganha `id?: string` (`@IsUUID()` + `@IsOptional()`).
- `resolveSkillIds`: com `id` → usa direto (confia, sem lookup); sem `id` → `upsert` por nome como hoje.
- Testes: passthrough de `id`, misto, criação via upsert.

**Frontend**:
- `SkillsSelection` vira exibição por chips (N visíveis + "+M") mantendo dropdown (`Popover` + `Command`) para buscar/selecionar; estado passa de texto-vírgula para seleção estruturada; `ProjectModal` monta o payload `{id?, name, category}` (novas via fluxo `NewSkillsModal`).
- Label do combobox: "Selecione ou digite uma ou mais skills".
- **R2.1** (task nova): label passa para "Selecione ou digite uma ou mais habilidade(s)"; placeholder da busca passa para "Buscar ou criar habilidade"; estado vazio exibe "Habilidade nova".
- Digitação acontece no `CommandInput` dentro do popover (lista de opções inalterada); texto sem match entra em criação (fluxo `NewSkillsModal`).
- Skill nova ainda sem categoria exibe como chip neutro no input.
- Tipos TS do submit ganham `id?` (o "schema" a mudar no front é esse + o que consome `technologies`).

## Arquivos a alterar/criar

### Backend
1. `backend/src/modules/projects/dto/create-project.dto.ts` — `id?` no input.
2. `backend/src/modules/projects/services/projects.service.ts` — `resolveSkillIds` com passthrough.
3. Specs do service (unit) — casos `id`/misto/novo.

### Frontend
4. `frontend/src/components/skills/inputs/skills-selection.tsx` (+ spec) — chips + dropdown + toggle.
5. `frontend/src/components/projects/modals/project-modal.tsx` (+ spec) — payload estruturado, fluxo categorizar preservado.
6. Tipos TS do submit (`Skill` com `id?` onde o payload é montado).

## Ordem de execução (proposta — spec + tasks a seguir)

1. **Spec + tasks** derivadas deste plano.
2. **Backend** (DTO + service + testes).
3. **Frontend** (componente + modal + testes).
4. **Validação** + checagem visual.

## Dúvidas (responder antes de implementar)

- **D1 — Onde digita skill nova?** ✅ Decidido: digitação no `CommandInput` do popover (opções inalteradas); sem match → criação; label "Selecione ou digite uma ou mais skills"; nova sem categoria → chip neutro no input.
- **D2 — Regra do "2 ou 1"?** ✅ Decidido: breakpoint fixo (2 desktop / 1 mobile via classes).
- **D3 — "+N" clicável?** ✅ Decidido: sim, abre o dropdown.
- **D4 — Desselecionar:** ✅ Decidido: ambos (X no chip e toggle no dropdown).
