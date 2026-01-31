"use client";

import { useState, useEffect } from "react";
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
import { AlertTriangle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

/**
 * Cancel E-Way Bill Dialog Component
 * Government-style cancellation with strong warnings
 * 
 * Rules:
 * - Cancellation allowed ONLY:
 *   - Within 24 hours of generation
 *   - Goods movement not started
 * - Cancel reason mandatory
 */

// Cancel reason codes as per Government E-Way Bill Portal
const CANCEL_REASON_CODES = [
  { value: "1", label: "Duplicate E-Way Bill" },
  { value: "2", label: "Data Entry Mistake" },
  { value: "3", label: "Order Cancelled" },
  { value: "4", label: "Goods Not Moved" },
  { value: "5", label: "Other" },
] as const;

const cancelEWayBillSchema = z.object({
  cancelReasonCode: z.string().min(1, "Cancel reason is mandatory"),
  cancelRemarks: z
    .string()
    .min(1, "Cancel remarks are mandatory")
    .min(10, "Cancel remarks must be at least 10 characters"),
});

type CancelEWayBillFormData = z.infer<typeof cancelEWayBillSchema>;

interface CancelEWayBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ewayBill: {
    id: string;
    ewayBillNumber: string;
    status: "ACTIVE" | "EXPIRED" | "CANCELLED";
    createdAt: string;
    vehicleNumber?: string;
  };
  onSuccess?: () => void;
}

