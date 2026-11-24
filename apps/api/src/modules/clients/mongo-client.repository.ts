import { Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import { CLIENT_STATUSES } from './client.entity.js';
import type { ClientItem, ClientStatus, NewClient } from './client.entity.js';
import { ClientModel } from './client.model.js';
import type { ClientDocument } from './client.model.js';
import type { ClientPage, ClientPageQuery, ClientRepository } from './client.repository.js';
import { escapeRegex, toSearchKey } from './search-key.js';

const MONGO_DUPLICATE_KEY_CODE = 11000;

function toClientItem(document: HydratedDocument<ClientDocument>): ClientItem {
  return {
    id: document.id,
    serviceId: document.serviceId.toString(),
    name: document.name,
    email: document.email,
    phone: document.phone,
    city: document.city,
    status: document.status,
    registeredAt: document.registeredAt,
    searchKey: document.searchKey,
  };
}

function isOnlyDuplicateKeyError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const { code, writeErrors } = error as { code?: unknown; writeErrors?: { code?: unknown }[] };

  if (Array.isArray(writeErrors)) {
    return writeErrors.every((writeError) => writeError.code === MONGO_DUPLICATE_KEY_CODE);
  }

  return code === MONGO_DUPLICATE_KEY_CODE;
}

export class MongoClientRepository implements ClientRepository {
  async countByService(): Promise<Map<string, number>> {
    const groups = await ClientModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $group: { _id: '$serviceId', count: { $sum: 1 } } },
    ]);

    return new Map(groups.map((group) => [group._id.toString(), group.count]));
  }

  async countByStatus(): Promise<Record<ClientStatus, number>> {
    const groups = await ClientModel.aggregate<{ _id: ClientStatus; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const counts = new Map(groups.map((group) => [group._id, group.count]));

    return Object.fromEntries(
      CLIENT_STATUSES.map((status) => [status, counts.get(status) ?? 0]),
    ) as Record<ClientStatus, number>;
  }

  countForService(serviceId: string): Promise<number> {
    return ClientModel.countDocuments({ serviceId: new Types.ObjectId(serviceId) });
  }

  async insertMany(clients: NewClient[]): Promise<void> {
    if (clients.length === 0) {
      return;
    }

    try {
      await ClientModel.insertMany(
        clients.map((client) => ({ ...client, serviceId: new Types.ObjectId(client.serviceId) })),
        { ordered: false },
      );
    } catch (error) {
      if (!isOnlyDuplicateKeyError(error)) {
        throw error;
      }
    }
  }

  async findPage({ serviceId, search, page, pageSize }: ClientPageQuery): Promise<ClientPage> {
    const filter: Record<string, unknown> = { serviceId: new Types.ObjectId(serviceId) };
    const searchKey = search ? toSearchKey(search) : '';

    if (searchKey) {
      filter.searchKey = { $regex: escapeRegex(searchKey) };
    }

    const [documents, total] = await Promise.all([
      ClientModel.find(filter)
        .sort({ searchKey: 1, _id: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
      ClientModel.countDocuments(filter),
    ]);

    return { items: documents.map(toClientItem), total };
  }
}
