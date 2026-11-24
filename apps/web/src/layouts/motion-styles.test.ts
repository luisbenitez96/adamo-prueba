import { describe, expect, it } from 'vitest';
import { bottomNavStyles, tabStyles } from './bottom-nav.styles';
import { moreSheetStyles } from './more-sheet.styles';

describe('animaciones de la navegación móvil', () => {
  it('la hoja "Más" anima la propiedad translate, que es la que usa Tailwind para translate-y', () => {
    const closedSheet = moreSheetStyles.sheet({ open: false });

    expect(closedSheet).toContain('translate-y-full');
    expect(closedSheet).toContain('transition-[translate,opacity]');
    expect(closedSheet).not.toContain('transition-[transform');
  });

  it('el óvalo indicador anima la propiedad translate al cambiar de pestaña', () => {
    expect(bottomNavStyles.indicator).toContain('translate-x-full');
    expect(bottomNavStyles.indicator).toContain('transition-[translate,opacity]');
  });

  it('las pestañas animan scale, la propiedad que usa Tailwind para active:scale', () => {
    const tab = tabStyles();

    expect(tab).toContain('active:scale-95');
    expect(tab).toContain('transition-[color,scale]');
  });

  it('el fondo oscuro se desvanece en vez de aparecer de golpe', () => {
    expect(moreSheetStyles.backdrop({ open: false })).toContain('transition-opacity');
  });

  it.each([
    ['la hoja', moreSheetStyles.sheet({ open: true })],
    ['el fondo oscuro', moreSheetStyles.backdrop({ open: true })],
    ['el óvalo', bottomNavStyles.indicator],
    ['las pestañas', tabStyles()],
  ])('%s respeta a quien pidió menos movimiento (prefers-reduced-motion)', (_nombre, classes) => {
    expect(classes).toContain('motion-reduce:transition-none');
  });
});
