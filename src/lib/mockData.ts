
import type { User, Supplier, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, PaymentMethod } from "@/types";
import { format } from "date-fns";

export const MOCK_USERS: User[] = [
  { id: "user-1", email: "admin@example.com", name: "Admin User", role: "admin", avatarUrl: "https://placehold.co/100x100.png?text=AU" },
  { id: "user-2", email: "manager@example.com", name: "Manager User", role: "manager", avatarUrl: "https://placehold.co/100x100.png?text=MU" },
  { id: "user-3", email: "viewer@example.com", name: "Viewer User", role: "viewer", avatarUrl: "https://placehold.co/100x100.png?text=VU" },
];

export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    name: "Tech Solutions Inc.",
    contactPerson: "Alice Wonderland",
    email: "alice@techsolutions.com",
    phone: "555-0101",
    address: "123 Innovation Drive, Tech City, TX 75001",
    createdAt: new Date(2023, 0, 15).toISOString(),
    updatedAt: new Date(2023, 5, 10).toISOString(),
  },
  {
    id: "sup-2",
    name: "Office Supplies Co.",
    contactPerson: "Bob The Builder",
    email: "bob@officesupplies.co",
    phone: "555-0102",
    address: "456 Paper Street, Stapler Town, CA 90210",
    createdAt: new Date(2022, 8, 20).toISOString(),
    updatedAt: new Date(2023, 2, 5).toISOString(),
  },
  {
    id: "sup-3",
    name: "Global Components Ltd.",
    contactPerson: "Carol Danvers",
    email: "carol@globalcomponents.com",
    phone: "555-0103",
    address: "789 Circuit Board Ave, Silicon Valley, CA 94043",
    createdAt: new Date(2023, 2, 1).toISOString(),
    updatedAt: new Date(2023, 6, 1).toISOString(),
  },
];

