
"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, ListChecks, ShoppingCart, PackageSearch, Eye } from "lucide-react";
import { MOCK_PURCHASE_ORDERS } from "@/lib/mockData";
import type { PurchaseOrder } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Mock data for dashboard stats
const stats = [
  { title: "Total Purchase Orders", value: "1,234", icon: ShoppingCart, color: "text-primary" },
  { title: "Pending Approvals", value: "56", icon: ListChecks, color: "text-yellow-500" },
  { title: "Total Spent (This Month)", value: "12,567,000 MMK", icon: DollarSign, color: "text-destructive" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  // Get recent purchase orders (e.g., latest 5 by orderDate)
  const recentPOs = MOCK_PURCHASE_ORDERS
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
      <MainAppLayout>
        <PageHeader
          title={`Welcome, ${user?.name || user?.email || "User"}!`}
          description="Here's an overview of your procurement activities."
        />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Recent Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPOs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order No</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Total (MMK)</TableHead>
                        <TableHead className="text-center">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPOs.map((po) => {
                        const totalInMMK = po.currency === "MMK" 
                          ? po.grandTotal 
                          : po.grandTotal * (po.currencyRate || 0); // Ensure currencyRate is available
                        
                        return (
                          <TableRow key={po.id}>
                            <TableCell className="font-medium">{po.poNumber}</TableCell>
                            <TableCell>{po.supplierName}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(po.grandTotal, po.currency)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(totalInMMK, "MMK")}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/purchase-orders/${po.id}`}>
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View PO</span>
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground">No recent purchase orders found.</p>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PackageSearch className="mr-2 h-5 w-5 text-accent" />
                Recent Items Ordered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Overview of frequently or recently ordered items.
              </p>
               <div className="mt-4 h-64 flex items-center justify-center bg-muted/50 rounded-md">
                 <span className="text-muted-foreground">Recent items list/chart placeholder</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainAppLayout>
    </AuthGuard>
  );
}
