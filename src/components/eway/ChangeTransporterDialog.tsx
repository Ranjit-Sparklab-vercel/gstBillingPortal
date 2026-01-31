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
import { AlertTriangle } from "lucide-react";

/**
 * Change Transporter Dialog Component
 * Confirmation modal required before changing transporter
 * 
 * Rules:
 * - Only Active E-Way Bills allowed
 * - New Transporter ID mandatory
 * - Old transporter access revoked
 */

const changeTransporterSchema = z.object({
  newTransporterId: z
    .string()
    .min(15, "Transporter ID must be 15 characters (GSTIN)")
    .max(15, "Transporter ID must be 15 characters (GSTIN)")
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GSTIN format. Must be 15 characters: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric"
    ),
  newTransporterName: z.string().optional(),
});

type ChangeTransporterFormData = z.infer<typeof changeTransporterSchema>;

interface ChangeTransporterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ewayBill: {
    id: string;
    ewayBillNumber: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    transporterName?: string;
    transporterId?: string;
  };
  onSuccess?: () => void;
}

export function ChangeTransporterDialog({
  open,
  onOpenChange,
  ewayBill,
  onSuccess,
}: ChangeTransporterDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState<ChangeTransporterFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ChangeTransporterFormData>({
    resolver: zodResolver(changeTransporterSchema),
    defaultValues: {
      newTransporterId: "",
      newTransporterName: "",
    },
  });

  const newTransporterId = watch("newTransporterId");

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setShowConfirmation(false);
      setFormData(null);
    }
    onOpenChange(newOpen);
  };

  // Step 1: Validate and show confirmation
  const onFormSubmit = (data: ChangeTransporterFormData) => {
    // Validate: Only Active E-Way Bills allowed
    if (ewayBill.status !== "ACTIVE") {
      toast({
        title: "Change Not Allowed",
        description: "Only Active E-Way Bills can change transporter. Current status: " + ewayBill.status,
        variant: "destructive",
      });
      return;
    }

    // Validate: New Transporter ID must be different from current
    if (ewayBill.transporterId && data.newTransporterId.toUpperCase() === ewayBill.transporterId.toUpperCase()) {
      toast({
        title: "Invalid Transporter",
        description: "New transporter ID must be different from current transporter ID",
        variant: "destructive",
      });
      return;
    }

    setFormData(data);
    setShowConfirmation(true);
  };

  // Step 2: Confirm and submit
  const onConfirmSubmit = async () => {
    if (!formData) return;

    setIsLoading(true);

    try {
      const payload = {
        newTransporterId: formData.newTransporterId.toUpperCase().replace(/\s/g, ""),
        newTransporterName: formData.newTransporterName?.trim() || undefined,
        oldTransporterId: ewayBill.transporterId || undefined,
        status: ewayBill.status, // Pass status for validation
      };

      // Call API route
      const response = await fetch(
        `/api/eway-bills/${ewayBill.ewayBillNumber}/change-transporter`,
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
        throw new Error(result.message || "Failed to change transporter");
      }

      toast({
        title: "Success",
        description: "Transporter changed successfully. Old transporter access has been revoked.",
      });

      handleOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Change Transporter Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to change transporter",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If showing confirmation, show confirmation modal
  if (showConfirmation && formData) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Transporter Change
            </DialogTitle>
            <DialogDescription>
              Please confirm that you want to change the transporter for this E-Way Bill.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Government-style Warning Box */}
            <div className="rounded-lg border-2 border-destructive bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-bold text-destructive">
                    WARNING: Transporter Change Confirmation
                  </p>
                  <div className="text-sm text-foreground space-y-1">
                    <p className="font-medium">This action will:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Immediately revoke access for the old transporter</li>
                      <li>Assign the E-Way Bill to the new transporter</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Details Box */}
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-muted-foreground">E-Way Bill Number:</span>
                  <span className="font-semibold">{ewayBill.ewayBillNumber}</span>
                </div>
                
                {ewayBill.transporterId && (
                  <>
                    <div className="flex justify-between items-start pt-2 border-t">
                      <span className="font-medium text-muted-foreground">Current Transporter ID:</span>
                      <span className="font-semibold text-destructive">{ewayBill.transporterId}</span>
                    </div>
                    {ewayBill.transporterName && (
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-muted-foreground">Current Transporter Name:</span>
                        <span className="font-semibold">{ewayBill.transporterName}</span>
                      </div>
                    )}
                  </>
                )}
                
                <div className="flex justify-between items-start pt-2 border-t border-primary/20">
                  <span className="font-medium text-muted-foreground">New Transporter ID:</span>
                  <span className="font-semibold text-primary">{formData.newTransporterId.toUpperCase()}</span>
                </div>
                {formData.newTransporterName && (
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-muted-foreground">New Transporter Name:</span>
                    <span className="font-semibold">{formData.newTransporterName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Government-style Notice */}
            <div className="rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-3">
              <p className="text-xs text-amber-900 dark:text-amber-200">
                <strong>Note:</strong> As per Government E-Way Bill Portal rules, the old transporter's access will be revoked immediately upon confirmation. 
                Please ensure you have entered the correct new transporter details.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirmSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Changing...
                </>
              ) : (
                "Confirm Change Transporter"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Show form
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Change Transporter</DialogTitle>
          <DialogDescription className="space-y-2">
            <div>
              E-Way Bill: <strong>{ewayBill.ewayBillNumber}</strong>
            </div>
            {ewayBill.status !== "ACTIVE" && (
              <div className="text-destructive font-medium">
                ⚠️ Change not allowed: Only Active E-Way Bills can change transporter. Current status: {ewayBill.status}
              </div>
            )}
            {ewayBill.transporterId && (
              <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                <div className="font-medium">Current Transporter:</div>
                <div>ID: {ewayBill.transporterId}</div>
                {ewayBill.transporterName && (
                  <div>Name: {ewayBill.transporterName}</div>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-4">
            {/* New Transporter ID - Required */}
            <div className="space-y-2">
              <Label htmlFor="newTransporterId">
                New Transporter ID (GSTIN) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="newTransporterId"
                placeholder="Enter 15-digit GSTIN (e.g., 29FTHPK8890K1ZN)"
                maxLength={15}
                {...register("newTransporterId")}
                className={errors.newTransporterId ? "border-destructive" : ""}
                onChange={(e) => {
                  // Auto-uppercase and remove spaces
                  const value = e.target.value.toUpperCase().replace(/\s/g, "");
                  e.target.value = value;
                  register("newTransporterId").onChange(e);
                }}
              />
              {errors.newTransporterId && (
                <p className="text-sm text-destructive">{errors.newTransporterId.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be a valid 15-character GSTIN. Old transporter access will be revoked.
              </p>
            </div>

            {/* New Transporter Name - Optional */}
            <div className="space-y-2">
              <Label htmlFor="newTransporterName">New Transporter Name (Optional)</Label>
              <Input
                id="newTransporterName"
                placeholder="Enter transporter name"
                {...register("newTransporterName")}
              />
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
              title={ewayBill.status !== "ACTIVE" ? "Only Active E-Way Bills can change transporter" : ""}
            >
              {isLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
