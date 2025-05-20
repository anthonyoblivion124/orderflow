
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { purchaseOrderSchema, type PurchaseOrderFormData } from "@/lib/schemas";
import type { PurchaseOrder, Supplier, PaymentDetail } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, PlusCircle, Trash2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import PurchaseOrderItemField from "./PurchaseOrderItemField";
import PurchaseOrderPaymentField from "./PurchaseOrderPaymentField"; // Import new component
import { PO_STATUSES, CURRENCIES } from "@/lib/constants";
import { useEffect } from "react";

interface PurchaseOrderFormProps {
  onSubmit: (data: PurchaseOrderFormData) => Promise<void>;
  initialData?: PurchaseOrder; 
  suppliers: Supplier[]; 
  isSubmitting?: boolean;
}

export default function PurchaseOrderForm({ onSubmit, initialData, suppliers, isSubmitting }: PurchaseOrderFormProps) {
  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: initialData 
    ? {
        ...initialData,
        orderDate: new Date(initialData.orderDate),
        expectedDeliveryDate: new Date(initialData.expectedDeliveryDate),
        items: initialData.items.map(item => ({ 
            id: item.id,
            itemCode: item.itemCode || "",
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        payments: initialData.payments?.map(payment => ({ // Map payments
            id: payment.id,
            method: payment.method,
            amount: payment.amount,
        })) || [],
      } 
    : {
        supplierId: "",
        orderDate: new Date(),
        expectedDeliveryDate: new Date(new Date().setDate(new Date().getDate() + 7)), 
        items: [{ itemCode: "", name: "", quantity: 1, price: 0 }],
        currency: "MMK", 
        currencyRate: 1.0, 
        status: "Pending", 
        payments: [], // Default empty payments array
        notes: "",
      },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control: form.control,
    name: "payments",
  });

  const watchedItems = form.watch("items");
  const grandTotal = watchedItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);

  const handleSubmit = async (data: PurchaseOrderFormData) => {
    await onSubmit(data);
     if (!initialData) {
       form.reset({ 
        supplierId: "",
        orderDate: new Date(),
        expectedDeliveryDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        items: [{ itemCode: "", name: "", quantity: 1, price: 0 }],
        currency: "MMK", 
        currencyRate: 1.0, 
        status: "Pending", 
        payments: [],
        notes: "",
       });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Purchase Order" : "Create New Purchase Order"}</CardTitle>
        <CardDescription>
          {initialData ? `Modifying PO: ${initialData.poNumber}` : "Fill in the details to create a new purchase order."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-8">
            {/* Basic Info Section */}
            <div className="space-y-6 p-6 border rounded-lg bg-card">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PO_STATUSES.map(status => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Order Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedDeliveryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expected Delivery Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4 p-6 border rounded-lg bg-card">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h3 className="text-lg font-semibold text-foreground">Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendItem({ itemCode: "", name: "", quantity: 1, price: 0 })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>
              {itemFields.map((field, index) => (
                <PurchaseOrderItemField key={field.id} index={index} onRemove={() => removeItem(index)} />
              ))}
              {itemFields.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No items added. Click "Add Item" to begin.</p>}
            </div>
            
            {/* Payment Details Section */}
            <div className="space-y-4 p-6 border rounded-lg bg-card">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-accent" /> Payment Details
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendPayment({ method: "", amount: 0 })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Payment
                </Button>
              </div>
              {paymentFields.map((field, index) => (
                <PurchaseOrderPaymentField key={field.id} index={index} onRemove={() => removePayment(index)} />
              ))}
              {paymentFields.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No payment details added. Click "Add Payment" to record a payment.</p>}
            </div>

            {/* Currency Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-lg bg-card">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map(curr => (
                            <SelectItem key={curr.code} value={curr.code}>
                              {curr.code} - {curr.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currencyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency Rate</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1.0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} step="0.000001" />
                    </FormControl>
                    <FormDescription className="text-xs">Rate against your base currency.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Notes Section */}
            <div className="p-6 border rounded-lg bg-card">
               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional notes for this purchase order..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Grand Total Display */}
             <div className="flex justify-end items-center p-4 border-t bg-muted/50 rounded-b-lg">
              <span className="text-lg font-semibold text-foreground">Grand Total:</span>
              <span className="text-xl font-bold text-primary ml-2">
                {form.getValues("currency")} {grandTotal.toFixed(2)}
              </span>
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-6 border-t">
            <Button type="button" variant="outline" asChild>
              <Link href="/purchase-orders">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Purchase Order"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
