
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
import { paymentMethodSchema, type PaymentMethodFormData } from "@/lib/schemas";
import type { PaymentMethod } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface PaymentMethodFormProps {
  onSubmit: (data: PaymentMethodFormData) => Promise<void>;
  initialData?: PaymentMethod;
  isSubmitting?: boolean;
}

export default function PaymentMethodForm({ onSubmit, initialData, isSubmitting }: PaymentMethodFormProps) {
  const form = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: initialData 
    ? { 
        name: initialData.name,
        // description: initialData.description || "",
        // isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      } 
    : {
        name: "",
        // description: "",
        // isActive: true,
      },
  });

  const handleSubmit = async (data: PaymentMethodFormData) => {
    await onSubmit(data);
    if (!initialData) { // Reset form only on create
      form.reset();
    }
  };

  return (
    <Card className="shadow-lg max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Payment Method" : "Create New Payment Method"}</CardTitle>
        <CardDescription>
          {initialData ? "Update the details of this payment method." : "Fill in the form to add a new payment method."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., KBZ Bank Transfer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 
            Future fields:
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., For online bank transfers to KBZ account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Inactive payment methods will not be available for selection.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            /> 
            */}
          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-6 border-t">
            <Button type="button" variant="outline" asChild>
              <Link href="/payment-methods">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Payment Method"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
