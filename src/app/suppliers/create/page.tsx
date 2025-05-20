
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import SupplierForm from "@/components/suppliers/SupplierForm";
import type { SupplierFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { MOCK_SUPPLIERS, getNewSupplierId } from "@/lib/mockData"; // For demo
import { useAuth } from "@/hooks/useAuth";

export default function CreateSupplierPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (data: SupplierFormData) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newSupplier = {
      id: getNewSupplierId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_SUPPLIERS.push(newSupplier); // Add to mock data for demo
    
    setIsSubmitting(false);
    toast({
      title: "Supplier Created",
      description: `${data.name} has been successfully added.`,
    });
    router.push("/suppliers");
  };

  return (
    <AuthGuard allowedRoles={["admin", "manager"]}>
      <MainAppLayout>
        <PageHeader
          title="Add New Supplier"
          description="Enter the details of the new supplier."
        />
        <SupplierForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </MainAppLayout>
    </AuthGuard>
  );
}
