"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader } from "@/components/common/loader";
import { TRANSPORT_MODES, VEHICLE_TYPES } from "@/constants/ewaybillMasterCodes";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/**
 * Update Vehicle Details Dialog Component
 * Government-style simple form for updating Part-B (Vehicle Details)
 * 
 * Rules:
 * - Allowed ONLY if E-Way Bill status = Active
 * - Allow update using: Vehicle Number OR Transport Document No + Date
 * - Multiple updates allowed
 * - Maintain full vehicle update history
 */

const updateVehicleSchema = z.object({
  vehicleNo: z.string().optional(),
  transMode: z.string().min(1, "Transport mode is required"),
  distance: z
    .string()
    .min(1, "Distance is required")
    .refine((val) => parseFloat(val) >= 0, "Distance must be >= 0"),
  transporterName: z.string().optional(),
  transporterId: z.string().optional(),
  vehicleType: z.string().optional(),
  transDocNo: z.string().optional(),
  transDocDate: z.string().optional(),
}).refine(
  (data) => {
    // Either vehicleNo OR (transDocNo + transDocDate) must be provided
    const hasVehicleNo = data.vehicleNo && data.vehicleNo.trim().length > 0;
    const hasTransDoc = data.transDocNo && data.transDocNo.trim().length > 0 && 
                       data.transDocDate && data.transDocDate.trim().length > 0;
    return hasVehicleNo || hasTransDoc;
  },
  {
    message: "Either Vehicle Number OR Transport Document No + Date must be provided",
    path: ["vehicleNo"],
  }
).refine(
  (data) => {
    // If vehicleNo is provided, validate format
    if (data.vehicleNo && data.vehicleNo.trim().length > 0) {
      const vehicleNoRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
      return vehicleNoRegex.test(data.vehicleNo.toUpperCase().replace(/\s/g, ""));
    }
    return true;
  },
  {
    message: "Vehicle number must be in format: XX##XX#### (e.g., MH12AB1234)",
    path: ["vehicleNo"],
  }
);

type UpdateVehicleFormData = z.infer<typeof updateVehicleSchema>;

interface UpdateVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ewayBill: {
    id: string;
    ewayBillNumber: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    vehicleNumber?: string;
    lastUpdatedVehicleNumber?: string;
    lastVehicleUpdateAt?: string;
  };
  onSuccess?: () => void;
}

