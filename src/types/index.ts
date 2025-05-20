
export type UserRole = "admin" | "manager" | "viewer";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string; 
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  itemCode?: string;
  name: string;
  quantity: number;
  price: number; // Per unit price
  total: number; // quantity * price
}

export interface PaymentDetail {
  id: string; // Can be auto-generated like item IDs
  method: string;
  amount: number;
}

export type PurchaseOrderStatus = "Pending" | "Payment Required" | "Completed";

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName?: string; 
  orderDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  currency: string; 
  currencyRate: number; 
  status: PurchaseOrderStatus;
  payments?: PaymentDetail[]; // Array of payment details
  notes?: string;
  grandTotal: number; 
  createdBy: string; 
  createdAt: string;
  updatedAt: string;
}
