'use client';

import { useState } from 'react';

interface HabilidadeGroup {
  category: string;
  items: string[];
}

interface HabilidadesChipsProps {
  groups: HabilidadeGroup[];
}

export function HabilidadesChips({ groups }: HabilidadesChipsProps) {
  const [activeCategory, setActiveCategory] = useState(groups[0]?.category);
  const activeGroup = groups.find((group) => group.category === activeCategory);

  return (
    <section
      id="stack"
      aria-labelledby="stack-titulo"
      className="scroll-mt-20 border-t border-line"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">
              03 / Stack
            </p>
            <h2
              id="stack-titulo"
              className="mt-3 text-3xl font-semibold tracking-tight text-slate-100 sm:text-4xl"
            >
              Tecnologias que movem meu trabalho
              <span className="text-blue-400">.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-400 sm:text-right">
            Backend, interfaces e infraestrutura — organizados por área de
            atuação.
          </p>
        </div>

        {groups.length === 0 ? (
          <p className="mt-8 rounded-xl border border-line bg-surface/50 p-6 text-slate-400">
            Nenhuma tecnologia registrada ainda.
          </p>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface/30 md:grid md:min-h-80 md:grid-cols-[260px_1fr]">
            <nav
              aria-label="Áreas da stack"
              className="flex gap-2 overflow-x-auto border-b border-line p-3 md:flex-col md:gap-1 md:border-r md:border-b-0 md:p-3"
            >
              {groups.map((group, index) => {
                const selected = activeGroup?.category === group.category;

                return (
                  <button
                    key={group.category}
                    type="button"
                    aria-label={`${String(index + 1).padStart(2, '0')} ${group.category}`}
                    aria-pressed={selected}
                    onClick={() => setActiveCategory(group.category)}
                    className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors md:w-full ${
                      selected
                        ? 'bg-blue-400/10 text-blue-100 ring-1 ring-inset ring-blue-300/30'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                    }`}
                  >
                    <span className="font-mono text-[11px] text-blue-300/70">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="whitespace-nowrap">{group.category}</span>
                    <span
                      className="ml-auto hidden text-blue-300 md:inline"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                  </button>
                );
              })}
            </nav>

            {activeGroup && (
              <div className="flex min-h-64 flex-col justify-center p-6 sm:p-10 md:p-12">
                <p className="font-mono text-xs tracking-wide text-slate-500">
                  {'// stack / '}
                  {String(groups.indexOf(activeGroup) + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 text-2xl font-medium tracking-tight text-slate-100 sm:text-3xl">
                  {activeGroup.category}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Tecnologias e conhecimentos que utilizo nesta área.
                </p>
                <ul
                  aria-label={`Tecnologias: ${activeGroup.category}`}
                  className="mt-6 flex flex-wrap gap-2"
                >
                  {activeGroup.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-md border border-blue-300/20 bg-blue-400/5 px-3 py-2 font-mono text-xs text-slate-200"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
