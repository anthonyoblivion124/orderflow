
"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign, ListChecks, ShoppingCart, Users } from "lucide-react";

// Mock data for dashboard stats
const stats = [
  { title: "Total Purchase Orders", value: "1,234", icon: ShoppingCart, color: "text-primary" },
  { title: "Pending Approvals", value: "56", icon: ListChecks, color: "text-yellow-500" },
  { title: "Active Suppliers", value: "230", icon: Users, color: "text-green-500" },
  { title: "Total Spent (This Month)", value: "$125,670", icon: DollarSign, color: "text-destructive" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
      <MainAppLayout>
        <PageHeader
          title={`Welcome, ${user?.name || user?.email || "User"}!`}
          description="Here's an overview of your procurement activities."
        />
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
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
              <p className="text-muted-foreground">
                Display a list or chart of recent POs here.
              </p>
              <div className="mt-4 h-64 flex items-center justify-center bg-muted/50 rounded-md">
                 <span className="text-muted-foreground">Chart placeholder</span>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Supplier Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Information about top suppliers or supplier-related tasks.
              </p>
               <div className="mt-4 h-64 flex items-center justify-center bg-muted/50 rounded-md">
                 <span className="text-muted-foreground">Activity feed placeholder</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainAppLayout>
    </AuthGuard>
  );
}
