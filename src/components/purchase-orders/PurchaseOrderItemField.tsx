
"use client";

import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import type { PurchaseOrderFormData } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface PurchaseOrderItemFieldProps {
  index: number;
  onRemove: (index: number) => void;
}

export default function PurchaseOrderItemField({ index, onRemove }: PurchaseOrderItemFieldProps) {
  const { control, watch, setValue } = useFormContext<PurchaseOrderFormData>();
  
  const quantity = watch(`items.${index}.quantity`);
  const price = watch(`items.${index}.price`);

  // Auto-calculate total (for display, not part of form data directly for item total)
  const itemTotal = (quantity || 0) * (price || 0);

  return (
    <div className="grid grid-cols-12 gap-x-4 gap-y-2 items-start p-4 border rounded-md relative bg-card">
      <FormField
        control={control}
        name={`items.${index}.itemCode`}
        render={({ field }) => (
          <FormItem className="col-span-12 sm:col-span-2">
            <FormLabel className="text-xs">Item Code</FormLabel>
            <FormControl>
              <Input placeholder="e.g., SKU123" {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`items.${index}.name`}
        render={({ field }) => (
          <FormItem className="col-span-12 sm:col-span-3">
            <FormLabel className="text-xs">Item Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Laptop Pro" {...field} />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`items.${index}.quantity`}
        render={({ field }) => (
          <FormItem className="col-span-6 sm:col-span-2">
            <FormLabel className="text-xs">Quantity</FormLabel>
            <FormControl>
              <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`items.${index}.price`}
        render={({ field }) => (
          <FormItem className="col-span-6 sm:col-span-2">
            <FormLabel className="text-xs">Unit Price</FormLabel>
            <FormControl>
              <Input type="number" placeholder="999.99" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} step="0.01"/>
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
      <div className="col-span-10 sm:col-span-2 flex flex-col justify-end h-full pb-1">
         <FormLabel className="text-xs text-muted-foreground">Line Total</FormLabel>
        <span className="text-sm font-medium pt-[9px]">
          {isNaN(itemTotal) ? "N/A" : itemTotal.toFixed(2)}
        </span>
      </div>
      <div className="col-span-2 sm:col-span-1 flex items-end justify-end h-full pb-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label="Remove item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
