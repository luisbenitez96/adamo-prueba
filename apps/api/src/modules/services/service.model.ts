import { model, Schema } from 'mongoose';
import type { ServiceItem } from './service-item.entity.js';

export type ServiceDocument = Omit<ServiceItem, 'id'>;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const serviceSchema = new Schema<ServiceDocument>({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  clientsCount: { type: Number, required: true, min: 0, validate: Number.isInteger },
  accentColor: { type: String, required: true, match: HEX_COLOR },
  order: { type: Number, required: true },
});

export const ServiceModel = model<ServiceDocument>('Service', serviceSchema);
