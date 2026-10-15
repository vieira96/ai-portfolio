import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardHeader } from './dashboard-header';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe('DashboardHeader', () => {
  function desktopNav() {
    return screen.getByRole('navigation', { name: 'Seções do dashboard' });
  }

  function hamburger() {
    return screen.getByRole('button', { name: 'Abrir menu' });
  }

  it('renders the three section links with anchors', () => {
    render(<DashboardHeader />);

    const nav = desktopNav();
    expect(within(nav).getByRole('link', { name: 'Perfil' })).toHaveAttribute(
      'href',
      '#perfil',
    );
    expect(
      within(nav).getByRole('link', { name: 'Habilidades' }),
    ).toHaveAttribute('href', '#habilidades');
    expect(
      within(nav).getByRole('link', { name: 'Projetos' }),
    ).toHaveAttribute('href', '#projetos');
  });

  it('links the logo back to the home page', () => {
    render(<DashboardHeader />);

    expect(
      screen.getByRole('link', {
        name: 'Portfolio AI — voltar para a página inicial',
      }),
    ).toHaveAttribute('href', '/');
  });

  it('marks the first link as current initially', () => {
    render(<DashboardHeader />);

    expect(
      within(desktopNav()).getByRole('link', { name: 'Perfil' }),
    ).toHaveAttribute('aria-current', 'true');
  });

  it('opens the mobile panel with the hamburger and closes toggling', () => {
    render(<DashboardHeader />);

    expect(
      screen.queryByRole('navigation', { name: 'Menu do dashboard' }),
    ).not.toBeInTheDocument();

    fireEvent.click(hamburger());
    expect(
      screen.getByRole('navigation', { name: 'Menu do dashboard' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Fechar menu' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar menu' }));
    expect(
      screen.queryByRole('navigation', { name: 'Menu do dashboard' }),
    ).not.toBeInTheDocument();
  });

  it('switches to the compact menu below the desktop breakpoint', () => {
    render(<DashboardHeader />);

    expect(desktopNav()).toHaveClass('lg:flex');
    expect(hamburger()).toHaveClass('lg:hidden');

    fireEvent.click(hamburger());
    expect(
      screen.getByRole('navigation', { name: 'Menu do dashboard' }),
    ).toHaveClass('lg:hidden');
  });

  it('closes the mobile panel when selecting a link', () => {
    render(<DashboardHeader />);

    fireEvent.click(hamburger());
    const panel = screen.getByRole('navigation', {
      name: 'Menu do dashboard',
    });
    fireEvent.click(within(panel).getByRole('link', { name: 'Projetos' }));

    expect(
      screen.queryByRole('navigation', { name: 'Menu do dashboard' }),
    ).not.toBeInTheDocument();
  });

  it('closes the mobile panel on Escape', () => {
    render(<DashboardHeader />);

    fireEvent.click(hamburger());
    expect(
      screen.getByRole('navigation', { name: 'Menu do dashboard' }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(
      screen.queryByRole('navigation', { name: 'Menu do dashboard' }),
    ).not.toBeInTheDocument();
  });

  it('marks the clicked link active immediately', () => {
    render(<DashboardHeader />);

    fireEvent.click(
      within(desktopNav()).getByRole('link', { name: 'Formação' }),
    );

    expect(
      within(desktopNav()).getByRole('link', { name: 'Formação' }),
    ).toHaveAttribute('aria-current', 'true');
  });

  it('activates the last section at the bottom of the page', () => {
    render(<DashboardHeader />);

    const descriptors = [
      [window, 'innerHeight'],
      [window, 'scrollY'],
      [document.documentElement, 'scrollHeight'],
    ] as const;
    const originals = descriptors.map(([target, key]) =>
      Object.getOwnPropertyDescriptor(target, key),
    );
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 1800,
    });

    try {
      fireEvent.scroll(window);
      expect(
        within(desktopNav()).getByRole('link', { name: 'Formação' }),
      ).toHaveAttribute('aria-current', 'true');
    } finally {
      descriptors.forEach(([target, key], index) => {
        const original = originals[index];
        if (original) {
          Object.defineProperty(target, key, original);
        } else {
          delete (target as unknown as Record<string, unknown>)[key];
        }
      });
    }
  });
});
