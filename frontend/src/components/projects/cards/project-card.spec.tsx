import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Project } from '@/types/projects/projects.types';
import { ProjectCard } from './project-card.js';

const project: Project = {
  id: 'project-id-1',
  name: 'Auth API',
  description: 'API de autenticação com JWT.',
  repositoryUrl: 'https://github.com/user/auth-api',
  demoUrl: null,
  technologies: [
    { id: 'tech-1', name: 'NestJS', category: 'BACKEND' },
  ],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

const noop = () => {};

describe('ProjectCard', () => {
  it('renders name, description and links', () => {
    render(<ProjectCard project={project} onEdit={noop} onDelete={noop} />);

    expect(
      screen.getByRole('heading', { name: 'Auth API' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('API de autenticação com JWT.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub ↗' })).toHaveAttribute(
      'href',
      'https://github.com/user/auth-api',
    );
  });

  it('renders linked skills as chips', () => {
    render(<ProjectCard project={project} onEdit={noop} onDelete={noop} />);

    expect(screen.getByText('NestJS')).toBeInTheDocument();
  });

  it('hides sections without data', () => {
    render(
      <ProjectCard
        project={{ ...project, repositoryUrl: null, demoUrl: null, technologies: [] }}
        onEdit={noop}
        onDelete={noop}
      />,
    );

    expect(screen.queryByRole('link', { name: 'GitHub ↗' })).not.toBeInTheDocument();
  });
});
