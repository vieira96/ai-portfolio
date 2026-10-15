# Spec 010 — Seleção de Skills por Chips + Payload com `id` Opcional

## Contexto

O `SkillsSelection` é um input de texto separado por vírgula e o backend recebe `[{name, category}]` fazendo upsert sempre (`specs 004/005/007`). Proposta: exibir chips (2 no desktop, 1 no mobile + "+N") e o backend receber `[{id?, name, category}]` — com `id` só vincula, sem `id` cria via upsert (o `unique(name)` protege).

## Requisitos

- **R1 — Backend.** `ProjectSkillInput` ganha `id?: string` (`@IsUUID()` + `@IsOptional()`); `resolveSkillIds`: com `id` usa direto sem lookup (confia; `id` inválido falha na FK); sem `id` faz `upsert` por nome como hoje. Cobre create + update (via `PartialType`). Testes unitários: passthrough de `id`, misto, criação via upsert.

- **R2 — `SkillsSelection`.** Exibe até 2 chips no desktop / 1 no mobile (breakpoint fixo via classes) + "+N" clicável (abre o dropdown); label "Selecione ou digite uma ou mais skills"; digitação no `CommandInput` do popover (opções inalteradas); texto sem match entra em criação; skill nova sem categoria exibe chip neutro; desselecionar por X no chip e por toggle no dropdown (`selectedNames` derivado, `data-checked`); só `onSelect`; `CommandEmpty`; dropdown segue aberto.

- **R2.1 — Textos do combobox.** Label passa para "Selecione ou digite uma ou mais habilidade(s)"; placeholder da busca passa para "Buscar ou criar habilidade"; estado vazio (busca sem match) exibe "Habilidade nova" em vez de "Nenhuma skill encontrada.".

- **R3 — `ProjectModal`.** Monta payload `[{id?, name, category}]` da seleção estruturada (novas via fluxo `NewSkillsModal`); resto do fluxo inalterado.

- **R4 — Validação.** `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes; specs atualizados; checagem visual (chips, +N, mobile, dropdown, chip neutro).

## Fora de escopo

- Limite máximo de skills, ordenação, drag-and-drop de chips.
- Mudar submit/categorização além do payload.
- Reformulação visual além dos chips.
