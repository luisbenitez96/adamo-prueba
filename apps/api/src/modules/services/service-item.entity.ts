export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  order: number;
}

export type NewServiceItem = Omit<ServiceItem, 'id'>;
