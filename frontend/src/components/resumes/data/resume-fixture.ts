import type { ResumeData } from "@/types/resumes/resume.types";

export const resumeFixture: ResumeData = {
  personal: {
    name: "Samuel Vieira",
    email: "samuelvieiradasilva96@hotmail.com",
    phone: "(22) 99744-3612",
    location: "Laje do Muriaé, RJ · Remoto",
    headline:
      "Desenvolvedor Full Stack | Back-end Node.js, NestJS, PHP/Laravel | Front-end React, Next.js, Vue.js e Nuxt.js",
    summary:
      "Desenvolvedor Full Stack com 5 anos de experiência em sistemas web e APIs em produção, incluindo plataforma com 25.000+ usuários. Back-end: Node.js, NestJS, PHP, Laravel, Java e Spring Boot, com APIs REST, autenticação, integrações e regras de negócio. Front-end: React, Next.js, Vue.js e Nuxt.js, com JavaScript e TypeScript. Dados e infraestrutura: MySQL, PostgreSQL, Redis, Prisma, RabbitMQ, filas, Docker, WebSockets e testes automatizados.",
    githubUrl: "https://github.com/vieira96",
    linkedinUrl: "https://linkedin.com/in/samuel-vieira-da-silva-de-oliveira",
    portfolioUrl: "https://vieira96.github.io",
  },
  experiences: [
    {
      localId: "experience-1",
      sourceId: "experience-source-1",
      company: "Levante Lab",
      position: "Desenvolvedor de Software / Full Stack",
      description:
        "Desenvolvimento e manutenção de APIs REST e aplicações web em produção.",
      highlights: [
        "Desenvolvi e mantive APIs REST e aplicações web em produção com PHP/Laravel, Vue.js, Nuxt.js, React e Next.js.",
        "Atuei em plataforma com mais de 25.000 usuários e implementei recursos de gamificação utilizados por mais de 20.000 usuários.",
        "Construí as plataformas JOCA e VisuoLab do zero à produção, participando da implementação e manutenção dos produtos.",
        "Modelei e otimizei bancos relacionais, investigando e corrigindo gargalos de desempenho em produção.",
        "Implementei filas e processamento assíncrono com Redis, além de autenticação JWT e integrações B2B com serviços externos.",
        "Participei de testes automatizados, code reviews e práticas de qualidade e manutenção de software.",
      ],
      startedAt: "2021-05-01",
      endedAt: null,
      technologies: [
        { localId: "skill-nest", name: "NestJS", category: "BACKEND" },
        { localId: "skill-next", name: "Next.js", category: "FRONTEND" },
      ],
    },
    {
      localId: "experience-2",
      sourceId: "experience-source-2",
      company: "PUZL Place",
      position: "Desenvolvedor de Software",
      description:
        "Desenvolvimento backend com PHP e Laravel, utilizando Docker e testes automatizados.",
      highlights: [
        "Desenvolvi funcionalidades backend com PHP e Laravel para aplicações web em produção.",
        "Utilizei Docker e testes automatizados para apoiar a entrega e manutenção do sistema.",
      ],
      startedAt: "2021-04-01",
      endedAt: "2021-04-30",
      technologies: [
        { localId: "skill-ts", name: "TypeScript", category: "FRONTEND" },
        { localId: "skill-pg", name: "PostgreSQL", category: "DADOS" },
      ],
    },
  ],
  projects: [
    {
      localId: "project-1",
      sourceId: "project-source-1",
      name: "AI Portfolio",
      description:
        "Plataforma de portfólio profissional com dashboard para gerenciar perfil, experiências, projetos e tecnologias, autenticação, chat de IA com contexto dos dados do portfólio, comunicação em tempo real e editor de currículo ATS com modelos, preview ao vivo e exportação de PDF.",
      repositoryUrl: "https://github.com/vieira96/Ai-Portfolio",
      demoUrl: "https://vieira96.github.io",
      technologies: [
        { localId: "skill-next", name: "Next.js", category: "FRONTEND" },
        { localId: "skill-nest", name: "NestJS", category: "BACKEND" },
        {
          localId: "skill-ts-project",
          name: "TypeScript",
          category: "FRONTEND",
        },
        { localId: "skill-prisma-project", name: "Prisma", category: "DADOS" },
        {
          localId: "skill-postgres-project",
          name: "PostgreSQL",
          category: "DADOS",
        },
        { localId: "skill-redis-project", name: "Redis", category: "DADOS" },
        {
          localId: "skill-websockets-project",
          name: "WebSockets",
          category: "BACKEND",
        },
        { localId: "skill-docker-project", name: "Docker", category: "DEVOPS" },
      ],
    },
    {
      localId: "project-2",
      sourceId: "project-source-2",
      name: "Library API",
      description:
        "API REST com Java e Spring Boot para livros e autores, autenticação JWT, PostgreSQL, Redis, Flyway, RabbitMQ e testes automatizados.",
      repositoryUrl:
        "https://github.com/vieira96/api-livraria-java-spring-boot",
      demoUrl: "",
      technologies: [
        { localId: "skill-java", name: "Java", category: "BACKEND" },
        { localId: "skill-spring", name: "Spring Boot", category: "BACKEND" },
        { localId: "skill-jpa", name: "Spring Data JPA", category: "BACKEND" },
        { localId: "skill-jwt", name: "JWT", category: "BACKEND" },
        { localId: "skill-flyway", name: "Flyway", category: "DADOS" },
      ],
    },
    {
      localId: "project-3",
      sourceId: "project-source-3",
      name: "Library Frontend Angular",
      description:
        "Interface web para gerenciamento de biblioteca desenvolvida com Angular e autenticação JWT.",
      repositoryUrl: "https://github.com/vieira96/front-library-angular",
      demoUrl: "",
      technologies: [
        { localId: "skill-angular", name: "Angular", category: "FRONTEND" },
        {
          localId: "skill-ts-angular",
          name: "TypeScript",
          category: "FRONTEND",
        },
        { localId: "skill-jwt-angular", name: "JWT", category: "BACKEND" },
      ],
    },
    {
      localId: "project-4",
      sourceId: "project-source-4",
      name: "Notification API",
      description:
        "Microsserviço de notificações com NestJS, Prisma, PostgreSQL, RabbitMQ, Redis e Docker, consumindo eventos da API Java.",
      repositoryUrl:
        "https://github.com/vieira96/micro-service-notification-nest",
      demoUrl: "",
      technologies: [
        {
          localId: "skill-nest-notification",
          name: "NestJS",
          category: "BACKEND",
        },
        {
          localId: "skill-prisma-notification",
          name: "Prisma",
          category: "DADOS",
        },
        {
          localId: "skill-rabbitmq-notification",
          name: "RabbitMQ",
          category: "MENSAGERIA",
        },
        {
          localId: "skill-docker-notification",
          name: "Docker",
          category: "DEVOPS",
        },
      ],
    },
  ],
  educations: [
    {
      localId: "education-1",
      sourceId: "education-source-1",
      institution: "Uniasselvi",
      course: "Análise e Desenvolvimento de Sistemas",
      degree: "GRADUACAO",
      description:
        "Formação EAD em andamento, com estudos de engenharia de software, banco de dados, redes e arquitetura.",
      startedAt: "2026-06-01",
      endedAt: null,
      expectedEnd: "2029-06-01",
    },
  ],
  skills: [
    {
      localId: "skill-node",
      sourceId: "technology-18",
      name: "Node.js",
      category: "BACKEND",
    },
    {
      localId: "skill-nest",
      sourceId: "technology-1",
      name: "NestJS",
      category: "BACKEND",
    },
    {
      localId: "skill-next",
      sourceId: "technology-2",
      name: "Next.js",
      category: "FRONTEND",
    },
    {
      localId: "skill-ts",
      sourceId: "technology-3",
      name: "TypeScript",
      category: "FRONTEND",
    },
    {
      localId: "skill-js",
      sourceId: "technology-19",
      name: "JavaScript",
      category: "FRONTEND",
    },
    {
      localId: "skill-pg",
      sourceId: "technology-4",
      name: "PostgreSQL",
      category: "DADOS",
    },
    {
      localId: "skill-mysql",
      sourceId: "technology-17",
      name: "MySQL",
      category: "DADOS",
    },
    {
      localId: "skill-java",
      sourceId: "technology-5",
      name: "Java",
      category: "BACKEND",
    },
    {
      localId: "skill-spring",
      sourceId: "technology-6",
      name: "Spring Boot",
      category: "BACKEND",
    },
    {
      localId: "skill-angular",
      sourceId: "technology-7",
      name: "Angular",
      category: "FRONTEND",
    },
    {
      localId: "skill-prisma",
      sourceId: "technology-8",
      name: "Prisma",
      category: "DADOS",
    },
    {
      localId: "skill-rabbitmq",
      sourceId: "technology-9",
      name: "RabbitMQ",
      category: "MENSAGERIA",
    },
    {
      localId: "skill-docker",
      sourceId: "technology-10",
      name: "Docker",
      category: "DEVOPS",
    },
    {
      localId: "skill-redis",
      sourceId: "technology-11",
      name: "Redis",
      category: "DADOS",
    },
    {
      localId: "skill-jwt",
      sourceId: "technology-12",
      name: "JWT",
      category: "BACKEND",
    },
    {
      localId: "skill-rest",
      sourceId: "technology-20",
      name: "APIs REST",
      category: "BACKEND",
    },
    {
      localId: "skill-websockets",
      sourceId: "technology-21",
      name: "WebSockets",
      category: "BACKEND",
    },
    {
      localId: "skill-jest",
      sourceId: "technology-22",
      name: "Jest",
      category: "TESTES",
    },
    {
      localId: "skill-php",
      sourceId: "technology-13",
      name: "PHP",
      category: "BACKEND",
    },
    {
      localId: "skill-laravel",
      sourceId: "technology-14",
      name: "Laravel",
      category: "BACKEND",
    },
    {
      localId: "skill-vue",
      sourceId: "technology-15",
      name: "Vue.js",
      category: "FRONTEND",
    },
    {
      localId: "skill-nuxt",
      sourceId: "technology-16",
      name: "Nuxt.js",
      category: "FRONTEND",
    },
    {
      localId: "skill-git",
      sourceId: "technology-23",
      name: "Git/GitLab",
      category: "DEVOPS",
    },
  ],
  skillCategoryOrder: [
    "BACKEND",
    "FRONTEND",
    "DADOS",
    "DEVOPS",
    "IA",
    "METODOLOGIAS",
    "MENSAGERIA",
    "TESTES",
  ],
  sections: [
    { id: "summary", visible: true, order: 1 },
    { id: "experiences", visible: true, order: 2 },
    { id: "projects", visible: true, order: 3 },
    { id: "education", visible: true, order: 4 },
    { id: "skills", visible: true, order: 5 },
  ],
};
