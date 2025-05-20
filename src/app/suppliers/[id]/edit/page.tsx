
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import SupplierForm from "@/components/suppliers/SupplierForm";
import type { SupplierFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { MOCK_SUPPLIERS } from "@/lib/mockData"; // For demo
import type { Supplier } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      // Simulate fetching data
      setTimeout(() => {
        const foundSupplier = MOCK_SUPPLIERS.find(s => s.id === id);
        if (foundSupplier) {
          setSupplier(foundSupplier);
        } else {
           router.push("/suppliers?error=notfound_edit");
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id, router]);

  const handleSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const supplierIndex = MOCK_SUPPLIERS.findIndex(s => s.id === id);
    if (supplierIndex !== -1) {
      MOCK_SUPPLIERS[supplierIndex] = {
        ...MOCK_SUPPLIERS[supplierIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };
    }
    
    setIsSubmitting(false);
    toast({
      title: "Supplier Updated",
      description: `${data.name} has been successfully updated.`,
    });
    router.push("/suppliers");
  };

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin", "manager"]}>
        <MainAppLayout>
          <FullScreenLoader message="Loading supplier for editing..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  if (!supplier) {
    return (
      <AuthGuard allowedRoles={["admin", "manager"]}>
        <MainAppLayout>
          <PageHeader title="Supplier Not Found" />
          <p>The supplier you are trying to edit does not exist.</p>
           <Button variant="outline" asChild className="mt-4">
            <Link href="/suppliers"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Suppliers</Link>
          </Button>
        </MainAppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin", "manager"]}>
      <MainAppLayout>
        <PageHeader
          title="Edit Supplier"
        />
        <SupplierForm onSubmit={handleSubmit} initialData={supplier} isSubmitting={isSubmitting} />
      </MainAppLayout>
    </AuthGuard>
  );
}
