import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutButton } from './logout-button.js';

const push = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
  });

  it('renders the logout label', () => {
    render(<LogoutButton />);

    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('calls logout and redirects to login', async () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
      });
      expect(push).toHaveBeenCalledWith('/auth/login');
      expect(refresh).toHaveBeenCalled();
    });
  });
});
