
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import PurchaseOrderForm from "@/components/purchase-orders/PurchaseOrderForm";
import type { PurchaseOrderFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { MOCK_PURCHASE_ORDERS, MOCK_SUPPLIERS } from "@/lib/mockData";
import type { PurchaseOrder, Supplier } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      // Simulate fetching data
      setTimeout(() => {
        const foundPO = MOCK_PURCHASE_ORDERS.find(p => p.id === id);
        if (foundPO) {
          if (foundPO.status !== "Pending") { // Only "Pending" POs can be edited
             toast({ title: "Edit Not Allowed", description: `PO in '${foundPO.status}' status cannot be edited.`, variant: "destructive"});
             router.push(`/purchase-orders/${id}`); // Redirect to view page
             return;
          }
          setPo(foundPO);
        } else {
          router.push("/purchase-orders?error=notfound_edit");
        }
        setSuppliers(MOCK_SUPPLIERS); // Load suppliers for the form
        setIsLoading(false);
      }, 500);
    }
  }, [id, router, toast]);

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const poIndex = MOCK_PURCHASE_ORDERS.findIndex(p => p.id === id);
    if (poIndex !== -1) {
      const grandTotal = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const supplierName = suppliers.find(s => s.id === data.supplierId)?.name || "Unknown Supplier";

      MOCK_PURCHASE_ORDERS[poIndex] = {
        ...MOCK_PURCHASE_ORDERS[poIndex],
        ...data,
        orderDate: data.orderDate.toISOString(),
        expectedDeliveryDate: data.expectedDeliveryDate.toISOString(),
        items: data.items.map(item => ({
            ...item,
            id: item.id || `item-${Date.now()}-${Math.random()}`, // Keep existing ID or generate new
            total: item.quantity * item.price,
        })),
        grandTotal,
        supplierName,
        updatedAt: new Date().toISOString(),
      };
    }
    
    setIsSubmitting(false);
    toast({
      title: "Purchase Order Updated",
      description: `PO ${po?.poNumber || ''} has been successfully updated.`,
    });
    router.push(`/purchase-orders/${id}`); // Redirect to view page after edit
  };

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin", "manager"]}>
        <MainAppLayout>
          <FullScreenLoader message="Loading PO for editing..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  if (!po) {
     return (
      <AuthGuard allowedRoles={["admin", "manager"]}>
        <MainAppLayout>
          <PageHeader title="Purchase Order Not Found" />
          <p>The PO you are trying to edit does not exist or cannot be loaded.</p>
           <Button variant="outline" asChild className="mt-4">
            <Link href="/purchase-orders"><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Link>
          </Button>
        </MainAppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin", "manager"]}>
      <MainAppLayout>
        <PageHeader
          title="Edit Purchase Order"
        />
        <PurchaseOrderForm onSubmit={handleSubmit} initialData={po} suppliers={suppliers} isSubmitting={isSubmitting} />
      </MainAppLayout>
    </AuthGuard>
  );
}
