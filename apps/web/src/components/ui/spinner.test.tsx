import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('es decorativo: no se anuncia a los lectores de pantalla', () => {
    const { container } = render(<Spinner />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('acepta una clase adicional', () => {
    const { container } = render(<Spinner className="text-white" />);

    expect(container.querySelector('svg')).toHaveClass('text-white');
  });
});
