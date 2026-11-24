import { describe, expect, it } from 'vitest';
import { clientsQuerySchema, DEFAULT_PAGE_SIZE } from './clients-query.schema.js';

describe('clientsQuerySchema', () => {
  it('sin parámetros usa la página 1 y el tamaño por defecto, sin búsqueda', () => {
    expect(clientsQuerySchema.parse({})).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('el tamaño por defecto es 20', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20);
  });

  it('convierte los textos de la URL en números', () => {
    expect(clientsQuerySchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it('recorta los espacios de la búsqueda', () => {
    expect(clientsQuerySchema.parse({ search: '  ana  ' }).search).toBe('ana');
  });

  it('acepta el límite de 100 caracteres en la búsqueda', () => {
    expect(clientsQuerySchema.safeParse({ search: 'a'.repeat(100) }).success).toBe(true);
  });

  it.each([
    ['page', '0'],
    ['page', '-3'],
    ['page', '2.5'],
    ['page', 'abc'],
    ['page', ''],
    ['page', ['1', '2']],
    ['pageSize', '0'],
    ['pageSize', '101'],
    ['pageSize', 'x'],
    ['search', 'a'.repeat(101)],
    ['search', ['a', 'b']],
  ])('rechaza %s=%j', (field, value) => {
    expect(clientsQuerySchema.safeParse({ [field]: value }).success).toBe(false);
  });
});
