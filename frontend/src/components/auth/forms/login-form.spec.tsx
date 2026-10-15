import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form.js';

const push = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { ok: true })),
    );
  });

  it('renders email, password and submit', () => {
    render(<LoginForm />);

    expect(screen.getByPlaceholderText('voce@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('submits credentials and redirects on success', async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText('voce@example.com'), {
      target: { value: 'voce@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'voce@example.com',
            password: 'password123',
          }),
        }),
      );
      expect(push).toHaveBeenCalledWith('/dashboard');
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('shows an error on invalid credentials', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, {}));
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText('voce@example.com'), {
      target: { value: 'voce@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'wrong-pass-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(
        screen.getByRole('alert'),
      ).toHaveTextContent('Email ou senha inválidos.');
      expect(push).not.toHaveBeenCalled();
    });
  });

  it('blocks submit on invalid email without calling the api', async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText('voce@example.com'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(
        screen.getByText('Informe um email válido.'),
      ).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    });
  });

  it('clears the field error once the user fixes the input', async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByPlaceholderText('voce@example.com'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(
        screen.getByText('Informe um email válido.'),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('voce@example.com'), {
      target: { value: 'voce@example.com' },
    });

    await waitFor(() => {
      expect(
        screen.queryByText('Informe um email válido.'),
      ).not.toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
