
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MOCK_SUPPLIERS, MOCK_PURCHASE_ORDERS } from "@/lib/mockData";
import type { Supplier, PurchaseOrder } from "@/types";
import { ArrowLeft, Edit, Mail, Phone, MapPin, ShoppingCart } from "lucide-react";
import FullScreenLoader from "@/components/FullScreenLoader";
import { format } from "date-fns";
import PurchaseOrdersTable from "@/components/purchase-orders/PurchaseOrdersTable"; // To be created
import { useAuth } from "@/hooks/useAuth";


export default function ViewSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [relatedPOs, setRelatedPOs] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasRole } = useAuth();
  const canEdit = hasRole(['admin', 'manager']);

  useEffect(() => {
    if (id) {
      // Simulate fetching data
      setTimeout(() => {
        const foundSupplier = MOCK_SUPPLIERS.find(s => s.id === id);
        if (foundSupplier) {
          setSupplier(foundSupplier);
          const pos = MOCK_PURCHASE_ORDERS.filter(po => po.supplierId === id);
          setRelatedPOs(pos);
        } else {
          // Handle not found, maybe redirect or show error
          router.push("/suppliers?error=notfound");
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id, router]);

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
        <MainAppLayout>
           <FullScreenLoader message="Loading supplier details..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  if (!supplier) {
     return ( // Fallback if supplier is still null after loading, though router.push should handle it
      <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
        <MainAppLayout>
          <PageHeader title="Supplier Not Found" />
          <p>The supplier you are looking for does not exist or could not be loaded.</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/suppliers"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Suppliers</Link>
          </Button>
        </MainAppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
      <MainAppLayout>
        <PageHeader
          title={supplier.name}
          description={`Details for supplier ID: ${supplier.id}`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/suppliers"><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Link>
              </Button>
              {canEdit && (
              <Button asChild>
                <Link href={`/suppliers/${supplier.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Supplier
                </Link>
              </Button>
              )}
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Contact Person</h3>
                <p className="text-foreground">{supplier.contactPerson}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                <p className="flex items-center text-foreground">
                  <Mail className="mr-2 h-4 w-4 text-accent" />
                  <a href={`mailto:${supplier.email}`} className="hover:underline">{supplier.email}</a>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                <p className="flex items-center text-foreground">
                  <Phone className="mr-2 h-4 w-4 text-accent" />
                  {supplier.phone}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                <p className="flex items-start text-foreground">
                  <MapPin className="mr-2 h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>{supplier.address}</span>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
                <p className="text-foreground">{format(new Date(supplier.createdAt), "dd MMMM, yyyy")}</p>
              </div>
               <div>
                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                <p className="text-foreground">{format(new Date(supplier.updatedAt), "dd MMMM, yyyy")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5 text-primary" /> Purchase Orders
              </CardTitle>
              <CardDescription>Purchase orders associated with {supplier.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              {relatedPOs.length > 0 ? (
                <PurchaseOrdersTable purchaseOrders={relatedPOs} onDelete={() => {}} searchTerm="" onSearchTermChange={() => {}} minimal={true} />
              ) : (
                <p className="text-muted-foreground">No purchase orders found for this supplier.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </MainAppLayout>
    </AuthGuard>
  );
}
