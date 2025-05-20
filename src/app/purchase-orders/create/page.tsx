
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import PurchaseOrderForm from "@/components/purchase-orders/PurchaseOrderForm";
import type { PurchaseOrderFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { MOCK_PURCHASE_ORDERS, MOCK_SUPPLIERS, getNewPONumber, getNewPOId } from "@/lib/mockData";
import type { Supplier } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import FullScreenLoader from "@/components/FullScreenLoader";

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Simulate fetching suppliers
    setTimeout(() => {
      setSuppliers(MOCK_SUPPLIERS);
      setIsLoadingSuppliers(false);
    }, 300);
  }, []);

  const handleSubmit = async (data: PurchaseOrderFormData) => {
     if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const grandTotal = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const supplierName = suppliers.find(s => s.id === data.supplierId)?.name || "Unknown Supplier";

    const newPO = {
      id: getNewPOId(),
      poNumber: getNewPONumber(),
      supplierName,
      ...data,
      orderDate: data.orderDate.toISOString(),
      expectedDeliveryDate: data.expectedDeliveryDate.toISOString(),
      items: data.items.map(item => ({
        ...item,
        id: `item-${Date.now()}-${Math.random()}`, // Generate item ID
        total: item.quantity * item.price,
      })),
      grandTotal,
      createdBy: user.id, // Assuming user object has an id
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_PURCHASE_ORDERS.push(newPO);
    
    setIsSubmitting(false);
    toast({
      title: "Purchase Order Created",
      description: `PO ${newPO.poNumber} has been successfully created.`,
    });
    router.push("/purchase-orders");
  };

  if (isLoadingSuppliers) {
    return (
      <AuthGuard allowedRoles={["admin", "manager"]}>
        <MainAppLayout>
          <FullScreenLoader message="Loading form data..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin", "manager"]}>
      <MainAppLayout>
        <PageHeader
          title="Create New Purchase Order"
          description="Fill in the details for the new PO."
        />
        <PurchaseOrderForm onSubmit={handleSubmit} suppliers={suppliers} isSubmitting={isSubmitting} />
      </MainAppLayout>
    </AuthGuard>
  );
}
