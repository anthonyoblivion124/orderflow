
import type { UserRole, PurchaseOrderStatus } from "@/types";
import { LayoutDashboard, ShoppingCart, Users, Building, CreditCard } from "lucide-react"; // Removed Settings icon

export const APP_NAME = "OrderFlow";
export const APP_DESCRIPTION = "Manage your purchase orders efficiently.";

export const USER_ROLES: UserRole[] = ["admin", "manager", "viewer"];

export const DEFAULT_AVATARS: Record<UserRole, string> = {
  admin: "https://placehold.co/100x100.png/3F51B5/FFFFFF?text=ADM", // Deep Blue bg
  manager: "https://placehold.co/100x100.png/009688/FFFFFF?text=MGR", // Teal bg
  viewer: "https://placehold.co/100x100.png/757575/FFFFFF?text=VWR", // Gray bg
};

export const DEFAULT_AVATAR_HINTS: Record<UserRole, string> = {
  admin: "admin user",
  manager: "manager user",
  viewer: "viewer user",
};

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: USER_ROLES },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart, roles: USER_ROLES },
  { href: "/suppliers", label: "Suppliers", icon: Building, roles: USER_ROLES },
  { href: "/payment-methods", label: "Payment Methods", icon: CreditCard, roles: ["admin", "manager"] },
  { href: "/users", label: "User Management", icon: Users, roles: ["admin"] },
  // { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "manager"] }, // Removed settings link
];

export const PO_STATUSES: PurchaseOrderStatus[] = ["Pending", "Payment Required", "Completed"];

export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "THB", name: "Thai Baht" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "MMK", name: "Myanmar Kyat" },
];

// This list is currently used by the Purchase Order form.
// The new Payment Methods management page allows customizing these,
// but the PO form has not yet been updated to use the dynamic list.
export const PAYMENT_METHODS = [
  { value: "KBZ Bank", label: "KBZ Bank" },
  { value: "MAB Bank", label: "MAB Bank" },
  { value: "AYA Bank", label: "AYA Bank" },
  { value: "KBZ pay", label: "KBZ pay" },
  { value: "AYA pay", label: "AYA pay" },
  { value: "A Bank", label: "A Bank" },
];

export interface AppFeaturePermissionConfig {
  id: string;
  label: string;
  description: string;
  // Corresponds to a general area, not necessarily a direct NAV_LINK path,
  // as NAV_LINKS are already role-gated. This is for more granular conceptual features.
}

export const APP_FEATURES_PERMISSIONS: AppFeaturePermissionConfig[] = [
  { 
    id: 'viewPurchaseOrders', 
    label: 'View Purchase Orders',
    description: 'Allows viewing the list and details of purchase orders.'
  },
  { 
    id: 'managePurchaseOrders', 
    label: 'Create/Edit Purchase Orders',
    description: 'Allows creating new purchase orders and editing existing ones (status permitting).'
  },
  { 
    id: 'viewSuppliers', 
    label: 'View Suppliers',
    description: 'Allows viewing the list and details of suppliers.'
  },
  { 
    id: 'manageSuppliers', 
    label: 'Create/Edit Suppliers',
    description: 'Allows adding new suppliers and editing existing supplier details.'
  },
  { 
    id: 'managePaymentMethods', 
    label: 'Manage Payment Methods',
    description: 'Allows creating, editing, and deleting payment methods.'
  },
   // User Management is inherently admin-only, so not listed for roles like manager/viewer
];
