'use client';

import { useEffect, useState } from 'react';
import { House, Menu, X } from 'lucide-react';

interface HeaderPublicoProps {
  name: string;
  contatoHref?: string;
  isLoggedIn?: boolean;
}

const NAV_ITEMS = [
  { id: 'sobre', href: '#sobre', label: 'Sobre' },
  { id: 'experiencia', href: '#experiencia', label: 'Experiência' },
  { id: 'stack', href: '#stack', label: 'Stack' },
  { id: 'projetos', href: '#projetos', label: 'Projetos' },
  { id: 'contato', href: '#contato', label: 'Contato' },
] as const;

export function HeaderPublico({
  name,
  contatoHref = '#contato',
  isLoggedIn = false,
}: HeaderPublicoProps) {
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      const offset = 120;
      let current: string | null = null;
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = item.id;
        }
      }
      // A última seção pode ser mais curta que a viewport: o topo dela
      // nunca cruza a linha de detecção. No fim da página, ativa a última.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) {
        current = NAV_ITEMS[NAV_ITEMS.length - 1].id;
      }
      setActive(current);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#topo"
          className="inline-flex items-center gap-2 font-mono text-sm font-medium tracking-tight text-slate-100 transition-colors hover:text-blue-300"
          aria-label="Home"
        >
          <House size={16} aria-hidden="true" />
          <span>Home</span>
        </a>

        <nav aria-label="Navegação principal" className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  onClick={() => setActive(item.id)}
                  aria-current={active === item.id ? 'true' : undefined}
                  className={`text-sm transition-colors ${
                    active === item.id
                      ? 'text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {isLoggedIn && (
          <div className="hidden lg:block">
              <a
                href="/dashboard"
                className="rounded-md border border-line px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:border-slate-500"
              >
                Dashboard
              </a>
          </div>
        )}

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-300 hover:text-slate-100 lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <nav
          id="menu-mobile"
          aria-label="Navegação móvel"
          className="border-t border-line lg:hidden"
        >
          <ul className="space-y-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  onClick={() => {
                    setMenuOpen(false);
                    setActive(item.id);
                  }}
                  className={`block rounded-md px-2 py-2 text-sm transition-colors ${
                    active === item.id
                      ? 'text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-1">
              {isLoggedIn ? (
                <a
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md border border-line px-3 py-2 text-center text-sm font-medium text-slate-100"
                >
                  Dashboard
                </a>
              ) : (
                <a
                  href={contatoHref}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md border border-line px-3 py-2 text-center text-sm font-medium text-slate-100"
                >
                  Entrar em contato
                </a>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
