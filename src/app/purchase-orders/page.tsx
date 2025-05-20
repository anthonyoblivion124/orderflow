
"use client";

import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MOCK_PURCHASE_ORDERS, MOCK_SUPPLIERS } from "@/lib/mockData"; 
import PurchaseOrdersTable from "@/components/purchase-orders/PurchaseOrdersTable";
import { useState, useEffect } from "react";
import type { PurchaseOrder } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { hasFeaturePermission } = useAuth(); // Get hasFeaturePermission

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      const enrichedPOs = MOCK_PURCHASE_ORDERS.map(po => {
        const supplier = MOCK_SUPPLIERS.find(s => s.id === po.supplierId);
        return { ...po, supplierName: supplier ? supplier.name : 'Unknown Supplier' };
      }).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()); // Sort by orderDate descending
      setPurchaseOrders(enrichedPOs);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleDeletePurchaseOrder = (poId: string) => {
    // In a real app, call API then update state
    // For mock data, find and remove from MOCK_PURCHASE_ORDERS as well
    const index = MOCK_PURCHASE_ORDERS.findIndex(po => po.id === poId);
    if (index > -1) {
        MOCK_PURCHASE_ORDERS.splice(index, 1);
    }
    setPurchaseOrders(prev => prev.filter(po => po.id !== poId));
    toast({ title: "Purchase Order Deleted", description: "PO has been removed." });
  };

  const filteredPurchaseOrders = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (po.supplierName && po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin", "manager", "viewer"]} requiredFeature="viewPurchaseOrders">
        <MainAppLayout>
          <FullScreenLoader message="Loading purchase orders..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }
  
  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]} requiredFeature="viewPurchaseOrders">
      <MainAppLayout>
        <PageHeader
          title="Purchase Orders"
          description="Track and manage all your purchase orders."
          action={
            hasFeaturePermission("managePurchaseOrders") ? ( // Check permission for button
              <Button asChild>
                <Link href="/purchase-orders/create">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New PO
                </Link>
              </Button>
            ) : null
          }
        />
        <PurchaseOrdersTable 
          purchaseOrders={filteredPurchaseOrders} 
          onDelete={handleDeletePurchaseOrder}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />
      </MainAppLayout>
    </AuthGuard>
  );
}

