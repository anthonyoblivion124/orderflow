
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PenSquare, Trash2, Copy } from "lucide-react";
import type { PurchaseOrder } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  onDelete: (poId: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  minimal?: boolean; // For use in supplier detail page
}

export default function PurchaseOrdersTable({ purchaseOrders, onDelete, searchTerm, onSearchTermChange, minimal = false }: PurchaseOrdersTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, hasRole, hasFeaturePermission } = useAuth(); // Get user role
  
  const isViewer = user?.role === 'viewer';
  const canEditPO = (status: PurchaseOrder["status"]) => hasFeaturePermission("managePurchaseOrders") && status === "Pending";
  const canDeletePO = (status: PurchaseOrder["status"]) => hasRole(["admin"]) && status === "Pending";


  const copyToClipboard = (text: string, type: string, event: React.MouseEvent) => {
    event.stopPropagation(); 
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${type} Copied`, description: `${text} copied to clipboard.` });
    }).catch(err => {
      toast({ title: "Copy Failed", description: `Could not copy ${type}.`, variant: "destructive" });
    });
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

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        {!minimal && (
          <div className="p-4 border-b">
            <Input
              placeholder="Search POs (number, supplier)..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}
        {purchaseOrders.length === 0 && !searchTerm && !minimal && (
           <div className="text-center p-10 text-muted-foreground">
            No purchase orders found. 
            {hasFeaturePermission("managePurchaseOrders") && 
              <Link href="/purchase-orders/create" className="text-primary hover:underline"> Create your first PO</Link>
            }.
          </div>
        )}
         {purchaseOrders.length === 0 && searchTerm && !minimal && (
           <div className="text-center p-10 text-muted-foreground">
            No purchase orders found matching your search criteria.
          </div>
        )}
        {purchaseOrders.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                {!minimal && <TableHead>Supplier</TableHead>}
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Status</TableHead>
                {!isViewer && <TableHead className="text-right">Total Amount</TableHead>}
                {!minimal && <TableHead className="text-right w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow 
                  key={po.id} 
                  onClick={() => router.push(`/purchase-orders/${po.id}`)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <Button variant="link" className="p-0 h-auto" onClick={(e) => copyToClipboard(po.poNumber, "PO Number", e)}>
                      {po.poNumber} <Copy className="ml-2 h-3 w-3" />
                    </Button>
                  </TableCell>
                  {!minimal && <TableCell>{po.supplierName}</TableCell>}
                  <TableCell>{format(new Date(po.orderDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>{format(new Date(po.expectedDeliveryDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(po.status)}>{po.status}</Badge>
                  </TableCell>
                  {!isViewer && (
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: po.currency }).format(po.grandTotal)}
                      <span className="text-xs text-muted-foreground ml-1">({po.currency})</span>
                    </TableCell>
                  )}
                  {!minimal && (
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEditPO(po.status) && (
                        <DropdownMenuItem asChild>
                          <Link href={`/purchase-orders/${po.id}/edit`} className="cursor-pointer">
                            <PenSquare className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        )}
                        {canDeletePO(po.status) && (
                        <DropdownMenuItem onClick={() => onDelete(po.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
