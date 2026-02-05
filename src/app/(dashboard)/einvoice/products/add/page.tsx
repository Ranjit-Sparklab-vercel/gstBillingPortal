"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { ROUTES } from "@/constants";

// Product Form Schema - Only Basic Information
const productFormSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  hsn: z.string().min(1, "HSN code is required"),
  isService: z.enum(["Y", "N"]).default("N"), // Y for Service, N for Product
  batchNumber: z.string().optional(), // Batch Details
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function AddProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productName: "",
      hsn: "",
      isService: "N",
      batchNumber: "",
    },
  });

  const onSubmit = (data: ProductFormData) => {
    setIsSubmitting(true);
    
    // Frontend only - no API or Database call
    // Just show success message and navigate
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Product form submitted successfully!",
      });

      // Navigate back to E-Invoice dashboard
      router.push(ROUTES.EINVOICE.ROOT);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(ROUTES.EINVOICE.ROOT)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Product</h1>
          <p className="text-muted-foreground">
            Add a new product to your E-Invoice system
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              Enter product details. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                {/* Product Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="productName">
                    Product Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="productName"
                    placeholder="Enter product name"
                    {...register("productName")}
                  />
                  {errors.productName && (
                    <p className="text-sm text-destructive">
                      {errors.productName.message}
                    </p>
                  )}
                </div>

                {/* HSN Code */}
                <div className="space-y-2">
                  <Label htmlFor="hsn">
                    HSN Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="hsn"
                    placeholder="Enter HSN code"
                    {...register("hsn")}
                  />
                  {errors.hsn && (
                    <p className="text-sm text-destructive">
                      {errors.hsn.message}
                    </p>
                  )}
                </div>

                {/* Is Service */}
                <div className="space-y-2">
                  <Label htmlFor="isService">Type</Label>
                  <select
                    id="isService"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("isService")}
                  >
                    <option value="N">Product</option>
                    <option value="Y">Service</option>
                  </select>
                </div>

                {/* Batch Number */}
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    placeholder="Enter batch number (optional)"
                    {...register("batchNumber")}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ROUTES.EINVOICE.ROOT)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Product"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