export function UpdateVehicleDialog({
  open,
  onOpenChange,
  ewayBill,
  onSuccess,
}: UpdateVehicleDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [transDocDate, setTransDocDate] = useState<Date | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UpdateVehicleFormData>({
    resolver: zodResolver(updateVehicleSchema),
    defaultValues: {
      vehicleNo: ewayBill.vehicleNumber || ewayBill.lastUpdatedVehicleNumber || "",
      transMode: "1", // Default to Road
      distance: "",
      transporterName: "",
      transporterId: "",
      vehicleType: "",
      transDocNo: "",
      transDocDate: "",
    },
  });

  const vehicleNo = watch("vehicleNo");
  const transDocNo = watch("transDocNo");

  // Reset form when dialog opens/closes or ewayBill changes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setTransDocDate(null);
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: UpdateVehicleFormData) => {
    // Validate: Only Active E-Way Bills allowed
    if (ewayBill.status !== "ACTIVE") {
      toast({
        title: "Update Not Allowed",
        description: "Only Active E-Way Bills can be updated. Current status: " + ewayBill.status,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Format transDocDate if provided
      const formattedTransDocDate = transDocDate
        ? format(transDocDate, "dd/MM/yyyy")
        : undefined;

      // Build payload based on OR condition
      const payload: any = {
        transMode: data.transMode,
        distance: parseFloat(data.distance),
        status: ewayBill.status, // Pass status for validation
        transporterName: data.transporterName || undefined,
        transporterId: data.transporterId || undefined,
        vehicleType: data.vehicleType || undefined,
      };

      // Add vehicleNo if provided
      if (data.vehicleNo && data.vehicleNo.trim().length > 0) {
        payload.vehicleNo = data.vehicleNo.toUpperCase().replace(/\s/g, "");
      }

      // Add transport document details if provided
      if (data.transDocNo && data.transDocNo.trim().length > 0 && formattedTransDocDate) {
        payload.transDocNo = data.transDocNo.trim();
        payload.transDocDate = formattedTransDocDate;
      }

      // Call API route
      const response = await fetch(
        `/api/eway-bills/${ewayBill.ewayBillNumber}/update-vehicle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update vehicle details");
      }

      toast({
        title: "Success",
        description: "Vehicle details updated successfully",
      });

      handleOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Update Vehicle Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Vehicle Details (Part-B)</DialogTitle>
          <DialogDescription className="space-y-2">
            <div>
              E-Way Bill: <strong>{ewayBill.ewayBillNumber}</strong>
            </div>
            {ewayBill.status !== "ACTIVE" && (
              <div className="text-destructive font-medium">
                ⚠️ Update not allowed: Only Active E-Way Bills can be updated. Current status: {ewayBill.status}
              </div>
            )}
            {ewayBill.lastUpdatedVehicleNumber && (
              <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                <div className="font-medium">Last Updated Vehicle Details:</div>
                <div>Vehicle Number: {ewayBill.lastUpdatedVehicleNumber}</div>
                {ewayBill.lastVehicleUpdateAt && (
                  <div>Updated At: {format(new Date(ewayBill.lastVehicleUpdateAt), "dd/MM/yyyy HH:mm")}</div>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Government-style Info Box */}
          <div className="border border-border bg-muted/50 p-3 rounded-md text-sm">
            <p className="font-medium mb-1">Update Options:</p>
            <p className="text-muted-foreground">
              Provide <strong>Vehicle Number</strong> OR <strong>Transport Document No + Date</strong>
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Vehicle Number - Optional (OR condition) */}
            <div className="space-y-2">
              <Label htmlFor="vehicleNo">
                Vehicle Number <span className="text-muted-foreground text-xs">(Option 1)</span>
              </Label>
              <Input
                id="vehicleNo"
                placeholder="e.g., MH12AB1234"
                {...register("vehicleNo")}
                className={errors.vehicleNo ? "border-destructive" : ""}
                onChange={(e) => {
                  // Auto-uppercase and remove spaces
                  const value = e.target.value.toUpperCase().replace(/\s/g, "");
                  e.target.value = value;
                  register("vehicleNo").onChange(e);
                }}
              />
              {errors.vehicleNo && (
                <p className="text-sm text-destructive">{errors.vehicleNo.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Format: XX##XX#### (e.g., MH12AB1234)
              </p>
            </div>

            {/* Transport Mode - Required */}
            <div className="space-y-2">
              <Label htmlFor="transMode">
                Transport Mode <span className="text-red-500">*</span>
              </Label>
              <select
                id="transMode"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("transMode")}
              >
                {TRANSPORT_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
              {errors.transMode && (
                <p className="text-sm text-destructive">{errors.transMode.message}</p>
              )}
            </div>

            {/* Distance - Required */}
            <div className="space-y-2">
              <Label htmlFor="distance">
                Distance (in KM) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("distance")}
                className={errors.distance ? "border-destructive" : ""}
              />
              {errors.distance && (
                <p className="text-sm text-destructive">{errors.distance.message}</p>
              )}
            </div>

            {/* Vehicle Type - Optional */}
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type (Optional)</Label>
              <select
                id="vehicleType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register("vehicleType")}
              >
                <option value="">Select Vehicle Type</option>
                {VEHICLE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Transporter Name - Optional */}
            <div className="space-y-2">
              <Label htmlFor="transporterName">Transporter Name (Optional)</Label>
              <Input
                id="transporterName"
                placeholder="Enter transporter name"
                {...register("transporterName")}
              />
            </div>

            {/* Transporter ID (GSTIN) - Optional */}
            <div className="space-y-2">
              <Label htmlFor="transporterId">Transporter ID / GSTIN (Optional)</Label>
              <Input
                id="transporterId"
                placeholder="15 digit GSTIN"
                maxLength={15}
                {...register("transporterId")}
              />
            </div>

            {/* Transport Document Number - Optional (OR condition) */}
            <div className="space-y-2">
              <Label htmlFor="transDocNo">
                Transport Document No <span className="text-muted-foreground text-xs">(Option 2)</span>
              </Label>
              <Input
                id="transDocNo"
                placeholder="Enter document number"
                {...register("transDocNo")}
                className={errors.transDocNo ? "border-destructive" : ""}
              />
              {errors.transDocNo && (
                <p className="text-sm text-destructive">{errors.transDocNo.message}</p>
              )}
            </div>

            {/* Transport Document Date - Required if transDocNo provided */}
            <div className="space-y-2">
              <Label htmlFor="transDocDate">
                Transport Document Date <span className="text-muted-foreground text-xs">(Required if Document No provided)</span>
              </Label>
              <DatePicker
                selected={transDocDate}
                onChange={(date) => {
                  setTransDocDate(date);
                  setValue("transDocDate", date ? format(date, "dd/MM/yyyy") : "");
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                maxDate={new Date()}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                wrapperClassName="w-full"
              />
              {errors.transDocDate && (
                <p className="text-sm text-destructive">{errors.transDocDate.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || ewayBill.status !== "ACTIVE"}
              title={ewayBill.status !== "ACTIVE" ? "Only Active E-Way Bills can be updated" : ""}
            >
              {isLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                "Update Vehicle Details"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
