import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EducationForm } from './education-form.js';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('EducationForm', () => {
  const onSaved = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  function renderForm() {
    return render(
      <EducationForm
        education={null}
        onSaved={onSaved}
        onClose={onClose}
      />,
    );
  }

  function fillForm() {
    fireEvent.change(screen.getByPlaceholderText('Ex: USP'), {
      target: { value: 'USP' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Ex: Ciência da Computação'),
      { target: { value: 'Ciência da Computação' } },
    );
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Bacharelado com ênfase em sistemas.' },
    });
    fireEvent.change(screen.getByLabelText('Início'), {
      target: { value: '2020-02-10' },
    });
  }

  it('shows validation errors without submitting', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(
        screen.getByText('Instituição precisa de ao menos 2 caracteres.'),
      ).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it('clears the field error once the user fixes the input', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(
        screen.getByText('Instituição precisa de ao menos 2 caracteres.'),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Ex: USP'), {
      target: { value: 'USP' },
    });

    await waitFor(() => {
      expect(
        screen.queryByText('Instituição precisa de ao menos 2 caracteres.'),
      ).not.toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits with null endedAt when studying', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, { id: 'e1', endedAt: null }),
    );
    renderForm();

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/educations',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            institution: 'USP',
            course: 'Ciência da Computação',
            degree: 'GRADUACAO',
            description: 'Bacharelado com ênfase em sistemas.',
            startedAt: '2020-02-10',
            endedAt: null,
            expectedEnd: null,
          }),
        }),
      );
      expect(onSaved).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('shows an error when the api fails', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, {}));
    renderForm();

    fillForm();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(
        screen.getByText('Não foi possível salvar. Tente novamente.'),
      ).toBeInTheDocument();
      expect(onSaved).not.toHaveBeenCalled();
    });
  });

  it('closes without submitting on Cancelar', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
