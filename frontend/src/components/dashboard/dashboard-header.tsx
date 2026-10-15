'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { LogoutButton } from '@/components/auth/buttons/logout-button';

const links = [
  { id: 'perfil', href: '#perfil', label: 'Perfil' },
  { id: 'habilidades', href: '#habilidades', label: 'Habilidades' },
  { id: 'projetos', href: '#projetos', label: 'Projetos' },
  { id: 'experiencias', href: '#experiencias', label: 'Experiências' },
  { id: 'formacao', href: '#formacao', label: 'Formação' },
];

const linkClassName = (isActive: boolean) =>
  `rounded-full px-3 py-1.5 text-sm transition hover:text-white ${
    isActive ? 'bg-white/10 font-bold text-white' : 'text-slate-400'
  }`;

export function DashboardHeader() {
  const [active, setActive] = useState('perfil');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((element): element is HTMLElement => element !== null);
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // A última seção pode ser mais curta que a viewport e nunca cruzar a
    // faixa do observer. No fim da página, ativa a última.
    function activateLastOnBottom() {
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActive(links[links.length - 1].id);
      }
    }
    window.addEventListener('scroll', activateLastOnBottom, { passive: true });
    return () => window.removeEventListener('scroll', activateLastOnBottom);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          aria-label="Portfolio AI — voltar para a página inicial"
          className="font-bold tracking-tight text-white"
        >
          Portfolio AI
        </Link>

        <div className="flex justify-end items-center gap-4">
          <nav
            aria-label="Seções do dashboard"
            className="hidden items-center gap-1 sm:gap-2 lg:flex"
          >
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setActive(link.id)}
                aria-current={active === link.id ? 'true' : undefined}
                className={linkClassName(active === link.id)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/dashboard/curriculo"
              className="rounded-full px-3 py-1.5 text-sm text-blue-300 transition hover:bg-white/10 hover:text-white"
            >
              Currículo
            </Link>
          </nav>
          <div className="hidden lg:block">
            <LogoutButton />
          </div>
          <button
            type="button"
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
            className="rounded-lg p-2 text-slate-300 transition hover:text-white lg:hidden"
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav
          aria-label="Menu do dashboard"
          className="absolute inset-x-0 top-full border-b border-line bg-ink px-6 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.href}
                aria-current={active === link.id ? 'true' : undefined}
                onClick={() => {
                  setActive(link.id);
                  closeMenu();
                }}
                className={linkClassName(active === link.id)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/dashboard/curriculo"
              onClick={closeMenu}
              className="rounded-full px-3 py-1.5 text-sm text-blue-300 transition hover:bg-white/10 hover:text-white"
            >
              Currículo
            </Link>
            <div className="mt-2 border-t border-line pt-3">
              <LogoutButton />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
