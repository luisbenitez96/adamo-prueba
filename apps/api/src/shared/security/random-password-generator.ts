import { randomInt } from 'node:crypto';
import type { PasswordGenerator } from './password-generator.js';
import { MIN_PASSWORD_LENGTH } from './password-policy.js';

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const ALL_CHARACTERS = UPPERCASE + LOWERCASE + DIGITS;

const DEFAULT_LENGTH = 12;

function pickFrom(characters: string): string {
  return characters.charAt(randomInt(characters.length));
}

function shuffle(items: string[]): string[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = randomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }
  return shuffled;
}

export class RandomPasswordGenerator implements PasswordGenerator {
  constructor(private readonly length = DEFAULT_LENGTH) {
    if (length < MIN_PASSWORD_LENGTH) {
      throw new RangeError(`La longitud mínima es ${MIN_PASSWORD_LENGTH}`);
    }
  }

  generate(): string {
    const requiredCharacters = [pickFrom(UPPERCASE), pickFrom(LOWERCASE), pickFrom(DIGITS)];
    const remainingCharacters = Array.from(
      { length: this.length - requiredCharacters.length },
      () => pickFrom(ALL_CHARACTERS),
    );

    return shuffle([...requiredCharacters, ...remainingCharacters]).join('');
  }
}
