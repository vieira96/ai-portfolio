import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HabilidadesChips } from './habilidades-chips';

describe('HabilidadesChips', () => {
  it('renders the stack groups and the selected group technologies', () => {
    render(
      <HabilidadesChips
        groups={[
          { category: 'Backend', items: ['NestJS', 'Node.js'] },
          { category: 'Frontend', items: ['React'] },
        ]}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: /tecnologias que movem meu trabalho/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /01 Backend/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText('NestJS')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /02 Frontend/ }));

    const frontendSkills = screen.getByRole('list', {
      name: 'Tecnologias: Frontend',
    });
    expect(within(frontendSkills).getByText('React')).toBeInTheDocument();
    expect(within(frontendSkills).queryByText('NestJS')).not.toBeInTheDocument();
  });

  it('renders empty state without groups', () => {
    render(<HabilidadesChips groups={[]} />);

    expect(
      screen.getByText('Nenhuma tecnologia registrada ainda.'),
    ).toBeInTheDocument();
  });
});
