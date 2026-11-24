import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ClientsPagination } from './clients-pagination';

function renderPagination(overrides: Partial<Parameters<typeof ClientsPagination>[0]> = {}) {
  const onPageChange = vi.fn();
  render(
    <ClientsPagination
      page={2}
      pageSize={20}
      total={3827}
      totalPages={192}
      loading={false}
      onPageChange={onPageChange}
      {...overrides}
    />,
  );
  return onPageChange;
}

describe('ClientsPagination', () => {
  it('indica la página actual y el total de páginas', () => {
    renderPagination();

    expect(screen.getByText('Página 2 de 192')).toBeInTheDocument();
  });

  it('resume el rango que se está viendo', () => {
    renderPagination();

    expect(screen.getByText('21–40 de 3.827 clientes')).toBeInTheDocument();
  });

  it('en la última página el rango termina en el total', () => {
    renderPagination({ page: 192 });

    expect(screen.getByText('3.821–3.827 de 3.827 clientes')).toBeInTheDocument();
  });

  it('"Siguiente" pide la página siguiente', async () => {
    const onPageChange = renderPagination();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(3);
  });

  it('"Anterior" pide la página anterior', async () => {
    const onPageChange = renderPagination();

    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));

    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('en la primera página "Anterior" está deshabilitado', () => {
    renderPagination({ page: 1 });

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('en la última página "Siguiente" está deshabilitado', () => {
    renderPagination({ page: 192 });

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
  });

  it('en la penúltima página "Siguiente" sigue habilitado', () => {
    renderPagination({ page: 191 });

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('en la segunda página "Anterior" sigue habilitado', () => {
    renderPagination({ page: 2 });

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeEnabled();
  });

  it('con una sola página ambos botones están deshabilitados', () => {
    renderPagination({ page: 1, total: 5, totalPages: 1 });

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('muestra un spinner solo mientras carga', () => {
    const { container } = render(
      <ClientsPagination
        page={1}
        pageSize={20}
        total={30}
        totalPages={2}
        loading
        onPageChange={() => undefined}
      />,
    );

    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('sin carga no hay spinner', () => {
    renderPagination();

    expect(document.querySelector('svg.animate-spin')).not.toBeInTheDocument();
  });
});
