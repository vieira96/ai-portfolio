import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExperienciaTimeline } from './experiencia-timeline';

function makeItem(index: number) {
  return {
    id: `exp-${index}`,
    company: `Empresa ${index}`,
    position: `Cargo ${index}`,
    period: `jan 202${index} — atual`,
    description: `Descrição ${index}.`,
    technologies: ['PHP', 'Laravel'],
  };
}

describe('ExperienciaTimeline', () => {
  it('renders items in order', () => {
    render(<ExperienciaTimeline items={[makeItem(1), makeItem(2)]} />);

    expect(screen.getByText('Empresa 1')).toBeInTheDocument();
    expect(screen.getByText('Empresa 2')).toBeInTheDocument();
    expect(screen.getAllByText('Laravel')).toHaveLength(2);
  });

  it('paginates with numbered buttons', () => {
    const items = [1, 2, 3].map(makeItem);
    render(<ExperienciaTimeline items={items} />);

    expect(screen.getByText('Empresa 2')).toBeInTheDocument();
    expect(screen.queryByText('Empresa 3')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Página 2' }));

    expect(screen.getByText('Empresa 3')).toBeInTheDocument();
    expect(screen.queryByText('Empresa 1')).not.toBeInTheDocument();
  });

  it('shows the description only after expanding the experience', () => {
    const item = {
      ...makeItem(1),
      description:
        'Desenvolvimento e manutenção de aplicações web em produção, com foco em APIs, integrações e regras de negócio. Também atuei na otimização de consultas e na criação de testes automatizados.',
    };
    render(<ExperienciaTimeline items={[item]} />);

    const expandButton = screen.getByRole('button', {
      name: 'Responsabilidades',
    });
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(item.description)).not.toBeVisible();

    fireEvent.click(expandButton);

    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(item.description)).toBeVisible();
  });

  it('renders empty state without items', () => {
    render(<ExperienciaTimeline items={[]} />);

    expect(
      screen.getByText('Nenhuma experiência registrada ainda.'),
    ).toBeInTheDocument();
  });
});
