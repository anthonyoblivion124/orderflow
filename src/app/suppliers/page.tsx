
"use client";

import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MOCK_SUPPLIERS } from "@/lib/mockData";
import SuppliersTable from "@/components/suppliers/SuppliersTable";
import { useState, useEffect } from "react";
import type { Supplier } from "@/types";
import FullScreenLoader from "@/components/FullScreenLoader"; 
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { hasFeaturePermission } = useAuth(); // Get hasFeaturePermission

  // Simulate fetching data
  useEffect(() => {
    setTimeout(() => {
      setSuppliers(MOCK_SUPPLIERS);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleDeleteSupplier = (supplierId: string) => {
    // In a real app, call API then update state
    // The toast notification is now handled within SuppliersTable after confirmation
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin", "manager", "viewer"]} requiredFeature="viewSuppliers">
        <MainAppLayout>
          <FullScreenLoader message="Loading suppliers..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]} requiredFeature="viewSuppliers">
      <MainAppLayout>
        <PageHeader
          title="Suppliers"
          description="Manage your company's suppliers and their details."
          action={
            hasFeaturePermission("manageSuppliers") ? ( // Check permission for button
              <Button asChild>
                <Link href="/suppliers/create">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Supplier
                </Link>
              </Button>
            ) : null
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
