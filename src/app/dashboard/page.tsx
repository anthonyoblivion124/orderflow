
"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, ListChecks, ShoppingCart, Award } from "lucide-react";
import { MOCK_PURCHASE_ORDERS } from "@/lib/mockData";
import type { PurchaseOrder } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link"; // Keep for other links if any, but not for row navigation
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation"; // Import useRouter

interface RankedItem {
  rank: number;
  itemCode?: string;
  name: string;
  quantity: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter(); // Initialize router
  const [dashboardStats, setDashboardStats] = useState([
    { title: "Total Purchase Orders", value: "0", icon: ShoppingCart, color: "text-primary" },
    { title: "Pending Approvals", value: "0", icon: ListChecks, color: "text-yellow-500" },
    { title: "Total Spent (This Month)", value: "0 MMK", icon: DollarSign, color: "text-destructive" },
  ]);
  const [topOrderedItems, setTopOrderedItems] = useState<RankedItem[]>([]);

  const isViewer = user?.role === 'viewer';

  useEffect(() => {
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
          totalSpentThisMonthInMMK += po.grandTotal * (po.currencyRate || 1); 
        }
      }
    });

    setDashboardStats([
      { title: "Total Purchase Orders", value: totalPurchaseOrdersCount.toLocaleString('en-US'), icon: ShoppingCart, color: "text-primary" },
      { title: "Pending Approvals", value: pendingApprovalsCount.toLocaleString('en-US'), icon: ListChecks, color: "text-yellow-500" },
      { title: "Total Spent (This Month)", value: `${Math.round(totalSpentThisMonthInMMK).toLocaleString('en-US')} MMK`, icon: DollarSign, color: "text-destructive" },
    ]);

    const itemDetails: { [itemName: string]: { quantity: number; itemCode?: string } } = {};
    MOCK_PURCHASE_ORDERS.forEach(po => {
      po.items.forEach(item => {
        if (!itemDetails[item.name]) {
          itemDetails[item.name] = { quantity: 0, itemCode: item.itemCode };
        }
        itemDetails[item.name].quantity += item.quantity;
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


  const recentPOs = MOCK_PURCHASE_ORDERS
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, 5);

  const formatDisplayCurrency = (amount: number, currencyCode: string) => {
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
                        <TableHead>Order Date</TableHead>
                        <TableHead>Supplier</TableHead>
                        {!isViewer && (
                          <>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Total (MMK)</TableHead>
                          </>
                        )}
                        {/* Removed View column header */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPOs.map((po) => {
                        const totalInMMK = po.currency === "MMK" 
                          ? po.grandTotal 
                          : po.grandTotal * (po.currencyRate || 0); 
                        
                        return (
                          <TableRow 
                            key={po.id} 
                            onClick={() => router.push(`/purchase-orders/${po.id}`)}
                            className="cursor-pointer hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">{po.poNumber}</TableCell>
                            <TableCell>{format(new Date(po.orderDate), "dd MMM yyyy")}</TableCell>
                            <TableCell>{po.supplierName}</TableCell>
                            {!isViewer && (
                              <>
                                <TableCell className="text-right">
                                  {formatDisplayCurrency(po.grandTotal, po.currency)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatDisplayCurrency(totalInMMK, "MMK")}
                                </TableCell>
                              </>
                            )}
                            {/* Removed View button cell */}
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

