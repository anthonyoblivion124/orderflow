
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { MOCK_PURCHASE_ORDERS, MOCK_SUPPLIERS } from "@/lib/mockData";
import type { PurchaseOrder, Supplier } from "@/types";
import { ArrowLeft, Edit, Printer, DollarSign, CalendarDays, Truck, Info, CheckCircle, XCircle, Settings2, FileText, CreditCard, EyeOff, Eye } from "lucide-react";
import FullScreenLoader from "@/components/FullScreenLoader";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";


export default function ViewPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, hasRole } = useAuth();
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(true);

  const canEditPO = (status: PurchaseOrder["status"]) => {
    return hasRole(['admin', 'manager']) && status === "Pending";
  };

  useEffect(() => {
    if (id) {
      setTimeout(() => {
        const foundPO = MOCK_PURCHASE_ORDERS.find(p => p.id === id);
        if (foundPO) {
          setPo(foundPO);
          const foundSupplier = MOCK_SUPPLIERS.find(s => s.id === foundPO.supplierId);
          setSupplier(foundSupplier || null);
        } else {
          router.push("/purchase-orders?error=notfound");
        }
        setIsLoading(false);
      }, 500);
    }
  }, [id, router]);

  const getStatusIcon = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "Pending": return <Info className="h-5 w-5 text-yellow-500" />;
      case "Payment Required": return <FileText className="h-5 w-5 text-orange-500" />;
      case "Completed": return <CheckCircle className="h-5 w-5 text-primary" />;
      default: return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  const getStatusBadgeVariant = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "Completed":
        return "default"; 
      case "Pending":
        return "secondary"; 
      case "Payment Required":
        return "outline"; 
      default:
        return "secondary";
    }
  };


  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
        <MainAppLayout>
          <FullScreenLoader message="Loading purchase order details..." />
        </MainAppLayout>
      </AuthGuard>
    );
  }

  if (!po) {
    return (
      <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
        <MainAppLayout>
          <PageHeader title="Purchase Order Not Found" />
           <Button variant="outline" asChild className="mt-4">
            <Link href="/purchase-orders"><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Link>
          </Button>
        </MainAppLayout>
      </AuthGuard>
    );
  }

  const totalPaid = po.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const amountDue = po.grandTotal - totalPaid;

  const isViewer = user?.role === 'viewer';

  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
      <MainAppLayout>
        <PageHeader
          title={`Purchase Order: ${po.poNumber}`}
          description={`Details for PO created on ${format(new Date(po.orderDate), "PPP")}`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/purchase-orders"><ArrowLeft className="mr-2 h-4 w-4"/> Back to List</Link>
              </Button>
              {canEditPO(po.status) && (
              <Button asChild>
                <Link href={`/purchase-orders/${po.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit PO
                </Link>
              </Button>
              )}
              {isViewer && (
                <Button variant="secondary" onClick={() => setShowSensitiveInfo(prev => !prev)}>
                  {showSensitiveInfo ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                  {showSensitiveInfo ? "Hide Details" : "Show Details"}
                </Button>
              )}
            </div>
          }
        />

        <Card className="shadow-xl">
          <CardHeader className="bg-muted/30 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="text-2xl">PO #{po.poNumber}</CardTitle>
                    <CardDescription>
                        {isViewer && !showSensitiveInfo ? (
                            "Supplier: [Hidden]"
                        ) : (
                            <>
                             Supplier: <Link href={`/suppliers/${po.supplierId}`} className="text-primary hover:underline">{supplier?.name || po.supplierId}</Link>
                            </>
                        )}
                    </CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(po.status)} className="px-3 py-1.5 text-sm">
                  {getStatusIcon(po.status)}
                  <span className="ml-2">{po.status}</span>
                </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-accent"/>Order Date</p>
                <p className="font-medium">{format(new Date(po.orderDate), "PPP")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-accent"/>Expected Delivery</p>
                <p className="font-medium">{format(new Date(po.expectedDeliveryDate), "PPP")}</p>
              </div>
               <div className="space-y-1">
                <p className="text-muted-foreground flex items-center"><DollarSign className="mr-2 h-4 w-4 text-accent"/>Currency Info</p>
                <p className="font-medium">
                    {po.currency} 
                    {isViewer && !showSensitiveInfo ? (
                        " (Rate: [Hidden])"
                    ) : (
                        ` (Rate: ${po.currencyRate.toFixed(4)})`
                    )}
                </p>
              </div>
            </div>
            
            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Items Ordered</h3>
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[25%]">Item Code</TableHead>
                      <TableHead className="w-[35%]">Item Name</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.itemCode || "N/A"}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.price)}</TableCell>
                        <TableCell className="text-right font-semibold">{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end items-center mt-4 pt-4 border-t">
                <div className="text-right">
                    <p className="text-muted-foreground text-sm">Subtotal</p>
                    <p className="text-lg font-semibold text-foreground">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: po.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(po.grandTotal)}
                    </p>
                    <p className="text-xl font-bold text-primary mt-1">
                        Grand Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: po.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(po.grandTotal)}
                    </p>
                </div>
            </div>

            {po.payments && po.payments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-accent" /> Payment Details
                  </h3>
                  <div className="overflow-x-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment Method</TableHead>
                          <TableHead className="text-right">Amount Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {po.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.method}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: po.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(payment.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 text-right space-y-1">
                     <p className="text-md font-medium">
                        Total Paid: {new Intl.NumberFormat('en-US', { style: 'currency', currency: po.currency }).format(totalPaid)}
                     </p>
                     <p className={`text-md font-semibold ${amountDue > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        Amount Due: {new Intl.NumberFormat('en-US', { style: 'currency', currency: po.currency }).format(amountDue)}
                     </p>
                  </div>
                </div>
              </>
            )}
            
            {po.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap p-4 border rounded-md bg-muted/20">{po.notes}</p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 p-4 text-xs text-muted-foreground border-t">
            <div className="flex justify-between w-full">
              <span>Created by: User ID {po.createdBy} on {format(new Date(po.createdAt), "PPPp")}</span>
              <span>Last updated: {format(new Date(po.updatedAt), "PPPp")}</span>
            </div>
          </CardFooter>
        </Card>
      </MainAppLayout>
    </AuthGuard>
  );
}


    