const createMockItems = (numItems: number): PurchaseOrderItem[] => {
  const items: PurchaseOrderItem[] = [];
  for (let i = 1; i <= numItems; i++) {
    const quantity = Math.floor(Math.random() * 10) + 1;
    const price = parseFloat((Math.random() * 100 + 10).toFixed(2));
    items.push({
      id: `item-${Date.now()}-${i}`,
      itemCode: `SKU-${String.fromCharCode(65 + i -1)}${Math.floor(Math.random() * 900) + 100}`, 
      name: `Product ${String.fromCharCode(65 + i -1)}`, 
      quantity,
      price,
      total: parseFloat((quantity * price).toFixed(2)),
    });
  }
  return items;
};

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po-1",
    poNumber: "PO20240001",
    supplierId: "sup-1",
    supplierName: "Tech Solutions Inc.",
    orderDate: new Date(2024, 6, 1).toISOString(),
    expectedDeliveryDate: new Date(2024, 6, 15).toISOString(),
    items: createMockItems(2),
    currency: "USD",
    currencyRate: 2100.0, // Updated rate for USD to MMK (example)
    status: "Completed",
    payments: [
      { id: "payment-1-1", method: "KBZ Bank", amount: 150.75 }
    ],
    notes: "Urgent delivery required.",
    grandTotal: 0, 
    createdBy: "user-2",
    createdAt: new Date(2024, 6, 1).toISOString(),
    updatedAt: new Date(2024, 6, 2).toISOString(),
  },
  {
    id: "po-2",
    poNumber: "PO20240002",
    supplierId: "sup-2",
    supplierName: "Office Supplies Co.",
    orderDate: new Date(2024, 5, 20).toISOString(),
    expectedDeliveryDate: new Date(2024, 6, 5).toISOString(),
    items: createMockItems(3),
    currency: "MMK",
    currencyRate: 1.0, 
    status: "Pending", 
    payments: [],
    grandTotal: 0,
    createdBy: "user-2",
    createdAt: new Date(2024, 5, 20).toISOString(),
    updatedAt: new Date(2024, 5, 20).toISOString(),
  },
  {
    id: "po-3",
    poNumber: "PO20240003",
    supplierId: "sup-3",
    supplierName: "Global Components Ltd.",
    orderDate: new Date(2024, 6, 5).toISOString(),
    expectedDeliveryDate: new Date(2024, 6, 25).toISOString(),
    items: createMockItems(1),
    currency: "MMK",
    currencyRate: 1.0, 
    status: "Payment Required", 
    payments: [
      { id: "payment-3-1", method: "KBZ pay", amount: 50.00 },
      { id: "payment-3-2", method: "AYA pay", amount: 25.50 },
    ],
    grandTotal: 0,
    createdBy: "user-1",
    createdAt: new Date(2024, 6, 5).toISOString(),
    updatedAt: new Date(2024, 6, 6).toISOString(),
  },
  { // Adding a couple more for "recent" demo
    id: "po-4",
    poNumber: "PO20240004",
    supplierId: "sup-1",
    supplierName: "Tech Solutions Inc.",
    orderDate: new Date(2024, 6, 10).toISOString(), // More recent
    expectedDeliveryDate: new Date(2024, 6, 20).toISOString(),
    items: createMockItems(1),
    currency: "USD",
    currencyRate: 2100.0,
    status: "Pending",
    payments: [],
    grandTotal: 0,
    createdBy: "user-1",
    createdAt: new Date(2024, 6, 10).toISOString(),
    updatedAt: new Date(2024, 6, 10).toISOString(),
  },
  {
    id: "po-5",
    poNumber: "PO20240005",
    supplierId: "sup-2",
    supplierName: "Office Supplies Co.",
    orderDate: new Date(2024, 6, 12).toISOString(), // Even more recent
    expectedDeliveryDate: new Date(2024, 6, 22).toISOString(),
    items: createMockItems(2),
    currency: "MMK",
    currencyRate: 1.0,
    status: "Completed",
    payments: [{ id: "payment-5-1", method: "MAB Bank", amount: 120.00 }],
    grandTotal: 0,
    createdBy: "user-2",
    createdAt: new Date(2024, 6, 12).toISOString(),
    updatedAt: new Date(2024, 6, 12).toISOString(),
  },
   {
    id: "po-6",
    poNumber: "PO20240006",
    supplierId: "sup-3",
    supplierName: "Global Components Ltd.",
    orderDate: new Date(2024, 4, 15).toISOString(), // Older one
    expectedDeliveryDate: new Date(2024, 5, 1).toISOString(),
    items: createMockItems(4),
    currency: "USD",
    currencyRate: 2050.0, // Slightly different rate for variety
    status: "Completed",
    payments: [{ id: "payment-6-1", method: "KBZ Bank", amount: 350.00 }],
    grandTotal: 0,
    createdBy: "user-1",
    createdAt: new Date(2024, 4, 15).toISOString(),
    updatedAt: new Date(2024, 4, 15).toISOString(),
  }
];

MOCK_PURCHASE_ORDERS.forEach(po => {
  po.grandTotal = po.items.reduce((sum, item) => sum + item.total, 0);
});

let poCounter = MOCK_PURCHASE_ORDERS.length;
export const getNewPONumber = () => {
  poCounter += 1;
  return `PO${new Date().getFullYear()}${(poCounter).toString().padStart(4, '0')}`;
}

let supplierCounter = MOCK_SUPPLIERS.length;
export const getNewSupplierId = () => {
  supplierCounter += 1;
  return `sup-${supplierCounter}`;
}

let poIdCounter = MOCK_PURCHASE_ORDERS.length;
export const getNewPOId = () => {
  poIdCounter += 1;
  return `po-${poIdCounter}`;
}

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "pm-1", name: "KBZ Bank", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "pm-2", name: "MAB Bank", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "pm-3", name: "AYA Bank", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "pm-4", name: "KBZ pay", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "pm-5", name: "AYA pay", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "pm-6", name: "A Bank", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

let paymentMethodCounter = MOCK_PAYMENT_METHODS.length;
export const getNewPaymentMethodId = () => {
  paymentMethodCounter += 1;
  return `pm-${paymentMethodCounter}`;
};

let userIdCounter = MOCK_USERS.length;
export const getNewUserId = () => {
  userIdCounter += 1;
  return `user-${userIdCounter}`;
}
