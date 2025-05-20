
"use client";

import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MOCK_PURCHASE_ORDERS, MOCK_SUPPLIERS } from "@/lib/mockData"; // Added MOCK_SUPPLIERS import
import PurchaseOrdersTable from "@/components/purchase-orders/PurchaseOrdersTable";
import { useState, useEffect } from "react";
import type { PurchaseOrder } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader";
import { useToast } from "@/hooks/use-toast";

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      // Corrected mock data join:
      const enrichedPOs = MOCK_PURCHASE_ORDERS.map(po => {
        const supplier = MOCK_SUPPLIERS.find(s => s.id === po.supplierId);
        return { ...po, supplierName: supplier ? supplier.name : 'Unknown Supplier' };
      });
      setPurchaseOrders(enrichedPOs);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleDeletePurchaseOrder = (poId: string) => {
    // In a real app, call API then update state
    setPurchaseOrders(prev => prev.filter(po => po.id !== poId));
    toast({ title: "Purchase Order Deleted", description: "PO has been removed." });
  };

  const filteredPurchaseOrders = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (po.supplierName && po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
        <MainAppLayout>
          <FullScreenLoader message="Loading purchase orders..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }
  
  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
      <MainAppLayout>
        <PageHeader
          title="Purchase Orders"
          description="Track and manage all your purchase orders."
          action={
            <Button asChild>
              <Link href="/purchase-orders/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New PO
              </Link>
            </Button>
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

