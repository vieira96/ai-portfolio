import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sobre } from './sobre';

describe('Sobre', () => {
  it('renders bio text', () => {
    render(<Sobre bio="Bio de teste." />);

    expect(screen.getByText('Bio de teste.')).toBeInTheDocument();
  });

  it('renders the photo when provided', () => {
    render(
      <Sobre
        bio="Bio de teste."
        photoUrl="https://picsum.photos/seed/x/400"
        photoAlt="Foto de teste"
      />,
    );

    expect(screen.getByAltText('Foto de teste')).toBeInTheDocument();
  });

  it('falls back to a default photo alt', () => {
    render(
      <Sobre bio="Bio de teste." photoUrl="https://picsum.photos/seed/x/400" />,
    );

    expect(screen.getByAltText('Foto de perfil')).toBeInTheDocument();
  });

  it('omits the photo when absent', () => {
    const { container } = render(<Sobre bio="Bio de teste." />);

    expect(container.querySelector('img')).toBeNull();
  });
});
