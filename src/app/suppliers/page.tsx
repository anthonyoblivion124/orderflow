
"use client";

import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MOCK_SUPPLIERS } from "@/lib/mockData";
import SuppliersTable from "@/components/suppliers/SuppliersTable"; // To be created
import { useState, useEffect } from "react";
import type { Supplier } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader"; // Assuming this component exists

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      setSuppliers(MOCK_SUPPLIERS);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleDeleteSupplier = (supplierId: string) => {
    // In a real app, call API then update state
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    // toast({ title: "Supplier Deleted", description: "Supplier has been removed." });
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
        <MainAppLayout>
          <FullScreenLoader message="Loading suppliers..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
      <MainAppLayout>
        <PageHeader
          title="Suppliers"
          description="Manage your company's suppliers and their details."
          action={
            <Button asChild>
              <Link href="/suppliers/create">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Supplier
              </Link>
            </Button>
          }
        />
        <SuppliersTable 
          suppliers={filteredSuppliers} 
          onDelete={handleDeleteSupplier}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />
      </MainAppLayout>
    </AuthGuard>
  );
}
