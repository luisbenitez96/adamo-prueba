import { model, Schema } from 'mongoose';
import type { Types } from 'mongoose';
import { CLIENT_STATUSES } from './client.entity.js';
import type { ClientItem } from './client.entity.js';

export type ClientDocument = Omit<ClientItem, 'id' | 'serviceId'> & { serviceId: Types.ObjectId };

const clientSchema = new Schema<ClientDocument>({
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  status: { type: String, enum: CLIENT_STATUSES, required: true },
  registeredAt: { type: Date, required: true },
  searchKey: { type: String, required: true },
});

clientSchema.index({ serviceId: 1, email: 1 }, { unique: true });
clientSchema.index({ serviceId: 1, searchKey: 1, _id: 1 });

export const ClientModel = model<ClientDocument>('Client', clientSchema);
