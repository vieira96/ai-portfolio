import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Contato } from './contato';

describe('Contato', () => {
  it('renders email and social links', () => {
    render(
      <Contato
        email="contato@exemplo.com"
        githubUrl="https://github.com/exemplo"
        linkedinUrl="https://linkedin.com/in/exemplo"
      />,
    );

    expect(
      screen.getByRole('link', { name: 'contato@exemplo.com' }),
    ).toHaveAttribute('href', 'mailto:contato@exemplo.com');
    expect(
      screen.getByRole('link', { name: 'Perfil no GitHub' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Perfil no LinkedIn' }),
    ).toBeInTheDocument();
  });

  it('omits socials when absent', () => {
    render(<Contato email="contato@exemplo.com" />);

    expect(
      screen.queryByRole('link', { name: 'Perfil no GitHub' }),
    ).not.toBeInTheDocument();
  });

  it('copies the email on button click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<Contato email="a@b.com" />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar e-mail' }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith('a@b.com');
  });
});
