# Spec 013 — Limpar Busca do Popover ao Fechar

## Contexto

No `SkillsSelection`, o texto digitado na busca (`CommandInput`, estado `search`) persiste após fechar e reabrir o popover. O `onOpenChange` do `Popover` só alterna `open` — nunca limpa a busca.

## Requisitos

- **R1.** Ao fechar o popover por qualquer caminho (`Escape`, clique fora, toggle do chevron), limpar o texto de busca (`setSearch('')`).
- **R2.** Teste: digita → fecha (`Escape`) → reabre → `CommandInput` vazio.
- **R3.** Validação: `npm run lint` + `npx tsc --noEmit` + `npm test` verdes; sem regressão no fluxo multi-seleção.

## Fora de escopo

- Mudar abertura/fechamento em si — só a limpeza do texto.
- Outros componentes.
