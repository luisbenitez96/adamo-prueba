import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fakeClient } from '../../../test/server';
import { ClientsTable } from './clients-table';

describe('ClientsTable', () => {
  it('es una tabla con las 6 columnas', () => {
    render(<ClientsTable clients={[fakeClient(1)]} />);

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent);
    expect(headers).toEqual(['Nombre', 'Correo', 'Teléfono', 'Ciudad', 'Estado', 'Registro']);
  });

  it('tiene un nombre accesible', () => {
    render(<ClientsTable clients={[fakeClient(1)]} />);

    expect(screen.getByRole('table', { name: 'Clientes del servicio' })).toBeInTheDocument();
  });

  it('muestra una fila por cliente con todos sus datos', () => {
    render(<ClientsTable clients={[fakeClient(1), fakeClient(2)]} />);

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByRole('rowheader', { name: 'Cliente 001' })).toBeInTheDocument();
    expect(within(rows[0]!).getByText('cliente001@example.com')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('+57 300 123 4567')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('Bogotá')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('Pendiente')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('15/03/2025')).toBeInTheDocument();
  });

  it('cada celda lleva su etiqueta para la vista de tarjetas en móvil', () => {
    render(<ClientsTable clients={[fakeClient(1)]} />);

    const row = screen.getAllByRole('row')[1]!;
    const labels = within(row)
      .getAllByRole('cell')
      .map((cell) => cell.getAttribute('data-label'));
    expect(labels).toEqual(['Correo', 'Teléfono', 'Ciudad', 'Estado', 'Registro']);
    expect(within(row).getByRole('rowheader')).toHaveAttribute('data-label', 'Nombre');
  });

  it('conserva el orden recibido', () => {
    render(<ClientsTable clients={[fakeClient(3), fakeClient(1), fakeClient(2)]} />);

    const names = screen.getAllByRole('rowheader').map((cell) => cell.textContent);
    expect(names).toEqual(['Cliente 003', 'Cliente 001', 'Cliente 002']);
  });
});
