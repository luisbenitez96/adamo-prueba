import type { NewServiceItem, ServiceItem } from './service-item.entity.js';

export interface ServiceRepository {
  findAll(): Promise<ServiceItem[]>;
  findById(id: string): Promise<ServiceItem | null>;
  insertMissing(items: NewServiceItem[]): Promise<void>;
}
