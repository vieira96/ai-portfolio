# Spec 014 — Erro de Validação Some ao Corrigir o Campo

## Contexto

Todos os formulários validam com zod apenas no submit (`safeParse` em `handleSubmit`) e guardam em `fieldErrors`. Se o usuário digita no campo que está com erro e o corrige, a mensagem antiga continua exibida até o próximo submit.

## Requisitos

- **R1.** Ao alterar um campo com erro, limpar o erro **daquele campo** na hora (mantém os demais). Validação completa continua só no submit.
- **R2.** Escopo: `ProjectModal`, `ExperienceModal`, `AddSkillModal`, `ProfileForm`, `LoginForm` — todos os campos validados por schema.
- **R3.** Testes: submete inválido (erro aparece) → digita valor válido → erro do campo some sem novo submit; erros de outros campos permanecem.
- **R4.** Validação: `npm run lint` + `npx tsc --noEmit` + `npm test` + `npm run build` verdes.

## Fora de escopo

- Revalidar o form inteiro a cada tecla (só limpa o erro do campo editado).
- Mudar regras/schemas — só o comportamento de limpeza.
