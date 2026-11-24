import type { HydratedDocument } from 'mongoose';
import type { NewServiceItem, ServiceItem } from './service-item.entity.js';
import { ServiceModel } from './service.model.js';
import type { ServiceDocument } from './service.model.js';
import type { ServiceRepository } from './service.repository.js';

function toServiceItem(document: HydratedDocument<ServiceDocument>): ServiceItem {
  return {
    id: document.id,
    name: document.name,
    description: document.description,
    clientsCount: document.clientsCount,
    accentColor: document.accentColor,
    order: document.order,
  };
}

export class MongoServiceRepository implements ServiceRepository {
  async findAll(): Promise<ServiceItem[]> {
    const documents = await ServiceModel.find().sort({ order: 1 });
    return documents.map(toServiceItem);
  }

  async insertMissing(items: NewServiceItem[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    await ServiceModel.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { name: item.name },
          update: { $setOnInsert: item },
          upsert: true,
        },
      })),
    );
  }
}
