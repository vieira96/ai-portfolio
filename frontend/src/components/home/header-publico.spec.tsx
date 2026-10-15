import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeaderPublico } from './header-publico';

describe('HeaderPublico', () => {
  function renderHeader() {
    return render(<HeaderPublico name="Rafael Vieira" contatoHref="#contato" />);
  }

  it('renders a home link with an icon and label', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '#topo',
    );
  });

  it('renders anchor links for all sections', () => {
    renderHeader();

    const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
    for (const [label, href] of [
      ['Sobre', '#sobre'],
      ['Experiência', '#experiencia'],
      ['Stack', '#stack'],
      ['Projetos', '#projetos'],
      ['Contato', '#contato'],
    ] as const) {
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute(
        'href',
        href,
      );
    }
  });

  it('opens the mobile menu and closes on selection', () => {
    renderHeader();

    expect(
      screen.queryByRole('navigation', { name: 'Navegação móvel' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const mobile = screen.getByRole('navigation', { name: 'Navegação móvel' });
    expect(
      within(mobile).getByRole('link', { name: 'Projetos' }),
    ).toBeInTheDocument();

    fireEvent.click(within(mobile).getByRole('link', { name: 'Projetos' }));
    expect(
      screen.queryByRole('navigation', { name: 'Navegação móvel' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
  });

  it('marks the clicked link active immediately', () => {
    renderHeader();

    fireEvent.click(
      screen
        .getByRole('navigation', { name: 'Navegação principal' })
        .querySelector('a[href="#contato"]') as HTMLElement,
    );

    expect(
      screen
        .getByRole('navigation', { name: 'Navegação principal' })
        .querySelector('[aria-current="true"]'),
    ).toHaveTextContent('Contato');
  });

  it('activates the last section at the bottom of the page', () => {
    render(<HeaderPublico name="Rafael Vieira" contatoHref="#contato" />);

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
        screen
          .getByRole('navigation', { name: 'Navegação principal' })
          .querySelector('[aria-current="true"]'),
      ).toHaveTextContent('Contato');
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

  it('marks the active section on scroll', () => {
    const getBoundingClientRect = vi.fn(() => ({ top: 0 }) as DOMRect);
    renderHeader();

    const sobre = document.createElement('section');
    sobre.id = 'sobre';
    sobre.getBoundingClientRect = getBoundingClientRect;
    document.body.appendChild(sobre);

    try {
      fireEvent.scroll(window);
      expect(
        screen
          .getByRole('navigation', { name: 'Navegação principal' })
          .querySelector('[aria-current="true"]'),
      ).not.toBeNull();
    } finally {
      document.body.removeChild(sobre);
    }
  });

  it('shows no call-to-action on desktop when logged out, contact lives in the mobile menu', () => {
    renderHeader();

    expect(
      screen.queryByRole('link', { name: 'Dashboard' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Entrar em contato' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const mobile = screen.getByRole('navigation', { name: 'Navegação móvel' });
    expect(
      within(mobile).getByRole('link', { name: 'Entrar em contato' }),
    ).toHaveAttribute('href', '#contato');
  });

  it('shows the dashboard button instead of contact when logged in', () => {
    render(
      <HeaderPublico
        name="Rafael Vieira"
        contatoHref="#contato"
        isLoggedIn
      />,
    );

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(
      screen.queryByRole('link', { name: 'Entrar em contato' }),
    ).not.toBeInTheDocument();
  });

  it('shows the dashboard button in the mobile menu when logged in', () => {
    render(
      <HeaderPublico
        name="Rafael Vieira"
        contatoHref="#contato"
        isLoggedIn
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    const mobile = screen.getByRole('navigation', { name: 'Navegação móvel' });
    expect(
      within(mobile).getByRole('link', { name: 'Dashboard' }),
    ).toHaveAttribute('href', '/dashboard');
  });

  it('shows the hamburger below the desktop breakpoint', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveClass(
      'lg:hidden',
    );
  });
});
