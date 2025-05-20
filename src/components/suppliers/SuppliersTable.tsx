
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
import { Button, buttonVariants } from "@/components/ui/button"; // Added buttonVariants import
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, MoreHorizontal, PenSquare, Trash2 } from "lucide-react";
import type { Supplier } from "@/types";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SuppliersTableProps {
  suppliers: Supplier[];
  onDelete: (supplierId: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export default function SuppliersTable({ suppliers, onDelete, searchTerm, onSearchTermChange }: SuppliersTableProps) {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const canEdit = hasRole(['admin', 'manager']);
  const canDelete = hasRole(['admin']);

  const handleDelete = (supplierId: string, supplierName: string) => {
    onDelete(supplierId);
    toast({
      title: "Supplier Deleted",
      description: `Supplier "${supplierName}" has been removed.`,
    });
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <Input
            placeholder="Search suppliers (name, email, contact)..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="max-w-sm"
          />
        </div>
        {suppliers.length === 0 && !searchTerm && (
           <div className="text-center p-10 text-muted-foreground">
            No suppliers found. <Link href="/suppliers/create" className="text-primary hover:underline">Add your first supplier</Link>.
          </div>
        )}
        {suppliers.length === 0 && searchTerm && (
           <div className="text-center p-10 text-muted-foreground">
            No suppliers found matching your search criteria.
          </div>
        )}
        {suppliers.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contactPerson}</TableCell>
                  <TableCell>{supplier.email}</TableCell>
                  <TableCell>{supplier.phone}</TableCell>
                  <TableCell>{format(new Date(supplier.createdAt), "dd MMM yyyy")}</TableCell>
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
                            <Link href={`/suppliers/${supplier.id}`} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>
                          {canEdit && (
                          <DropdownMenuItem asChild>
                             <Link href={`/suppliers/${supplier.id}/edit`} className="cursor-pointer">
                              <PenSquare className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                onSelect={(e) => e.preventDefault()} // Prevents DropdownMenu from closing
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the supplier "{supplier.name}" and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(supplier.id, supplier.name)}
                            className={buttonVariants({ variant: "destructive" })}
                          >
                            Yes, delete supplier
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
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
