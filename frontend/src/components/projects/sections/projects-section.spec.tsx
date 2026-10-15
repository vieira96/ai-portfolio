import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectsPage } from '@/lib/projects/projects';
import type { Skill } from '@/types/skills/skills.types';
import { ProjectsSection } from './projects-section.js';

const page: ProjectsPage = {
  data: [
    {
      id: 'p1',
      name: 'Auth API',
      description: 'API de autenticação com JWT.',
      repositoryUrl: null,
      demoUrl: null,
      technologies: [],
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const skills: Skill[] = [
  { id: '1', name: 'NestJS', category: 'BACKEND' },
];

describe('ProjectsSection', () => {
  const onSkillsCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 200 })),
    );
  });

  it('lists projects and paginates', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ...page, page: 2 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    render(
      <ProjectsSection
        initialPage={{ ...page, totalPages: 2 }}
        skills={skills}
        onSkillsCreated={onSkillsCreated}
      />,
    );

    expect(screen.getByText('Auth API')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects?page=2&size=4'),
      );
    });
  });

  it('deletes through confirm', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    render(
      <ProjectsSection
        initialPage={page}
        skills={skills}
        onSkillsCreated={onSkillsCreated}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    const dialog = screen.getByRole('dialog', { name: 'Excluir projeto' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/projects/p1', {
        method: 'DELETE',
      });
      expect(screen.queryByText('Auth API')).not.toBeInTheDocument();
    });
  });

  it('shows an error when the page fails to load', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network'));
    render(
      <ProjectsSection
        initialPage={{ ...page, totalPages: 2 }}
        skills={skills}
        onSkillsCreated={onSkillsCreated}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    await waitFor(() => {
      expect(
        screen.getByText('Não foi possível carregar os projetos. Tente novamente.'),
      ).toBeInTheDocument();
    });
  });

  it('goes back a page when deleting the last item of a page', async () => {
    const page2: ProjectsPage = {
      data: [
        {
          ...page.data[0],
          id: 'p2',
          name: 'Other API',
        },
      ],
      total: 5,
      page: 2,
      totalPages: 2,
    };
    vi.mocked(fetch).mockImplementation((input) => {
      const url = String(input);
      if (url === '/api/projects/p2') {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (url.includes('page=1')) {
        return Promise.resolve(jsonResponse(200, { ...page, page: 1 }));
      }
      return Promise.resolve(jsonResponse(404, {}));
    });
    render(
      <ProjectsSection
        initialPage={page2}
        skills={skills}
        onSkillsCreated={onSkillsCreated}
      />,
    );

    expect(screen.getByText('Other API')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    fireEvent.click(
      within(
        screen.getByRole('dialog', { name: 'Excluir projeto' }),
      ).getByRole('button', { name: 'Excluir' }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects?page=1&size=4'),
      );
      expect(screen.queryByText('Other API')).not.toBeInTheDocument();
      expect(screen.getByText('Auth API')).toBeInTheDocument();
    });
  });
});
