
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import PaymentMethodForm from "@/components/payment-methods/PaymentMethodForm";
import type { PaymentMethodFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { MOCK_PAYMENT_METHODS, getNewPaymentMethodId } from "@/lib/mockData";
import { useAuth } from "@/hooks/useAuth";

export default function CreatePaymentMethodPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); // For createdBy/updatedBy if those fields are added to PaymentMethod

  const handleSubmit = async (data: PaymentMethodFormData) => {
    if (!user) { // Basic auth check
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newPaymentMethod = {
      id: getNewPaymentMethodId(),
      ...data,
      // isActive: data.isActive !== undefined ? data.isActive : true, // if isActive is part of form
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_PAYMENT_METHODS.push(newPaymentMethod);
    
    setIsSubmitting(false);
    toast({
      title: "Payment Method Created",
      description: `"${data.name}" has been successfully added.`,
    });
    router.push("/payment-methods");
  };

  return (
    <AuthGuard allowedRoles={["admin", "manager"]}>
      <MainAppLayout>
        <PageHeader
          title="Add New Payment Method"
          description="Enter the details for the new payment method."
        />
        <PaymentMethodForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </MainAppLayout>
    </AuthGuard>
  );
}
