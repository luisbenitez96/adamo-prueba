import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Logo } from './logo';

describe('Logo', () => {
  it('es una imagen con el nombre de la marca como texto alternativo', () => {
    render(<Logo />);

    expect(screen.getByRole('img', { name: 'AdamoServices' })).toBeInTheDocument();
  });

  it('carga el archivo SVG del logo', () => {
    render(<Logo />);

    expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringMatching(/logo.*\.svg/));
  });

  it('acepta una clase adicional', () => {
    render(<Logo className="mx-auto" />);

    expect(screen.getByRole('img')).toHaveClass('mx-auto');
  });
});
