
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import PaymentMethodForm from "@/components/payment-methods/PaymentMethodForm";
import type { PaymentMethodFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { MOCK_PAYMENT_METHODS } from "@/lib/mockData";
import type { PaymentMethod } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditPaymentMethodPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      // Simulate fetching data
      setTimeout(() => {
        const foundMethod = MOCK_PAYMENT_METHODS.find(m => m.id === id);
        if (foundMethod) {
          setPaymentMethod(foundMethod);
        } else {
           router.push("/payment-methods?error=notfound_edit");
        }
        setIsLoading(false);
      }, 300);
    }
  }, [id, router]);

  const handleSubmit = async (data: PaymentMethodFormData) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const methodIndex = MOCK_PAYMENT_METHODS.findIndex(m => m.id === id);
    if (methodIndex !== -1) {
      MOCK_PAYMENT_METHODS[methodIndex] = {
        ...MOCK_PAYMENT_METHODS[methodIndex],
        ...data,
        // isActive: data.isActive !== undefined ? data.isActive : MOCK_PAYMENT_METHODS[methodIndex].isActive, // if isActive is part of form
        updatedAt: new Date().toISOString(),
      };
    }
    
    setIsSubmitting(false);
    toast({
      title: "Payment Method Updated",
      description: `"${data.name}" has been successfully updated.`,
    });
    router.push("/payment-methods");
  };

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin", "manager"]}>
        <MainAppLayout>
          <FullScreenLoader message="Loading payment method for editing..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  if (!paymentMethod) {
    return (
      <AuthGuard allowedRoles={["admin", "manager"]}>
        <MainAppLayout>
          <PageHeader title="Payment Method Not Found" />
          <p>The payment method you are trying to edit does not exist.</p>
           <Button variant="outline" asChild className="mt-4">
            <Link href="/payment-methods"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Payment Methods</Link>
          </Button>
        </MainAppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin", "manager"]}>
      <MainAppLayout>
        <PageHeader
          title="Edit Payment Method"
        />
        <PaymentMethodForm onSubmit={handleSubmit} initialData={paymentMethod} isSubmitting={isSubmitting} />
      </MainAppLayout>
    </AuthGuard>
  );
}
