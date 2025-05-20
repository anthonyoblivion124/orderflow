
"use client";

import Link from "next/link";
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PenSquare, Trash2 } from "lucide-react";
import type { PaymentMethod } from "@/types";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethodsTableProps {
  paymentMethods: PaymentMethod[];
  onDelete: (methodId: string, methodName: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export default function PaymentMethodsTable({ paymentMethods, onDelete, searchTerm, onSearchTermChange }: PaymentMethodsTableProps) {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  // For payment methods, typically admin/manager roles handle this configuration
  const canManage = hasRole(['admin', 'manager']); 

  const handleDelete = (methodId: string, methodName: string) => {
    onDelete(methodId, methodName); // The actual deletion logic is in the page component
    // Toast is handled in page component after successful deletion from mockData
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <Input
            placeholder="Search payment methods by name..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="max-w-sm"
          />
        </div>
        {paymentMethods.length === 0 && !searchTerm && (
           <div className="text-center p-10 text-muted-foreground">
            No payment methods found. <Link href="/payment-methods/create" className="text-primary hover:underline">Add your first payment method</Link>.
          </div>
        )}
        {paymentMethods.length === 0 && searchTerm && (
           <div className="text-center p-10 text-muted-foreground">
            No payment methods found matching your search criteria.
          </div>
        )}
        {paymentMethods.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead>Last Updated</TableHead>
                {/* <TableHead>Status</TableHead> // If isActive field is added */}
                {canManage && <TableHead className="text-right w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((method) => (
                <TableRow key={method.id}>
                  <TableCell className="font-medium">{method.name}</TableCell>
                  <TableCell>{format(new Date(method.createdAt), "dd MMM yyyy")}</TableCell>
                  <TableCell>{format(new Date(method.updatedAt), "dd MMM yyyy")}</TableCell>
                  {/* 
                  TableCell for isActive status if implemented:
                  <TableCell>
                    <Badge variant={method.isActive ? "default" : "secondary"}>
                      {method.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell> 
                  */}
                  {canManage && (
                  <TableCell className="text-right">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                             <Link href={`/payment-methods/${method.id}/edit`} className="cursor-pointer">
                              <PenSquare className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                              onSelect={(e) => e.preventDefault()} // Prevents DropdownMenu from closing
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the payment method "{method.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(method.id, method.name)}
                            className={buttonVariants({ variant: "destructive" })}
                          >
                            Yes, delete payment method
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
