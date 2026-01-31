"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { ROUTES } from "@/constants";
import { formatCurrency } from "@/lib/utils";
import gstInvoiceService from "@/services/gst/gstInvoice.service";

const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(0.01, "Quantity must be greater than 0"),
        rate: z.number().min(0, "Rate must be greater than or equal to 0"),
        taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
        hsnCode: z.string().min(1, "HSN Code is required"),
      })
    )
    .min(1, "At least one item is required"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function CreateInvoicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [{ description: "", quantity: 1, rate: 0, taxRate: 18, hsnCode: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach((item) => {
      const itemTotal = item.quantity * item.rate;
      subtotal += itemTotal;
      taxAmount += (itemTotal * item.taxRate) / 100;
    });

    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };

  const totals = calculateTotals();

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      await gstInvoiceService.createInvoice(data);
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      router.push(ROUTES.GST.INVOICES);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
        <p className="text-muted-foreground">Create a new GST invoice</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>Enter invoice information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer</Label>
                    <Input
                      id="customerId"
                      placeholder="Select customer"
                      {...register("customerId")}
                    />
                    {errors.customerId && (
                      <p className="text-sm text-destructive">
                        {errors.customerId.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Invoice Date</Label>
                    <Input
                      id="date"
                      type="date"
                      {...register("date")}
                    />
                    {errors.date && (
                      <p className="text-sm text-destructive">
                        {errors.date.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      {...register("dueDate")}
                    />
                    {errors.dueDate && (
                      <p className="text-sm text-destructive">
                        {errors.dueDate.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Items</CardTitle>
                    <CardDescription>Add items to the invoice</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        description: "",
                        quantity: 1,
                        rate: 0,
                        taxRate: 18,
                        hsnCode: "",
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-4 rounded-lg border p-4 md:grid-cols-6"
                  >
                    <div className="md:col-span-2 space-y-2">
                      <Label>Description</Label>
                      <Input
                        {...register(`items.${index}.description`)}
                        placeholder="Item description"
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-xs text-destructive">
                          {errors.items[index]?.description?.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>HSN Code</Label>
                      <Input
                        {...register(`items.${index}.hsnCode`)}
                        placeholder="HSN"
                      />
                      {errors.items?.[index]?.hsnCode && (
                        <p className="text-xs text-destructive">
                          {errors.items[index]?.hsnCode?.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-xs text-destructive">
                          {errors.items[index]?.quantity?.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Rate</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.rate`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.items?.[index]?.rate && (
                        <p className="text-xs text-destructive">
                          {errors.items[index]?.rate?.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Tax %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.taxRate`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.items?.[index]?.taxRate && (
                        <p className="text-xs text-destructive">
                          {errors.items[index]?.taxRate?.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {errors.items && (
                  <p className="text-sm text-destructive">{errors.items.message}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
