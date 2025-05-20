
"use client";

import { useFormContext } from "react-hook-form";
import type { PurchaseOrderFormData } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_METHODS } from "@/lib/constants";

interface PurchaseOrderPaymentFieldProps {
  index: number;
  onRemove: (index: number) => void;
}

export default function PurchaseOrderPaymentField({ index, onRemove }: PurchaseOrderPaymentFieldProps) {
  const { control } = useFormContext<PurchaseOrderFormData>();

  return (
    <div className="grid grid-cols-12 gap-x-4 gap-y-2 items-start p-4 border rounded-md relative bg-card">
      <FormField
        control={control}
        name={`payments.${index}.method`}
        render={({ field }) => (
          <FormItem className="col-span-12 sm:col-span-5">
            <FormLabel className="text-xs">Payment Method</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PAYMENT_METHODS.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`payments.${index}.amount`}
        render={({ field }) => (
          <FormItem className="col-span-10 sm:col-span-5">
            <FormLabel className="text-xs">Amount</FormLabel>
            <FormControl>
              <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} step="0.01"/>
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
      <div className="col-span-2 sm:col-span-2 flex items-end justify-end h-full pb-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive mt-auto"
          aria-label="Remove payment"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
