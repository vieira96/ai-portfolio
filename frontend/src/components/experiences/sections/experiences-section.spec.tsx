import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  Experience,
  ExperiencesPage,
} from '@/types/experiences/experiences.types';
import { ExperiencesSection } from './experiences-section.js';

const experience: Experience = {
  id: 'e1',
  company: 'Levante Lab',
  position: 'Backend Developer',
  description: 'APIs com NestJS e PostgreSQL.',
  startedAt: '2023-01-15',
  endedAt: null,
  technologies: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

const page: ExperiencesPage = {
  data: [experience],
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

describe('ExperiencesSection', () => {
  const onSkillsCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 200 })),
    );
  });

  function renderSection(currentPage: ExperiencesPage = page) {
    return render(
      <ExperiencesSection
        initialPage={currentPage}
        skills={[]}
        onSkillsCreated={onSkillsCreated}
      />,
    );
  }

  it('lists experiences with period and skills', async () => {
    renderSection();

    expect(screen.getByText('Levante Lab')).toBeInTheDocument();
    expect(screen.getByText('Backend Developer')).toBeInTheDocument();
  });

  it('paginates with size 2', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { ...page, page: 2, totalPages: 2 }),
    );
    renderSection({ ...page, totalPages: 2 });

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/experiences?page=2&size=2'),
      );
    });
  });

  it('deletes through confirm', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    renderSection();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    const dialog = screen.getByRole('dialog', {
      name: 'Excluir experiência',
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/experiences/e1', {
        method: 'DELETE',
      });
      expect(screen.queryByText('Levante Lab')).not.toBeInTheDocument();
    });
  });

  it('shows an error when the page fails to load', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network'));
    renderSection({ ...page, totalPages: 2 });

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Não foi possível carregar as experiências. Tente novamente.',
        ),
      ).toBeInTheDocument();
    });
  });
});
