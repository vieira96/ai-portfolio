import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImagePicker } from './image-picker.js';

describe('ImagePicker', () => {
  const onSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
  });

  it('reports the selected file without uploading', () => {
    render(<ImagePicker onSelect={onSelect} />);

    const file = new File(['bytes'], 'a.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Escolher foto'), {
      target: { files: [file] },
    });

    expect(onSelect).toHaveBeenCalledWith(file);
    expect(fetch).not.toHaveBeenCalled();
    expect(
      screen.getByRole('img', { name: 'Pré-visualização' }),
    ).toBeInTheDocument();
  });

  it('clears the selection through the X button', () => {
    render(<ImagePicker onSelect={onSelect} />);

    const file = new File(['bytes'], 'a.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Escolher foto'), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Remover seleção' }));

    expect(onSelect).toHaveBeenLastCalledWith(null);
    expect(
      screen.queryByRole('img', { name: 'Pré-visualização' }),
    ).not.toBeInTheDocument();
  });
});
