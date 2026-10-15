import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProjetosGrid } from './projetos-grid';

function makeProject(id: string, name: string) {
  return {
    id,
    name,
    description: `Descrição de ${name}.`,
    technologies: ['NestJS'],
    repositoryUrl: `https://github.com/exemplo/${id}`,
  };
}

describe('ProjetosGrid', () => {
  it('renders all skills of each project without truncation', () => {
    render(
      <ProjetosGrid
        projects={[
          {
            ...makeProject('p1', 'API'),
            technologies: ['A', 'B', 'C', 'D', 'E', 'F'],
          },
        ]}
      />,
    );

    for (const tech of ['A', 'B', 'C', 'D', 'E', 'F']) {
      expect(screen.getByText(tech)).toBeInTheDocument();
    }
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('paginates with numbered buttons', () => {
    const projects = ['P1', 'P2', 'P3', 'P4', 'P5'].map((name, index) =>
      makeProject(`p${index + 1}`, name),
    );
    render(<ProjetosGrid projects={projects} />);

    expect(screen.getByText('P4')).toBeInTheDocument();
    expect(screen.queryByText('P5')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Página 2' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Página 2' }));

    expect(screen.getByText('P5')).toBeInTheDocument();
    expect(screen.queryByText('P1')).not.toBeInTheDocument();
  });

  it('renders nothing extra with a single page', () => {
    render(<ProjetosGrid projects={[makeProject('p1', 'API')]} />);

    expect(screen.getByText('API')).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Paginação' }),
    ).not.toBeInTheDocument();
  });
});