export function CancelEWayBillDialog({
  open,
  onOpenChange,
  ewayBill,
  onSuccess,
}: CancelEWayBillDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cancelReasonCode, setCancelReasonCode] = useState<string>("");
  const [cancelRemarks, setCancelRemarks] = useState<string>("");
  const [hoursRemaining, setHoursRemaining] = useState<number | null>(null);
  const [canCancel, setCanCancel] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CancelEWayBillFormData>({
    resolver: zodResolver(cancelEWayBillSchema),
    defaultValues: {
      cancelReasonCode: "",
      cancelRemarks: "",
    },
  });

  // Calculate hours remaining for cancellation (24-hour rule)
  useEffect(() => {
    if (!ewayBill.createdAt) return;

    const createdAt = new Date(ewayBill.createdAt);
    const now = new Date();
    const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = 24 - hoursElapsed;

    setHoursRemaining(hoursRemaining);
    setCanCancel(hoursRemaining > 0 && ewayBill.status === "ACTIVE");
  }, [ewayBill.createdAt, ewayBill.status]);

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setCancelReasonCode("");
      setCancelRemarks("");
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: CancelEWayBillFormData) => {
    // Validate: Only Active E-Way Bills allowed
    if (ewayBill.status !== "ACTIVE") {
      toast({
        title: "Cancellation Not Allowed",
        description: "Only Active E-Way Bills can be cancelled. Current status: " + ewayBill.status,
        variant: "destructive",
      });
      return;
    }

    // Validate: 24-hour rule
    if (!canCancel || (hoursRemaining !== null && hoursRemaining <= 0)) {
      toast({
        title: "Cancellation Not Allowed",
        description: "E-Way Bill cancellation is allowed only within 24 hours of generation. The 24-hour period has expired.",
        variant: "destructive",
      });
      return;
    }

    // Validate: Goods movement not started (if vehicle number is set, goods might have moved)
    if (ewayBill.vehicleNumber && ewayBill.vehicleNumber.trim().length > 0) {
      toast({
        title: "Cancellation Not Allowed",
        description: "Goods movement has started. E-Way Bill cannot be cancelled once vehicle details are updated.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        cancelReasonCode: data.cancelReasonCode,
        cancelRemarks: data.cancelRemarks.trim(),
        status: ewayBill.status,
        createdAt: ewayBill.createdAt,
      };

      // Call API route
      const response = await fetch(
        `/api/eway-bills/${ewayBill.ewayBillNumber}/cancel`,
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
        throw new Error(result.message || "Failed to cancel E-Way Bill");
      }

      toast({
        title: "Success",
        description: "E-Way Bill cancelled successfully. All actions have been disabled.",
      });

      handleOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Cancel E-Way Bill Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel E-Way Bill",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !canCancel || ewayBill.status !== "ACTIVE" || isLoading;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Cancel E-Way Bill
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <div>
              E-Way Bill: <strong>{ewayBill.ewayBillNumber}</strong>
            </div>
            {ewayBill.status !== "ACTIVE" && (
              <div className="text-destructive font-medium">
                ⚠️ Cancellation not allowed: Only Active E-Way Bills can be cancelled. Current status: {ewayBill.status}
              </div>
            )}
            {hoursRemaining !== null && hoursRemaining > 0 && hoursRemaining <= 24 && (
              <div className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time remaining for cancellation: {Math.floor(hoursRemaining)} hours {Math.floor((hoursRemaining % 1) * 60)} minutes
              </div>
            )}
            {hoursRemaining !== null && hoursRemaining <= 0 && (
              <div className="text-destructive font-medium">
                ⚠️ Cancellation not allowed: 24-hour period has expired
              </div>
            )}
            {ewayBill.vehicleNumber && ewayBill.vehicleNumber.trim().length > 0 && (
              <div className="text-destructive font-medium">
                ⚠️ Cancellation not allowed: Goods movement has started (Vehicle Number: {ewayBill.vehicleNumber})
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Government-style Strong Warning */}
        <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-base font-bold text-destructive">
                WARNING: E-Way Bill Cancellation
              </p>
              <div className="text-sm text-foreground space-y-1">
                <p className="font-medium">This action will:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Permanently cancel the E-Way Bill</li>
                  <li>Disable all further actions (Update Vehicle, Change Transporter, etc.)</li>
                  <li>This action cannot be undone</li>
                  <li>Ensure goods movement has not started before cancelling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Government Notice */}
        <div className="rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-3">
          <p className="text-xs text-amber-900 dark:text-amber-200">
            <strong>Important Notice:</strong> As per Government E-Way Bill Portal rules, cancellation is allowed only within 24 hours of generation and before goods movement starts. 
            Once cancelled, the E-Way Bill cannot be reactivated and all related actions will be permanently disabled.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Cancel Reason Code */}
          <div className="space-y-2">
            <Label htmlFor="cancelReasonCode">
              Cancel Reason <span className="text-red-500">*</span>
            </Label>
            <select
              id="cancelReasonCode"
              value={cancelReasonCode}
              onChange={(e) => {
                setCancelReasonCode(e.target.value);
                setValue("cancelReasonCode", e.target.value);
              }}
              disabled={isDisabled}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Cancel Reason</option>
              {CANCEL_REASON_CODES.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {errors.cancelReasonCode && (
              <p className="text-sm text-destructive">{errors.cancelReasonCode.message}</p>
            )}
          </div>

          {/* Cancel Remarks */}
          <div className="space-y-2">
            <Label htmlFor="cancelRemarks">
              Cancel Remarks <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="cancelRemarks"
              value={cancelRemarks}
              onChange={(e) => {
                setCancelRemarks(e.target.value);
                setValue("cancelRemarks", e.target.value);
              }}
              placeholder="Enter detailed cancellation remarks (minimum 10 characters)"
              rows={4}
              disabled={isDisabled}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.cancelRemarks && (
              <p className="text-sm text-destructive">{errors.cancelRemarks.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Provide detailed reason for cancellation (minimum 10 characters required)
            </p>
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
              variant="destructive"
              disabled={isDisabled || !cancelReasonCode || !cancelRemarks || cancelRemarks.trim().length < 10}
              title={
                !canCancel
                  ? "Cancellation not allowed: 24-hour period expired or goods movement started"
                  : ewayBill.status !== "ACTIVE"
                  ? "Only Active E-Way Bills can be cancelled"
                  : ""
              }
            >
              {isLoading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancel E-Way Bill"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
