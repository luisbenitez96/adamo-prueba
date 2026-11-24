import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AuthLayout } from './auth-layout';

function renderLayout() {
  const router = createMemoryRouter(
    [
      {
        element: <AuthLayout />,
        children: [{ path: '/', element: <p>Contenido de la página</p> }],
      },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
}

describe('AuthLayout', () => {
  it('muestra el logo y la frase de la marca', () => {
    renderLayout();

    expect(screen.getByRole('img', { name: 'AdamoServices' })).toBeInTheDocument();
    expect(
      screen.getByText('Tus procesos más eficientes, seguros y sin fricciones.'),
    ).toBeInTheDocument();
  });

  it('muestra el texto del pie del diseño', () => {
    renderLayout();

    expect(screen.getByText(/Sed ut perspiciatis unde omnis iste natus error/)).toBeInTheDocument();
  });

  it('pone el contenido de la página en la zona principal', () => {
    renderLayout();

    expect(screen.getByRole('main')).toHaveTextContent('Contenido de la página');
  });

  it('el panel de la marca es una zona complementaria, separada del contenido principal', () => {
    renderLayout();

    expect(screen.getByRole('complementary')).toContainElement(screen.getByRole('img'));
    expect(screen.getByRole('main')).not.toContainElement(screen.getByRole('img'));
  });
});
