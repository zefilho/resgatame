
import type { Timestamp } from 'firebase/firestore';

export type ItemCategory = 
  | 'Lanchonete'
  | 'Lojinha - Juventude'
  | 'Lojinha - Juventure'
  | 'Lojinha - Santos Anjos'
  | 'Lojinha - Apresentação';

export interface TagSaleSummary {
  tag: string;
  totalAmount: number;
  totalQuantity: number;
  percentage: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: ItemCategory;
}

export type CustomerTag = 'Cursista' | 'Servo';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  tag?: CustomerTag;
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
  public createdAt: Date | Timestamp = new Date();
  public closedAt?: Date | Timestamp;
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

export interface ReceivableItem {
  id: string;
  transactionId: string;
  saleDate: Date;
  paymentMethod: string;
  installmentLabel: string;
  expectedDepositDate: Date;
  amount: number;
  status: 'Recebido' | 'A Receber';
}

export interface MonthlyReceivableSummary {
  monthYear: string;
  totalAmount: number;
  count: number;
}

export interface ReceivablesOverview {
  immediateRevenue: number;
  upcoming30Days: number;
  futureBeyond30Days: number;
  totalFutureReceivables: number;
  monthlySchedule: MonthlyReceivableSummary[];
  receivablesList: ReceivableItem[];
}

