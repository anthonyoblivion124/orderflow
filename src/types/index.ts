
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
  itemCode?: string; // Added itemCode
  name: string;
  quantity: number;
  price: number; // Per unit price
  total: number; // quantity * price
}

export type PurchaseOrderStatus = "Pending" | "Payment Required" | "Completed";

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName?: string; // Denormalized for display, ideally fetched or joined
  orderDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  currency: string; // e.g., "USD", "EUR", "SGD"
  currencyRate: number; // Rate against a base currency, e.g., 1.0 for USD, 1.2 for SGD if base is USD
  status: PurchaseOrderStatus;
  notes?: string;
  grandTotal: number; // Sum of all item totals in the specified currency
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
}
