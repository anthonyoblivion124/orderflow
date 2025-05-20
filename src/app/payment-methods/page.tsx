
"use client";

import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MOCK_PAYMENT_METHODS } from "@/lib/mockData";
import PaymentMethodsTable from "@/components/payment-methods/PaymentMethodsTable";
import { useState, useEffect } from "react";
import type { PaymentMethod } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader"; 
import { useToast } from "@/hooks/use-toast";

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      setPaymentMethods(MOCK_PAYMENT_METHODS);
      setIsLoading(false);
    }, 300); // Shorter delay for simpler data
  }, []);

  const handleDeletePaymentMethod = (methodId: string, methodName: string) => {
    // In a real app, call API then update state
    // For now, directly manipulate MOCK_PAYMENT_METHODS for demo
    const index = MOCK_PAYMENT_METHODS.findIndex(m => m.id === methodId);
    if (index > -1) {
      MOCK_PAYMENT_METHODS.splice(index, 1);
    }
    setPaymentMethods(prev => prev.filter(s => s.id !== methodId));
    toast({
      title: "Payment Method Deleted",
      description: `Payment method "${methodName}" has been removed.`,
    });
  };

  const filteredPaymentMethods = paymentMethods.filter(method =>
    method.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin", "manager"]}>
        <MainAppLayout>
          <FullScreenLoader message="Loading payment methods..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin", "manager"]}>
      <MainAppLayout>
        <PageHeader
          title="Payment Methods"
          description="Manage the payment methods available in the system."
          action={
            <Button asChild>
              <Link href="/payment-methods/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Method
              </Link>
            </Button>
          }
        />
        <PaymentMethodsTable 
          paymentMethods={filteredPaymentMethods} 
          onDelete={handleDeletePaymentMethod}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />
      </MainAppLayout>
    </AuthGuard>
  );
}
