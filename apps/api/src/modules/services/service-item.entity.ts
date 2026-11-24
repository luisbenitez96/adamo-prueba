export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  clientsCount: number;
  accentColor: string;
  order: number;
}

export type NewServiceItem = Omit<ServiceItem, 'id'>;
