
import type { Timestamp } from 'firebase/firestore';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Lanchonete' | 'Lojinha';
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
}

export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  get totalPrice(): number;
}

export class ConcreteOrderItem implements OrderItem {
  constructor(public menuItem: MenuItem, public quantity: number) {}

  get totalPrice(): number {
    return this.menuItem.price * this.quantity;
  }
}

export interface Annotation {
  id: string;
  name: string;
  customerId?: string;
  items: OrderItem[];
  createdAt: Date | Timestamp;
  closedAt?: Date | Timestamp | null;
  status: 'open' | 'closed' | 'paid';
  get totalAmount(): number;
}

export class ConcreteAnnotation implements Annotation {
  public items: OrderItem[] = [];
  public status: 'open' | 'closed' | 'paid' = 'open';
  public createdAt: Date = new Date();
  public closedAt?: Date;
  public customerId?: string;

  constructor(public id: string, public name: string, customerId?: string) {
    if (customerId) {
        this.customerId = customerId;
    }
  }
  
  get totalAmount(): number {
    return this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }
}

export interface Transaction {
  id: string;
  timestamp: Date | Timestamp;
  items: OrderItem[];
  totalAmount: number;
  annotationId?: string;
  paymentMethod?: string;
}
