export const CLIENT_STATUSES = ['active', 'pending', 'inactive'] as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export interface ClientItem {
  id: string;
  serviceId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  status: ClientStatus;
  registeredAt: Date;
  searchKey: string;
}

export type NewClient = Omit<ClientItem, 'id'>;
