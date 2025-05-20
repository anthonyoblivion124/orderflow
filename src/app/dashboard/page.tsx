
"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, ListChecks, ShoppingCart, Eye, Award } from "lucide-react";
import { MOCK_PURCHASE_ORDERS } from "@/lib/mockData";
import type { PurchaseOrder } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface RankedItem {
  rank: number;
  itemCode?: string;
  name: string;
  quantity: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState([
    { title: "Total Purchase Orders", value: "0", icon: ShoppingCart, color: "text-primary" },
    { title: "Pending Approvals", value: "0", icon: ListChecks, color: "text-yellow-500" },
    { title: "Total Spent (This Month)", value: "0 MMK", icon: DollarSign, color: "text-destructive" },
  ]);
  const [topOrderedItems, setTopOrderedItems] = useState<RankedItem[]>([]);

  const isViewer = user?.role === 'viewer';

  useEffect(() => {
    // Calculate dynamic stats
    const totalPurchaseOrdersCount = MOCK_PURCHASE_ORDERS.length;
    const pendingApprovalsCount = MOCK_PURCHASE_ORDERS.filter(po => po.status === "Pending").length;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    let totalSpentThisMonthInMMK = 0;
    MOCK_PURCHASE_ORDERS.forEach(po => {
      const orderDate = new Date(po.orderDate);
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        if (po.currency === "MMK") {
          totalSpentThisMonthInMMK += po.grandTotal;
        } else {
          totalSpentThisMonthInMMK += po.grandTotal * (po.currencyRate || 1); // Assume rate 1 if not specified
        }
      }
    });

    setDashboardStats([
      { title: "Total Purchase Orders", value: totalPurchaseOrdersCount.toLocaleString('en-US'), icon: ShoppingCart, color: "text-primary" },
      { title: "Pending Approvals", value: pendingApprovalsCount.toLocaleString('en-US'), icon: ListChecks, color: "text-yellow-500" },
      { title: "Total Spent (This Month)", value: `${Math.round(totalSpentThisMonthInMMK).toLocaleString('en-US')} MMK`, icon: DollarSign, color: "text-destructive" },
    ]);

    // Calculate most ordered items
    const itemDetails: { [itemName: string]: { quantity: number; itemCode?: string } } = {};
    MOCK_PURCHASE_ORDERS.forEach(po => {
      po.items.forEach(item => {
        if (!itemDetails[item.name]) {
          // Initialize with quantity 0 and the itemCode from the first encountered item with this name
          itemDetails[item.name] = { quantity: 0, itemCode: item.itemCode };
        }
        itemDetails[item.name].quantity += item.quantity;
        // If itemCode wasn't set during initialization (e.g. first item had no code), try to set it.
        if (!itemDetails[item.name].itemCode && item.itemCode) {
            itemDetails[item.name].itemCode = item.itemCode;
        }
      });
    });

    const aggregatedItems = Object.entries(itemDetails)
      .map(([name, details]) => ({ name, quantity: details.quantity, itemCode: details.itemCode }))
      .sort((a, b) => b.quantity - a.quantity);

    const rankedTopItems = aggregatedItems.slice(0, 5).map((item, index) => ({
      rank: index + 1,
      itemCode: item.itemCode,
      name: item.name,
      quantity: item.quantity,
    }));
    setTopOrderedItems(rankedTopItems);

  }, []);


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
          {dashboardStats.map((stat, index) => (
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
                        {!isViewer && (
                          <>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Total (MMK)</TableHead>
                          </>
                        )}
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
                            {!isViewer && (
                              <>
                                <TableCell className="text-right">
                                  {formatCurrency(po.grandTotal, po.currency)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(totalInMMK, "MMK")}
                                </TableCell>
                              </>
                            )}
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
                <Award className="mr-2 h-5 w-5 text-accent" />
                Most Ordered Items
              </CardTitle>
              <CardDescription>
                Top 5 items by total quantity ordered.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topOrderedItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Rank</TableHead>
                        <TableHead>Item Code</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead className="text-right">Total Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topOrderedItems.map((item) => (
                        <TableRow key={item.rank}>
                          <TableCell className="font-medium text-center">{item.rank}</TableCell>
                          <TableCell>{item.itemCode || "N/A"}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                 <p className="text-muted-foreground">No item data available to rank.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </MainAppLayout>
    </AuthGuard>
  );
}
