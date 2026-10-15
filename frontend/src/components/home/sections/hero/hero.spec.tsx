import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hero } from './hero';

describe('Hero', () => {
  it('renders name, headline and CTAs without skill chips', () => {
    render(
      <Hero
        name="Rafael Vieira"
        headline="Desenvolvedor full-stack."
        githubUrl="https://github.com/exemplo"
        linkedinUrl="https://linkedin.com/in/exemplo"
        contatoHref="#contato"
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Rafael Vieira' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Desenvolvedor full-stack.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/exemplo',
    );
    expect(screen.queryByRole('list', { name: 'Principais habilidades' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Ver projetos' }),
    ).toHaveAttribute('href', '#projetos');
    expect(
      screen.getByRole('link', { name: 'Entrar em contato' }),
    ).toHaveAttribute('href', '#contato');
  });

  it('omits optional links when absent', () => {
    render(
      <Hero
        name="Rafael Vieira"
        headline="Desenvolvedor full-stack."
      />,
    );

    expect(screen.queryByRole('link', { name: 'GitHub' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).not.toBeInTheDocument();
  });
});
