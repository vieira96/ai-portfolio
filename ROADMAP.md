# Roadmap

Este arquivo registra a evolução planejada do Portfolio AI Agent. A
documentação do comportamento já implementado fica nos READMEs de
`backend/` e `frontend/`; decisões detalhadas ficam em `specs/`.

## Estado atual

- [x] API NestJS com módulos de autenticação, usuários, uploads, tecnologias,
      projetos, experiências e formações
- [x] Persistência com Prisma e PostgreSQL
- [x] Migrations e seed do banco
- [x] Dashboard administrativo em Next.js
- [x] Autenticação por cookie `httpOnly`
- [x] Upload de avatar/arquivos
- [x] Chat público com histórico por visitante
- [x] Processamento assíncrono do chat com Redis e BullMQ
- [x] Streaming de eventos do chat via Socket.IO
- [x] Provedores Ollama e Groq com fallback
- [x] Documentação OpenAPI com Swagger/Scalar
- [x] Testes unitários, de integração e E2E
- [x] CI com execução paralela dos grupos E2E

## Próximas etapas

### Currículo ATS

- [x] Gerar currículo compatível com ATS a partir dos dados já cadastrados no dashboard (perfil, experiências, projetos, formações, tecnologias)
- [x] Oferecer até 3 modelos de currículo otimizados para leitura por ATS
- [x] Permitir visualizar e exportar o currículo gerado
- [x] Permitir editar tudo que aparece no currículo (nome, experiências, skills e demais campos) sem alterar os dados cadastrados

### Assistência de escrita no dashboard

- [x] Permitir solicitar à IA uma sugestão de texto mais clara e profissional para Bio, headline, descrição de experiência e descrição de projeto, com aplicação somente após confirmação da pessoa
