import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EducationsPage } from '@/types/educations/educations.types';
import { EducationsSection } from './educations-section.js';

const page: EducationsPage = {
  data: [
    {
      id: 'e1',
      institution: 'USP',
      course: 'Ciência da Computação',
      degree: 'GRADUACAO',
      description: 'Bacharelado.',
      startedAt: '2020-02-10',
      endedAt: null,
      expectedEnd: null,
      createdAt: '',
      updatedAt: '',
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

describe('EducationsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 200 })),
    );
  });

  it('lists educations with period', () => {
    render(<EducationsSection initialPage={page} />);

    expect(screen.getByText('USP')).toBeInTheDocument();
    expect(
      screen.getByText('Ciência da Computação', { exact: false }),
    ).toBeInTheDocument();
  });

  it('paginates with size 2', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { ...page, page: 2, totalPages: 2 }),
    );
    render(<EducationsSection initialPage={{ ...page, totalPages: 2 }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/educations?page=2&size=2'),
      );
    });
  });

  it('deletes through confirm', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    render(<EducationsSection initialPage={page} />);

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    const dialog = screen.getByRole('dialog', { name: 'Excluir formação' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/educations/e1', {
        method: 'DELETE',
      });
      expect(screen.queryByText('USP')).not.toBeInTheDocument();
    });
  });

  it('shows an error when the page fails to load', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network'));
    render(<EducationsSection initialPage={{ ...page, totalPages: 2 }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Não foi possível carregar a formação. Tente novamente.',
        ),
      ).toBeInTheDocument();
    });
  });
});
