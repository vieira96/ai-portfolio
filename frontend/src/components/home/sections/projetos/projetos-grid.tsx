'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

interface ProjetoPublico {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  repositoryUrl?: string;
  demoUrl?: string;
}

interface ProjetosGridProps {
  projects: ProjetoPublico[];
}

const PAGE_SIZE = 4;

export function ProjetosGrid({ projects }: ProjetosGridProps) {
  const [current, setCurrent] = useState(1);
  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const visible = projects.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  if (projects.length === 0) {
    return (
      <section
        id="projetos"
        aria-labelledby="projetos-titulo"
        className="scroll-mt-20 border-t border-line"
      >
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="font-mono text-xs tracking-wide text-slate-500 uppercase">
            Trabalho
          </p>
          <h2
            id="projetos-titulo"
            className="mt-2 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl"
          >
            Projetos
          </h2>
          <p className="mt-6 max-w-2xl text-slate-400">
            Nenhum projeto publicado ainda.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="projetos"
      aria-labelledby="projetos-titulo"
      className="scroll-mt-20 border-t border-line"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="font-mono text-xs tracking-wide text-slate-500 uppercase">
          Trabalho
        </p>
        <h2
          id="projetos-titulo"
          className="mt-2 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl"
        >
          Projetos
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visible.map((project) => {
            return (
              <article
                key={project.id}
                aria-labelledby={`projeto-${project.id}`}
                className="flex flex-col rounded-lg border border-line bg-surface p-5"
              >
                <h3
                  id={`projeto-${project.id}`}
                  className="text-base font-semibold text-slate-100"
                >
                  {project.name}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">
                  {project.description}
                </p>

                {project.technologies.length > 0 && (
                  <ul
                    aria-label={`Habilidades de ${project.name}`}
                    className="mt-4 flex flex-wrap gap-1.5"
                  >
                    {project.technologies.map((tech) => (
                      <li
                        key={tech}
                        className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-slate-400"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                )}

                {(project.repositoryUrl ?? project.demoUrl) && (
                  <div className="mt-4 flex flex-wrap gap-2 pt-1">
                    {project.repositoryUrl && (
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Repositório de ${project.name} no GitHub`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100"
                      >
                        GitHub
                      </a>
                    )}
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Demo de ${project.name}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100"
                      >
                        <ExternalLink size={14} aria-hidden="true" />
                        Demo
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <Pagination
          current={current}
          totalPages={totalPages}
          onChange={setCurrent}
        />
      </div>
    </section>
  );
}
