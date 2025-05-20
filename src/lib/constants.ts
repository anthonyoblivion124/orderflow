import type { UserRole } from "@/types";
import { LayoutDashboard, ShoppingCart, Users, Settings, Building } from "lucide-react";

export const APP_NAME = "OrderFlow";
export const APP_DESCRIPTION = "Manage your purchase orders efficiently.";

export const USER_ROLES: UserRole[] = ["admin", "manager", "viewer"];

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: USER_ROLES },
  { href: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart, roles: USER_ROLES },
  { href: "/suppliers", label: "Suppliers", icon: Building, roles: USER_ROLES },
  // { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "manager"] }, // Example for role-specific link
];

export const PO_STATUSES: PurchaseOrderStatus[] = ["Draft", "Pending", "Approved", "Shipped", "Delivered", "Cancelled"];
export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "SGD", name: "Singapore Dollar" },
];
