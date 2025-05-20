
import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(2, { message: "Supplier name must be at least 2 characters." }).max(100),
  contactPerson: z.string().min(2, { message: "Contact person name must be at least 2 characters." }).max(100),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().min(7, { message: "Phone number seems too short." }).max(20),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }).max(200),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

export const purchaseOrderItemSchema = z.object({
  id: z.string().optional(), // For existing items during edit
  itemCode: z.string().max(50, "Item code cannot exceed 50 characters.").optional().nullable(),
  name: z.string().min(1, "Item name is required.").max(100),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  price: z.coerce.number().min(0.01, "Price must be greater than 0."),
});

export type PurchaseOrderItemFormData = z.infer<typeof purchaseOrderItemSchema>;

export const paymentDetailSchema = z.object({
  id: z.string().optional(), // For useFieldArray key and existing items
  method: z.string().min(1, "Payment method is required."),
  amount: z.coerce.number().min(0.01, "Payment amount must be greater than 0."),
});

export type PaymentDetailFormData = z.infer<typeof paymentDetailSchema>;

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required."),
  orderDate: z.date({ required_error: "Order date is required."}),
  expectedDeliveryDate: z.date({ required_error: "Expected delivery date is required."}),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required."),
  currency: z.string().min(3, "Currency code must be 3 characters.").max(3, "Currency code must be 3 characters."),
  currencyRate: z.coerce.number().min(0.000001, "Currency rate must be a positive number."),
  status: z.enum(["Pending", "Payment Required", "Completed"], {
    required_error: "Status is required.",
  }),
  payments: z.array(paymentDetailSchema).optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters.").optional(),
}).refine(data => data.expectedDeliveryDate >= data.orderDate, {
  message: "Expected delivery date cannot be earlier than order date.",
  path: ["expectedDeliveryDate"],
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

export const paymentMethodSchema = z.object({
  name: z.string().min(2, { message: "Payment method name must be at least 2 characters." }).max(100),
  // description: z.string().max(250, "Description cannot exceed 250 characters.").optional(),
  // isActive: z.boolean().default(true).optional(),
});

export type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;
