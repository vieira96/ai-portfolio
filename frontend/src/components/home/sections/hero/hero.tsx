import { ArrowDown } from 'lucide-react';

interface HeroProps {
  name: string;
  headline: string;
  githubUrl?: string;
  linkedinUrl?: string;
  demoUrl?: string;
  contatoHref?: string;
}

export function Hero({
  name,
  headline,
  githubUrl,
  linkedinUrl,
  demoUrl,
  contatoHref = '#contato',
}: HeroProps) {
  return (
    <section id="topo" aria-labelledby="hero-nome">
      <div className="mx-auto w-full max-w-6xl px-4 pt-24 pb-12 sm:px-6">
        <h1
          id="hero-nome"
          className="mt-4 text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl"
        >
          {name}
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-400">
          {headline}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="#projetos"
            className="rounded-md bg-slate-100 px-5 py-2.5 text-center text-sm font-medium text-ink transition-colors hover:bg-slate-300"
          >
            Ver projetos
          </a>
          <a
            href={contatoHref}
            className="rounded-md border border-line px-5 py-2.5 text-center text-sm font-medium text-slate-100 transition-colors hover:border-slate-500"
          >
            Entrar em contato
          </a>
        </div>

        {(githubUrl || linkedinUrl || demoUrl) && (
          <p className="mt-4 font-mono text-xs text-slate-500">
            {[
              { label: 'GitHub', url: githubUrl },
              { label: 'LinkedIn', url: linkedinUrl },
              { label: 'Demo', url: demoUrl },
            ]
              .filter((link) => link.url)
              .map((link, index) => (
                <span key={link.label}>
                  {index > 0 && <span aria-hidden="true"> · </span>}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-4 hover:text-slate-300 hover:underline"
                  >
                    {link.label}
                  </a>
                </span>
              ))}
          </p>
        )}

        <a
          href="#sobre"
          aria-label="Rolar para a seção sobre"
          className="mt-10 inline-flex items-center gap-2 font-mono text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          <ArrowDown size={14} aria-hidden="true" />
          role para ver mais
        </a>
      </div>
    </section>
  );
}
