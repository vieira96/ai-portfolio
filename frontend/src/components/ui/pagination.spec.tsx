import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('renders numbered buttons with the current page marked', () => {
    const onChange = vi.fn();
    render(<Pagination current={2} totalPages={3} onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Página 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Página 3' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Anterior' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Próxima' }),
    ).not.toBeInTheDocument();
  });

  it('calls onChange with the clicked page', () => {
    const onChange = vi.fn();
    render(<Pagination current={1} totalPages={3} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Página 3' }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('renders nothing with a single page', () => {
    const { container } = render(
      <Pagination current={1} totalPages={1} onChange={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
