import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestDatabase } from '../../test/test-database.js';
import { DuplicateEmailError } from './duplicate-email-error.js';
import { MongoUserRepository } from './mongo-user.repository.js';
import { UserModel } from './user.model.js';

describe('MongoUserRepository', () => {
  const database = new TestDatabase();
  const repository = new MongoUserRepository();

  beforeAll(async () => {
    await database.start();
    await UserModel.init();
  });

  beforeEach(async () => {
    await database.clear();
  });

  afterAll(async () => {
    await database.stop();
  });

  describe('create', () => {
    it('crea un usuario con los valores iniciales esperados', async () => {
      const user = await repository.create({ email: 'ana@correo.com' });

      expect(user).toMatchObject({
        email: 'ana@correo.com',
        passwordHash: null,
        passwordHistory: [],
        tempPasswordHash: null,
        tempPasswordExpiresAt: null,
        lastTempRequestAt: null,
      });
      expect(user.id).toEqual(expect.any(String));
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('guarda los datos opcionales que se le pasan', async () => {
      const expiresAt = new Date('2030-01-01T00:00:00.000Z');

      const user = await repository.create({
        email: 'ana@correo.com',
        tempPasswordHash: 'hash-temporal',
        tempPasswordExpiresAt: expiresAt,
      });

      expect(user.tempPasswordHash).toBe('hash-temporal');
      expect(user.tempPasswordExpiresAt).toEqual(expiresAt);
    });

    it('guarda el correo en minúsculas y sin espacios', async () => {
      const user = await repository.create({ email: '  Ana@Correo.COM ' });

      expect(user.email).toBe('ana@correo.com');
    });

    it('usa los valores por defecto cuando un campo llega undefined', async () => {
      const user = await repository.create({
        email: 'ana@correo.com',
        passwordHash: undefined,
        tempPasswordExpiresAt: undefined,
      });

      expect(user.passwordHash).toBeNull();
      expect(user.tempPasswordExpiresAt).toBeNull();
    });

    it('rechaza un correo repetido', async () => {
      await repository.create({ email: 'ana@correo.com' });

      await expect(repository.create({ email: 'ana@correo.com' })).rejects.toBeInstanceOf(
        DuplicateEmailError,
      );
    });

    it('rechaza un correo repetido aunque cambien las mayúsculas', async () => {
      await repository.create({ email: 'ana@correo.com' });

      await expect(repository.create({ email: 'ANA@correo.com' })).rejects.toBeInstanceOf(
        DuplicateEmailError,
      );
    });
  });

  describe('findByEmail', () => {
    it('encuentra un usuario por su correo', async () => {
      const created = await repository.create({ email: 'ana@correo.com' });

      const found = await repository.findByEmail('ana@correo.com');

      expect(found?.id).toBe(created.id);
    });

    it('encuentra al usuario sin importar mayúsculas ni espacios', async () => {
      const created = await repository.create({ email: 'ana@correo.com' });

      const found = await repository.findByEmail('  ANA@Correo.com ');

      expect(found?.id).toBe(created.id);
    });

    it('devuelve null si el correo no existe', async () => {
      await repository.create({ email: 'ana@correo.com' });

      expect(await repository.findByEmail('otra@correo.com')).toBeNull();
    });
  });

  describe('findById', () => {
    it('encuentra un usuario por su id', async () => {
      const created = await repository.create({ email: 'ana@correo.com' });

      const found = await repository.findById(created.id);

      expect(found?.email).toBe('ana@correo.com');
    });

    it('devuelve null si el id no existe', async () => {
      expect(await repository.findById('64b7f0c2a1b2c3d4e5f60718')).toBeNull();
    });

    it('devuelve null si el id no tiene formato válido', async () => {
      expect(await repository.findById('no-es-un-id')).toBeNull();
    });
  });

  describe('historial de contraseñas', () => {
    it('guarda y devuelve el historial en el mismo orden', async () => {
      const user = await repository.create({ email: 'ana@correo.com' });

      const updated = await repository.update(user.id, { passwordHistory: ['h1', 'h2', 'h3'] });

      expect(updated!.passwordHistory).toEqual(['h1', 'h2', 'h3']);
      expect((await repository.findById(user.id))!.passwordHistory).toEqual(['h1', 'h2', 'h3']);
    });

    it('un usuario guardado antes de existir el historial lo recibe vacío', async () => {
      const { id } = await repository.create({ email: 'vieja@correo.com' });
      await UserModel.collection.updateOne(
        { email: 'vieja@correo.com' },
        { $unset: { passwordHistory: '' } },
      );

      expect((await repository.findById(id))!.passwordHistory).toEqual([]);
    });
  });

  describe('update', () => {
    it('cambia solo los campos indicados y devuelve el usuario actualizado', async () => {
      const created = await repository.create({
        email: 'ana@correo.com',
        tempPasswordHash: 'hash-temporal',
        lastTempRequestAt: null,
      });

      const updated = await repository.update(created.id, {
        passwordHash: 'hash-definitivo',
        lastTempRequestAt: new Date('2030-01-01T00:00:00.000Z'),
      });

      expect(updated).toMatchObject({
        email: 'ana@correo.com',
        passwordHash: 'hash-definitivo',
        tempPasswordHash: 'hash-temporal',
        lastTempRequestAt: new Date('2030-01-01T00:00:00.000Z'),
      });
    });

    it('persiste el cambio en la base de datos', async () => {
      const created = await repository.create({ email: 'ana@correo.com' });

      await repository.update(created.id, { passwordHash: 'hash-definitivo' });

      expect((await repository.findById(created.id))?.passwordHash).toBe('hash-definitivo');
    });

    it('permite limpiar un campo poniéndolo en null', async () => {
      const created = await repository.create({
        email: 'ana@correo.com',
        tempPasswordHash: 'hash-temporal',
      });

      const updated = await repository.update(created.id, { tempPasswordHash: null });

      expect(updated?.tempPasswordHash).toBeNull();
    });

    it('ignora los campos undefined en vez de borrarlos', async () => {
      const created = await repository.create({
        email: 'ana@correo.com',
        passwordHash: 'hash-definitivo',
      });

      const updated = await repository.update(created.id, {
        passwordHash: undefined,
        tempPasswordHash: 'hash-temporal',
      });

      expect(updated?.passwordHash).toBe('hash-definitivo');
      expect(updated?.tempPasswordHash).toBe('hash-temporal');
    });

    it('no modifica a otros usuarios', async () => {
      const ana = await repository.create({ email: 'ana@correo.com' });
      const luis = await repository.create({ email: 'luis@correo.com' });

      await repository.update(ana.id, { passwordHash: 'hash-de-ana' });

      expect((await repository.findById(luis.id))?.passwordHash).toBeNull();
    });

    it('devuelve null si el usuario no existe', async () => {
      expect(
        await repository.update('64b7f0c2a1b2c3d4e5f60718', { passwordHash: 'hash' }),
      ).toBeNull();
    });

    it('devuelve null si el id no tiene formato válido', async () => {
      expect(await repository.update('no-es-un-id', { passwordHash: 'hash' })).toBeNull();
    });
  });
});
