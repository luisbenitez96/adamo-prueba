import { describe, expect, it } from 'vitest';
import { escapeRegex, toSearchKey } from './search-key.js';

describe('toSearchKey', () => {
  it('pasa a minúsculas', () => {
    expect(toSearchKey('JUAN Pérez')).toBe('juan perez');
  });

  it.each([
    ['Ángela', 'angela'],
    ['José', 'jose'],
    ['Núñez', 'nunez'],
    ['Sofía Gómez Ríos', 'sofia gomez rios'],
  ])('quita las tildes de "%s"', (text, expected) => {
    expect(toSearchKey(text)).toBe(expected);
  });

  it('recorta los espacios de los extremos', () => {
    expect(toSearchKey('  ana  ')).toBe('ana');
  });

  it('conserva letras, números y símbolos del correo', () => {
    expect(toSearchKey('Ana.Perez.12@Example.com')).toBe('ana.perez.12@example.com');
  });

  it('el texto vacío queda vacío', () => {
    expect(toSearchKey('')).toBe('');
  });
});

describe('escapeRegex', () => {
  it('escapa los caracteres con significado especial', () => {
    expect(escapeRegex('a.b*c(d)[e]')).toBe('a\\.b\\*c\\(d\\)\\[e\\]');
  });

  it('el texto escapado se busca literalmente', () => {
    expect(new RegExp(escapeRegex('.*')).test('cualquier cosa')).toBe(false);
    expect(new RegExp(escapeRegex('.*')).test('texto .* literal')).toBe(true);
  });

  it('no altera el texto sin caracteres especiales', () => {
    expect(escapeRegex('juan perez')).toBe('juan perez');
  });
});
