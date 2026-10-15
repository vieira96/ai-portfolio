'use client';

import { useState } from 'react';
import { Pagination } from '@/components/ui/pagination';

interface ExperienciaItem {
  id: string;
  company: string;
  position: string;
  period: string;
  description: string;
  technologies: string[];
}

interface ExperienciaTimelineProps {
  items: ExperienciaItem[];
}

const PAGE_SIZE = 2;
export function ExperienciaTimeline({ items }: ExperienciaTimelineProps) {
  const [current, setCurrent] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => new Set());
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const visible = items.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  function toggleExpanded(itemId: string) {
    setExpandedItems((currentItems) => {
      const nextItems = new Set(currentItems);
      if (nextItems.has(itemId)) {
        nextItems.delete(itemId);
      } else {
        nextItems.add(itemId);
      }
      return nextItems;
    });
  }

  if (items.length === 0) {
    return (
      <section
        id="experiencia"
        aria-labelledby="experiencia-titulo"
        className="scroll-mt-20 border-t border-line"
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="font-mono text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">
            02 / Experiência
          </p>
          <h2
            id="experiencia-titulo"
            className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl"
          >
            Experiência
          </h2>
          <p className="mt-8 rounded-xl border border-line bg-surface/50 p-6 text-slate-400">
            Nenhuma experiência registrada ainda.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="experiencia"
      aria-labelledby="experiencia-titulo"
      className="scroll-mt-20 border-t border-line"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="font-mono text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">
          02 / Experiência
        </p>
        <h2
          id="experiencia-titulo"
          className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl"
        >
          Experiência
        </h2>

        <ol className="mt-8 border-y border-line">
          {visible.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const panelId = `experience-details-${item.id}`;

            return (
              <li
                key={item.id}
                className="grid gap-5 border-b border-line py-7 last:border-b-0 sm:py-8 md:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] md:gap-10"
              >
                <div>
                  <p className="font-mono text-xs font-medium tracking-wide text-blue-300">
                    {item.period}
                  </p>
                  <h3 className="mt-3 text-xl font-medium leading-snug tracking-tight text-slate-100 sm:text-2xl">
                    {item.company}
                  </h3>
                </div>

                <div>
                  <p className="text-lg font-medium tracking-tight text-slate-100">
                    {item.position}
                  </p>
                  {item.technologies.length > 0 && (
                    <ul
                      aria-label={`Tecnologias utilizadas em ${item.company}`}
                      className="mt-4 flex flex-wrap gap-2"
                    >
                      {item.technologies.map((technology) => (
                        <li
                          key={technology}
                          className="rounded-md border border-blue-300/20 bg-blue-400/5 px-3 py-1.5 font-mono text-xs text-slate-300"
                        >
                          {technology}
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.description && (
                    <div className="mt-4 border-t border-line">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                        onClick={() => toggleExpanded(item.id)}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm text-slate-200 transition-colors hover:text-blue-300"
                      >
                        <span>Responsabilidades</span>
                        <span
                          aria-hidden="true"
                          className="font-mono text-lg font-medium text-blue-300"
                        >
                          {isExpanded ? '×' : '+'}
                        </span>
                      </button>
                      <div id={panelId} hidden={!isExpanded}>
                        <p className="pb-4 text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <Pagination
          current={current + 1}
          totalPages={totalPages}
          onChange={(page) => setCurrent(page - 1)}
        />
      </div>
    </section>
  );
}
