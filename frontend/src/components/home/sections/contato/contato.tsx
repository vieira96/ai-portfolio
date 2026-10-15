'use client';

import { useState } from 'react';
import { Check, Copy, Mail } from 'lucide-react';

interface ContatoProps {
  email: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export function Contato({ email, githubUrl, linkedinUrl }: ContatoProps) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = email;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section
      id="contato"
      aria-labelledby="contato-titulo"
      className="scroll-mt-20 border-t border-line"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="font-mono text-xs tracking-wide text-slate-500 uppercase">
          Contato
        </p>
        <h2
          id="contato-titulo"
          className="mt-2 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl"
        >
          Vamos conversar
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-slate-400">
          Estou disponível para novos projetos e oportunidades. O jeito mais
          rápido de me alcançar é por e-mail.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-2 font-mono text-base text-slate-100 underline-offset-4 hover:underline sm:text-lg"
          >
            <Mail size={18} aria-hidden="true" />
            {email}
          </a>
          <button
            type="button"
            onClick={() => void copyEmail()}
            aria-live="polite"
            aria-label={copied ? 'E-mail copiado' : 'Copiar e-mail'}
            className="inline-flex w-fit items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-mono text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
          >
            {copied ? (
              <>
                <Check size={14} aria-hidden="true" />
                Copiado
              </>
            ) : (
              <>
                <Copy size={14} aria-hidden="true" />
                Copiar
              </>
            )}
          </button>
        </div>

        {(githubUrl ?? linkedinUrl) && (
          <ul aria-label="Redes sociais" className="mt-6 flex flex-wrap gap-3">
            {githubUrl && (
              <li>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Perfil no GitHub"
                  className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100"
                >
                  GitHub
                </a>
              </li>
            )}
            {linkedinUrl && (
              <li>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Perfil no LinkedIn"
                  className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100"
                >
                  LinkedIn
                </a>
              </li>
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
