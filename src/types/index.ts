
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

export interface PaymentMethod {
  id: string;
  name: string;
  // description?: string; // Optional for future extension
  // isActive?: boolean; // Optional for future extension
  createdAt: string;
  updatedAt: string;
}

// For Role Feature Permissions
export type FeaturePermission = {
  [featureId: string]: boolean;
};

export type RolePermissions = {
  // Only non-admin roles will have their permissions managed here.
  // Admin role implicitly has all permissions.
  manager?: FeaturePermission;
  viewer?: FeaturePermission;
};
